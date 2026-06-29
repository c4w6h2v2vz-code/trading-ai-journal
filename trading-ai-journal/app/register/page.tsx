export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-8 shadow-2xl">

        <h1 className="text-3xl font-bold text-center mb-2">
          Create Account
        </h1>

        <p className="text-center text-gray-400 mb-8">
          Join Trading AI Journal today
        </p>

        <form className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-3"
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-3"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-3"
          />

          <button className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-semibold">
            Create Account
          </button>

        </form>

      </div>
    </main>
  );
}