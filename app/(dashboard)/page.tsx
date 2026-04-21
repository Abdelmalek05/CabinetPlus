"use client";

import {
  Activity,
  BarChart3,
  CalendarCheck,
  Edit,
  Eye,
  Heart,
  ListTodo,
  Search as SearchIcon,
  Settings,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { MOCK_PATIENTS } from "@/app/constants";
import type { Patient } from "@/app/types";
import { cn } from "@/app/lib/utils";

/* ------------------------------------------------------------------ */
/* Types for the Electron IPC bridge exposed on window.cabinet         */
/* ------------------------------------------------------------------ */

type CabinetBridge = {
  patients: {
    list: (options?: { query?: string; familyStatus?: string; limit?: number; offset?: number }) => Promise<{ items: Patient[]; total: number }>;
    count: () => Promise<number>;
  };
  appointments: {
    countByDate: (date: string) => Promise<number>;
  };
  revenue: {
    total: (range: { startDate: string; endDate: string }) => Promise<number>;
  };
};

function getCabinet(): CabinetBridge | null {
  if (typeof window !== "undefined" && "cabinet" in window) {
    return (window as unknown as { cabinet: CabinetBridge }).cabinet;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Dashboard state                                                     */
/* ------------------------------------------------------------------ */

type DashboardState = {
  patientCount: number;
  todayAppointmentCount: number;
  monthlyRevenue: number;
  recentPatients: Patient[];
  loading: boolean;
};

type CardColor = "orange" | "fuchsia" | "sky" | "amber" | "teal";
type WideCardColor = "teal" | "emerald" | "rose" | "slate";

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({
    patientCount: MOCK_PATIENTS.length,
    todayAppointmentCount: 0,
    monthlyRevenue: 0,
    recentPatients: MOCK_PATIENTS,
    loading: true,
  });

  useEffect(() => {
    const cabinet = getCabinet();
    if (!cabinet) {
      // Running outside Electron — keep mock data
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    async function fetchDashboardData() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const monthStart = today.slice(0, 7) + "-01";

        const [patientsResult, patientCount, todayAppointmentCount, monthlyRevenue] =
          await Promise.all([
            cabinet!.patients.list({ limit: 10 }),
            cabinet!.patients.count(),
            cabinet!.appointments.countByDate(today),
            cabinet!.revenue.total({ startDate: monthStart, endDate: today }),
          ]);

        setState({
          patientCount,
          todayAppointmentCount,
          monthlyRevenue,
          recentPatients: patientsResult.items.length > 0 ? patientsResult.items : MOCK_PATIENTS,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchDashboardData();
  }, []);

  // Gender distribution from displayed patients
  const femaleCount = state.recentPatients.filter(
    (p) => p.gender === "Mme" || p.gender === "Mlle",
  ).length;
  const maleCount = state.recentPatients.length - femaleCount;
  const total = state.recentPatients.length;
  const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 50;
  const malePercent = 100 - femalePercent;

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-10">
      <header>
        <nav className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link className="hover:text-emerald-500" href="/">Accueil</Link>
          <span className="h-3 w-3">/</span>
          <span className="text-slate-900">Dashboard</span>
        </nav>
        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary">
          Bienvenue à votre solution CabinetPlus ©
        </h2>
      </header>

      {/* Loading indicator */}
      {state.loading && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Chargement des données...
        </div>
      )}

      <div className="space-y-6">
        {/* Top row — quick action cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <StatCard icon={UserPlus} label="Nouveau patient" value={String(state.patientCount)} color="orange" href="/patients" />
          <StatCard icon={SearchIcon} label="Rechercher un patient" value={String(state.patientCount)} color="fuchsia" href="/patients" />
          <StatCard icon={ListTodo} label="Patients attendus" value={String(state.todayAppointmentCount)} color="sky" href="/calendar" />
          <StatCard icon={CalendarCheck} label="Nouveau RDV" value="Action" color="amber" isBadge href="/calendar" />
          <StatCard icon={SearchIcon} label="Recherche RDV" value="Prévu" color="teal" isBadge href="/calendar" />
        </div>

        {/* Second row — wide stat cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCardWide icon={Heart} label="Nouvelle consultation" value={String(state.patientCount)} color="teal" href="/consultations" />
          <StatCardWide icon={Activity} label="Historique" value={String(state.patientCount)} color="emerald" href="/consultations" />
          <StatCardWide
            icon={BarChart3}
            label="Recette du mois"
            value={
              state.monthlyRevenue > 0
                ? `${state.monthlyRevenue.toLocaleString("fr-FR")} DA`
                : "0 DA"
            }
            color="rose"
            href="/revenue"
          />
          <StatCardWide icon={Settings} label="Mon profil" value="Paramètres" color="slate" href="/contact" />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent patients table */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl bg-white card-shadow">
            <div className="flex items-center justify-between bg-slate-50/50 px-6 py-6">
              <h3 className="text-lg font-bold text-primary">Patients vus récemment</h3>
              <Link className="text-sm font-bold text-emerald-600 hover:underline" href="/patients">
                Voir tout
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Age</th>
                    <th className="px-6 py-4">Adresse</th>
                    <th className="px-6 py-4">Dernière consult.</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.recentPatients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                        Aucun patient enregistré. Ajoutez votre premier patient.
                      </td>
                    </tr>
                  ) : (
                    state.recentPatients.map((patient) => (
                      <tr key={patient.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {patient.name
                                .split(" ")
                                .map((namePart) => namePart[0])
                                .join("")}
                            </div>
                            <span className="text-sm font-bold">{patient.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{patient.age} ans</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{patient.address}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{patient.lastConsultation}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href="/patients" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-500">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link href="/patients" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-500">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar — charts & stats */}
        <div className="space-y-6">
          {/* Gender distribution chart */}
          <div className="rounded-xl bg-white p-6 card-shadow">
            <h3 className="mb-4 text-sm font-bold text-slate-900">Patients par genre</h3>
            <div className="flex items-center justify-between">
              <div className="relative h-24 w-24">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" fill="none" r="15.915" stroke="#f1f4f6" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" fill="none" r="15.915"
                    stroke="#10b981"
                    strokeDasharray={`${femalePercent} ${100 - femalePercent}`}
                    strokeDashoffset="0"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18" cy="18" fill="none" r="15.915"
                    stroke="#002045"
                    strokeDasharray={`${malePercent} ${100 - malePercent}`}
                    strokeDashoffset={`-${femalePercent}`}
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{total}</span>
                </div>
              </div>
              <div className="space-y-2">
                <LegendItem color="bg-emerald-500" label={`Femme (${femalePercent}%)`} />
                <LegendItem color="bg-primary" label={`Homme (${malePercent}%)`} />
              </div>
            </div>
          </div>

          {/* Annual activity */}
          <div className="relative overflow-hidden rounded-xl bg-primary p-6 card-shadow">
            <div className="relative z-10">
              <h3 className="mb-1 text-sm font-bold text-white/70">Activité Annuelle</h3>
              <p className="mb-4 text-2xl font-bold text-white">Année {currentYear}</p>
              <div className="flex h-12 items-end gap-1">
                {[40, 60, 50, 90, 70, 30].map((height, index) => (
                  <div key={index} className="w-full rounded-t bg-emerald-400/40" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <BarChart3 className="absolute -right-4 -bottom-4 h-20 w-20 text-white opacity-10" />
          </div>

          {/* Monthly trend */}
          <div className="rounded-xl border-t-4 border-emerald-500 bg-white p-6 card-shadow">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Tendance {new Date().toLocaleDateString("fr-FR", { month: "long" })}
              </h3>
              <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                {state.monthlyRevenue > 0 ? `${state.monthlyRevenue.toLocaleString("fr-FR")} DA` : "—"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-primary">{state.patientCount}</p>
                <p className="text-[10px] font-medium text-slate-500">Total patients</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{state.todayAppointmentCount}</p>
                <p className="text-[10px] font-medium text-slate-500">RDV aujourd&apos;hui</p>
              </div>
            </div>
            <p className="mt-4 text-[11px] font-medium text-slate-500">
              Patients du mois de {new Date().toLocaleDateString("fr-FR", { month: "long" })} • Projection stable
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isBadge,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: CardColor;
  isBadge?: boolean;
  href: string;
}) {
  const colors: Record<CardColor, string> = {
    orange: "bg-orange-50 border-orange-200 text-orange-500",
    fuchsia: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-500",
    sky: "bg-sky-50 border-sky-200 text-sky-500",
    amber: "bg-amber-50 border-amber-200 text-amber-500",
    teal: "bg-teal-50 border-teal-200 text-teal-500",
  };

  return (
    <Link href={href} className={cn("block rounded-xl border-b-2 bg-white p-6 transition-transform hover:-translate-y-1 card-shadow", colors[color])}>
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", colors[color].split(" ")[0])}>
          <Icon className="h-5 w-5" />
        </div>
        {isBadge ? (
          <span className={cn("rounded px-2 py-1 text-sm font-bold", colors[color].replace("text-", "bg-").replace("500", "100"))}>{value}</span>
        ) : (
          <span className="text-2xl font-bold text-primary">{value}</span>
        )}
      </div>
      <p className="text-sm font-bold text-slate-600">{label}</p>
    </Link>
  );
}

function StatCardWide({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: WideCardColor;
  href: string;
}) {
  const colors: Record<WideCardColor, string> = {
    teal: "bg-teal-500/10 border-teal-200 text-teal-600",
    emerald: "bg-emerald-500/10 border-emerald-200 text-emerald-600",
    rose: "bg-rose-500/10 border-rose-200 text-rose-600",
    slate: "bg-slate-100 border-slate-200 text-slate-600",
  };

  return (
    <Link href={href} className={cn("flex items-center gap-6 rounded-xl border-b-2 bg-white p-6 transition-transform hover:-translate-y-1 card-shadow", colors[color])}>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", colors[color].split(" ")[0])}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs font-bold uppercase tracking-tighter text-slate-500">{label}</p>
      </div>
    </Link>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-3 w-3 rounded-full", color)} />
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
  );
}
