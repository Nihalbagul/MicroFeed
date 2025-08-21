
import "./globals.css";
import { createServerClient } from "../lib/db";

export const metadata = {
  title: "Micro Feed",
  description: "Tiny feed app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    return (
      <html lang="en">
        <body className="container mx-auto p-4 bg-slate-900 text-white min-h-screen">
          <header className="mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Micro Feed
            </h1>
            {session ? (
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-slate-400">
                  Welcome, {session.user.email}
                </span>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    className="relative px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden group bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:scale-105 focus:outline-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
                    <span className="relative z-10">Sign Out</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                <form action="/api/auth/signup" method="post" className="flex flex-wrap gap-2">
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    className="border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    className="border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="relative px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:scale-105 focus:outline-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
                    <span className="relative z-10">Sign Up</span>
                  </button>
                  <button
                    formAction="/api/auth/signin"
                    className="relative px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden group bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:scale-105 focus:outline-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
                    <span className="relative z-10">Sign In</span>
                  </button>
                </form>
              </div>
            )}
          </header>
          <main className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl p-4 shadow-2xl shadow-black/30 backdrop-blur-sm">
            {children}
          </main>
        </body>
      </html>
    );
  } catch (error) {
    console.error('Layout error:', error);
    // Fallback UI when auth fails
    return (
      <html lang="en">
        <body className="container mx-auto p-4 bg-slate-900 text-white min-h-screen">
          <header className="mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Micro Feed
            </h1>
            <div className="space-y-2 mt-2">
              <form action="/api/auth/signup" method="post" className="flex flex-wrap gap-2">
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  className="border border-slate-600 rounded-lg px-3 py-2 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                />
                <button
                  type="submit"
                  className="relative px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:scale-105 focus:outline-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
                  <span className="relative z-10">Sign Up</span>
                </button>
                <button
                  formAction="/api/auth/signin"
                  className="relative px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden group bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:scale-105 focus:outline-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
                  <span className="relative z-10">Sign In</span>
                </button>
              </form>
            </div>
          </header>
          <main className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl p-4 shadow-2xl shadow-black/30 backdrop-blur-sm">
            {children}
          </main>
        </body>
      </html>
    );
  }
}
