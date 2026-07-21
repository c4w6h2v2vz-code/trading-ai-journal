#property strict

input string ApiUrl = "https://www.piptrak.com/api/mt5";
input string SecretKey = "jama-ftmo-mt5-2026";
input double DailyLossLimitPercent = 3.0;
input bool UseRemoteSettings = true;
input bool EnableProfitLock = false;
input double DailyProfitTargetPercent = 10.0;
input bool EnableAutoClose = true;
input int SignalCheckInterval = 30;

double startOfDayBalance = 0;
bool tradingBlocked = false;
double activeLossLimit = 3.0;
bool guardianEnabled = true;
datetime lastSettingsFetch = 0;

int OnInit()
{
   Print("=== TradingAIConnector v2 STARTED ===");
   Print("Account: ", AccountInfoInteger(ACCOUNT_LOGIN));
   startOfDayBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   activeLossLimit = DailyLossLimitPercent;
   EventSetTimer(SignalCheckInterval);

   if (UseRemoteSettings) FetchSettings();
   ScanHistory();

   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("TradingAIConnector stopped");
}

void FetchSettings()
{
   char result[];
   string resultHeaders;
   char postData[];

   string url = ApiUrl + "/settings?account=" + IntegerToString((int)AccountInfoInteger(ACCOUNT_LOGIN));

   int status = WebRequest("GET", url, "x-mt5-secret: " + SecretKey + "\r\n", 5000, postData, result, resultHeaders);

   if (status != 200)
   {
      Print("Settings fetch FAILED, status: ", status, " - using local limit: ", DailyLossLimitPercent, "%");
      return;
   }

   string response = CharArrayToString(result);

   int limStart = StringFind(response, "\"daily_loss_limit\":");
   if (limStart >= 0)
   {
      limStart += 19;
      int limEnd = StringFind(response, ",", limStart);
      if (limEnd < 0) limEnd = StringFind(response, "}", limStart);
      double remoteLimit = StringToDouble(StringSubstr(response, limStart, limEnd - limStart));
      if (remoteLimit > 0 && remoteLimit <= 50) activeLossLimit = remoteLimit;
   }

   int enStart = StringFind(response, "\"risk_guardian_enabled\":");
   if (enStart >= 0)
   {
      enStart += 24;
      guardianEnabled = (StringFind(StringSubstr(response, enStart, 6), "true") >= 0);
   }

   Print(">>> Settings synced from PipTrak - Loss limit: ", activeLossLimit, "% | Guardian: ", guardianEnabled ? "ON" : "OFF");
   lastSettingsFetch = TimeCurrent();
}

void OnTimer()
{
   if (UseRemoteSettings && TimeCurrent() - lastSettingsFetch >= 60)
      FetchSettings();

   CheckForSignals();
}

void OnTick()
{
   if (!EnableAutoClose) return;
   if (UseRemoteSettings && !guardianEnabled) return;

   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   double dailyPL = currentEquity - startOfDayBalance;
   double dailyPLPercent = (dailyPL / startOfDayBalance) * 100;

   double limitToUse = UseRemoteSettings ? activeLossLimit : DailyLossLimitPercent;

   if (dailyPLPercent <= -limitToUse && !tradingBlocked)
   {
      tradingBlocked = true;
      Print("DAILY LOSS LIMIT HIT: ", dailyPLPercent, "% (limit ", limitToUse, "%) - Closing all!");
      CloseAllTrades();
      SendAlert(dailyPLPercent, "loss_limit");
   }

   if (EnableProfitLock && dailyPLPercent >= DailyProfitTargetPercent && !tradingBlocked)
   {
      tradingBlocked = true;
      Print("PROFIT TARGET HIT: ", dailyPLPercent, "% - Locking profits!");
      CloseAllTrades();
      SendAlert(dailyPLPercent, "profit_target");
   }
}

