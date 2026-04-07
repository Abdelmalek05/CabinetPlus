"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleHelp,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { loginAction } from "@/app/(auth)/login/actions";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Veuillez renseigner votre identifiant et votre mot de passe.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await loginAction(username, password);

    if (!result.ok) {
      setError(result.message ?? "Echec de connexion. Verifiez vos identifiants.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07172e] text-white">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-30 left-1/4 h-96 w-96 rounded-full bg-sky-300/10 blur-3xl" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-size-[26px_26px] opacity-30" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight">CabinetPlus</h1>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Medical Suite</p>
            </div>
          </div>

          <h2 className="max-w-xl font-headline text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
            Un espace clinique moderne, securise et rapide.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200/80">
            Centralisez vos consultations, vos rendez-vous et vos recettes dans une interface unique pensee pour le rythme du cabinet.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            <FeatureCard icon={ShieldCheck} title="Acces protege" text="Session securisee par cookie HttpOnly." />
            <FeatureCard icon={Sparkles} title="Flux intelligent" text="Navigation medicale fluide et rapide." />
          </div>
        </section>

        <section className="w-full">
          <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/15 bg-white/8 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-headline text-lg font-bold leading-none">CabinetPlus</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/70">Medical Suite</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-100">
                Espace medecin
              </span>
            </div>

            <div className="mb-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <Lock className="h-5 w-5 text-cyan-100" />
              </div>
              <h3 className="font-headline text-3xl font-extrabold tracking-tight">Connexion</h3>
              <p className="mt-1 text-sm text-slate-200/75">Saisissez vos identifiants pour acceder au tableau de bord.</p>
            </div>

            <form onSubmit={submitLogin} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-100/70">Nom d&apos;utilisateur</span>
                <div className="group relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-emerald-200" />
                  <input
                    className="w-full rounded-2xl border border-white/15 bg-[#0a1f3f]/70 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-300/40 outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/20"
                    placeholder="Identifiant"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-100/70">Mot de passe</span>
                <div className="group relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-emerald-200" />
                  <input
                    className="w-full rounded-2xl border border-white/15 bg-[#0a1f3f]/70 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-300/40 outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/20"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </label>

              {error ? <p className="rounded-xl border border-rose-300/40 bg-rose-400/15 px-3 py-2 text-sm font-medium text-rose-100">{error}</p> : null}

              <button
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-400 to-cyan-400 px-5 py-3.5 font-headline text-base font-extrabold tracking-wide text-[#06213f] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? "Connexion..." : "Se connecter"}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-200/75 sm:flex-row sm:items-center sm:justify-between">
              <Link className="inline-flex items-center gap-2 font-medium transition-colors hover:text-white" href="/contact">
                <CircleHelp className="h-4 w-4" />
                Assistance technique
              </Link>
              <div className="flex gap-4">
                <Link className="transition-colors hover:text-white" href="/contact">Confidentialite</Link>
                <Link className="transition-colors hover:text-white" href="/contact">Conditions</Link>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-xs font-medium tracking-wide text-slate-300/70 lg:hidden">
            Plateforme CabinetPlus pour la gestion quotidienne du cabinet medical.
          </p>
          <div className="mt-8 hidden items-center justify-center gap-2 text-xs text-slate-300/65 lg:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>Connexion chiffree et session securisee</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/6 p-4 backdrop-blur-md">
      <Icon className="h-5 w-5 text-emerald-300" />
      <p className="mt-2 font-headline text-base font-bold text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-200/75">{text}</p>
    </div>
  );
}
