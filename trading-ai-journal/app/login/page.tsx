export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-8 shadow-2xl">

        <h1 className="text-3xl font-bold text-center mb-2">
          Welcome Back
        </h1>

        <p className="text-center text-gray-400 mb-8">
          Sign in to your Trading AI Journal
        </p>

        <form className="space-y-5">

          <div>
            <label className="block mb-2">Email</label>

            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-3"
            />
          </div>

          <div>
            <label className="block mb-2">Password</label>

            <input
              type="password"
              placeholder="********"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-3"
            />
          </div>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-semibold"
          >
            Login
          </button>

        </form>

        <p className="text-center text-gray-400 mt-6">
          Don't have an account? Register
        </p>

      </div>
    </main>
  );
}