void CheckForSignals()
{
   if (tradingBlocked) return;

   char result[];
   string resultHeaders;
   char postData[];

   string url = ApiUrl + "/signals?account=" + IntegerToString((int)AccountInfoInteger(ACCOUNT_LOGIN));

   int status = WebRequest("GET", url, "x-mt5-secret: " + SecretKey + "\r\n", 5000, postData, result, resultHeaders);

   if (status != 200) return;

   string response = CharArrayToString(result);
   if (StringFind(response, "\"symbol\"") < 0) return;

   int symStart = StringFind(response, "\"symbol\":\"") + 10;
   int symEnd = StringFind(response, "\"", symStart);
   string symbol = StringSubstr(response, symStart, symEnd - symStart);

   int typeStart = StringFind(response, "\"type\":\"") + 8;
   int typeEnd = StringFind(response, "\"", typeStart);
   string tradeType = StringSubstr(response, typeStart, typeEnd - typeStart);

   int lotStart = StringFind(response, "\"lot\":") + 6;
   int lotEnd = StringFind(response, ",", lotStart);
   double lot = StringToDouble(StringSubstr(response, lotStart, lotEnd - lotStart));

   int slStart = StringFind(response, "\"sl\":") + 5;
   int slEnd = StringFind(response, ",", slStart);
   double slPips = StringToDouble(StringSubstr(response, slStart, slEnd - slStart));

   int tpStart = StringFind(response, "\"tp\":") + 5;
   int tpEnd = StringFind(response, "}", tpStart);
   double tpPips = StringToDouble(StringSubstr(response, tpStart, tpEnd - tpStart));

   if (symbol == "" || lot <= 0) return;

   Print("Signal received: ", tradeType, " ", symbol, " Lot:", lot);
   ExecuteTrade(symbol, tradeType, lot, slPips, tpPips);
}

void ExecuteTrade(string symbol, string type, double lot, double slPips, double tpPips)
{
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   double pipValue = (digits == 3 || digits == 5) ? point * 10 : point;

   MqlTradeRequest request = {};
   MqlTradeResult result = {};

   request.action = TRADE_ACTION_DEAL;
   request.symbol = symbol;
   request.volume = lot;
   request.deviation = 10;
   request.magic = 12345;
   request.comment = "PipTrak_Auto";

   if (type == "BUY")
   {
      request.type = ORDER_TYPE_BUY;
      request.price = SymbolInfoDouble(symbol, SYMBOL_ASK);
      request.sl = request.price - slPips * pipValue;
      request.tp = request.price + tpPips * pipValue;
   }
   else
   {
      request.type = ORDER_TYPE_SELL;
      request.price = SymbolInfoDouble(symbol, SYMBOL_BID);
      request.sl = request.price + slPips * pipValue;
      request.tp = request.price - tpPips * pipValue;
   }

   bool sent = OrderSend(request, result);
   Print("Trade executed: ", sent, " RetCode: ", result.retcode);
}

void CloseAllTrades()
{
   for (int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if (ticket == 0) continue;

      MqlTradeRequest request = {};
      MqlTradeResult result = {};

      request.action = TRADE_ACTION_DEAL;
      request.position = ticket;
      request.symbol = PositionGetString(POSITION_SYMBOL);
      request.volume = PositionGetDouble(POSITION_VOLUME);
      request.type = PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
      request.price = PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY
         ? SymbolInfoDouble(request.symbol, SYMBOL_BID)
         : SymbolInfoDouble(request.symbol, SYMBOL_ASK);
      request.deviation = 10;
      request.comment = "RiskGuardian";

      OrderSend(request, result);
      Print("Closed position: ", ticket, " Result: ", result.retcode);
   }
}

void SendAlert(double percent, string reason)
{
   string json =
      "{"
      "\"source\":\"MT5\","
      "\"event\":\"" + reason + "\","
      "\"account\":\"" + IntegerToString((int)AccountInfoInteger(ACCOUNT_LOGIN)) + "\","
      "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\","
      "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ","
      "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ","
      "\"lossPercent\":" + DoubleToString(percent, 2) + ","
      "\"ticket\":\"0\","
      "\"symbol\":\"RISK_GUARDIAN\","
      "\"type\":\"ALERT\","
      "\"lotSize\":0,"
      "\"entryPrice\":0,"
      "\"exitPrice\":0,"
      "\"stopLoss\":0,"
      "\"takeProfit\":0,"
      "\"profit\":0,"
      "\"openedAt\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\","
      "\"closedAt\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\""
      "}";
   SendJson(json);
}

