import { useState } from "react";
import { adminApi } from "../../api/adminApi";
import Button from "../../components/ui/Button";
import { saveAdminSession } from "../../utils/session";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await adminApi.login(email, password);
      if (data.user?.role !== "admin") throw new Error("This account does not have administrator access.");
      saveAdminSession(data);
      onLogin(data);
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[.9fr_1.1fr]"><section className="mx-auto flex w-full max-w-[470px] flex-col justify-center px-6 py-12 sm:px-12"><span className="grid h-14 w-14 place-items-center rounded-lg bg-brand-600 text-sm font-extrabold text-white">HS</span><p className="mt-5 text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Harmain Sharfain</p><h1 className="mt-2 text-3xl font-extrabold leading-tight text-slate-900">Restaurant control room</h1><p className="mt-3 text-sm leading-6 text-slate-500">Sign in with an administrator account to manage menu and orders.</p><form className="mt-9 grid gap-5" onSubmit={submit}><label className="grid gap-2 text-sm font-bold text-slate-700"><span>Email address</span><input className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-brand-600 focus:ring-4 focus:ring-red-100" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="admin@example.com" required /></label><label className="grid gap-2 text-sm font-bold text-slate-700"><span>Password</span><span className="flex items-center overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-red-100"><input className="h-11 min-w-0 flex-1 border-0 px-3 outline-none" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter password" required /><button type="button" className="mr-2 text-xs font-extrabold text-brand-700" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></span></label>{error && <p className="border-l-4 border-brand-600 bg-red-50 px-3 py-3 text-sm font-bold text-brand-700" role="alert">{error}</p>}<Button type="submit" className="mt-1 h-12 w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in securely"}</Button></form></section><aside className="hidden min-h-screen flex-col justify-between bg-brand-600 p-14 text-white lg:flex"><div><p className="text-[11px] font-extrabold uppercase tracking-wide text-red-100">Private operations</p><h2 className="mt-3 max-w-xl text-5xl font-extrabold leading-[1.05]">Keep the kitchen, menu, and orders in rhythm.</h2></div><div className="grid max-w-md gap-3 text-sm text-red-100"><span className="border-t border-red-200/30 pt-3">Menu availability and stock</span><span className="border-t border-red-200/30 pt-3">Order progress and payment status</span><span className="border-t border-red-200/30 pt-3">Admin-only access verified by server</span></div></aside></main>;
}