void ScanHistory()
{
   HistorySelect(0, TimeCurrent());
   int total = HistoryDealsTotal();
   Print(">>> Scanning ", total, " deals in history...");

   int sent = 0;
   for(int i = 0; i < total; i++)
   {
      ulong deal = HistoryDealGetTicket(i);
      if(deal == 0) continue;

      long entry = HistoryDealGetInteger(deal, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT) continue;

      string symbol = HistoryDealGetString(deal, DEAL_SYMBOL);
      double profit = HistoryDealGetDouble(deal, DEAL_PROFIT);
      double volume = HistoryDealGetDouble(deal, DEAL_VOLUME);
      double exitPrice = HistoryDealGetDouble(deal, DEAL_PRICE);
      datetime closeTime = (datetime)HistoryDealGetInteger(deal, DEAL_TIME);
      long positionId = HistoryDealGetInteger(deal, DEAL_POSITION_ID);

      double entryPrice = 0;
      datetime openTime = 0;
      string tradeType = "UNKNOWN";

      for(int j = 0; j < total; j++)
      {
         ulong oldDeal = HistoryDealGetTicket(j);
         if(HistoryDealGetInteger(oldDeal, DEAL_POSITION_ID) == positionId &&
            HistoryDealGetInteger(oldDeal, DEAL_ENTRY) == DEAL_ENTRY_IN)
         {
            entryPrice = HistoryDealGetDouble(oldDeal, DEAL_PRICE);
            openTime = (datetime)HistoryDealGetInteger(oldDeal, DEAL_TIME);
            long dealType = HistoryDealGetInteger(oldDeal, DEAL_TYPE);
            tradeType = dealType == DEAL_TYPE_BUY ? "BUY" : "SELL";
            break;
         }
      }

      SendTrade(deal, symbol, profit, volume, exitPrice, closeTime, entryPrice, openTime, tradeType);
      sent++;
   }
   Print(">>> History scan complete. Sent ", sent, " closed trades.");
}

void OnTradeTransaction(
   const MqlTradeTransaction &trans,
   const MqlTradeRequest &request,
   const MqlTradeResult &result
)
{
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD) return;

   ulong deal = trans.deal;
   if(!HistoryDealSelect(deal)) return;

   long entry = HistoryDealGetInteger(deal, DEAL_ENTRY);
   if(entry != DEAL_ENTRY_OUT) return;

   string symbol = HistoryDealGetString(deal, DEAL_SYMBOL);
   double profit = HistoryDealGetDouble(deal, DEAL_PROFIT);
   double volume = HistoryDealGetDouble(deal, DEAL_VOLUME);
   double exitPrice = HistoryDealGetDouble(deal, DEAL_PRICE);
   datetime closeTime = (datetime)HistoryDealGetInteger(deal, DEAL_TIME);
   long positionId = HistoryDealGetInteger(deal, DEAL_POSITION_ID);

   double entryPrice = 0;
   datetime openTime = 0;
   string tradeType = "UNKNOWN";

   HistorySelect(0, TimeCurrent());
   for(int i = HistoryDealsTotal() - 1; i >= 0; i--)
   {
      ulong oldDeal = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(oldDeal, DEAL_POSITION_ID) == positionId &&
         HistoryDealGetInteger(oldDeal, DEAL_ENTRY) == DEAL_ENTRY_IN)
      {
         entryPrice = HistoryDealGetDouble(oldDeal, DEAL_PRICE);
         openTime = (datetime)HistoryDealGetInteger(oldDeal, DEAL_TIME);
         long dealType = HistoryDealGetInteger(oldDeal, DEAL_TYPE);
         tradeType = dealType == DEAL_TYPE_BUY ? "BUY" : "SELL";
         break;
      }
   }

   SendTrade(deal, symbol, profit, volume, exitPrice, closeTime, entryPrice, openTime, tradeType);
}

void SendTrade(ulong deal, string symbol, double profit, double volume, double exitPrice,
               datetime closeTime, double entryPrice, datetime openTime, string tradeType)
{
   string json =
      "{"
      "\"source\":\"MT5\","
      "\"event\":\"closed_trade\","
      "\"account\":\"" + IntegerToString((int)AccountInfoInteger(ACCOUNT_LOGIN)) + "\","
      "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\","
      "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ","
      "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ","
      "\"ticket\":\"" + IntegerToString((int)deal) + "\","
      "\"symbol\":\"" + symbol + "\","
      "\"type\":\"" + tradeType + "\","
      "\"lotSize\":" + DoubleToString(volume, 2) + ","
      "\"entryPrice\":" + DoubleToString(entryPrice, 5) + ","
      "\"exitPrice\":" + DoubleToString(exitPrice, 5) + ","
      "\"stopLoss\":0,"
      "\"takeProfit\":0,"
      "\"profit\":" + DoubleToString(profit, 2) + ","
      "\"openedAt\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\","
      "\"closedAt\":\"" + TimeToString(closeTime, TIME_DATE|TIME_SECONDS) + "\""
      "}";
   SendJson(json);
}

void SendJson(string json)
{
   char postData[];
   char result[];
   string resultHeaders;
   int dataSize = StringToCharArray(json, postData, 0, StringLen(json), CP_UTF8);
   ArrayResize(postData, dataSize);
   string headers =
      "Content-Type: application/json\r\n"
      "x-mt5-secret: " + SecretKey + "\r\n";
   int status = WebRequest("POST", ApiUrl, headers, 10000, postData, result, resultHeaders);
   Print("Sent trade -> Status: ", status);
}