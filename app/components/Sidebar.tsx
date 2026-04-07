"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CreditCard,
  HelpCircle,
  Home,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

const navItems = [
  { icon: Home, label: "Accueil", path: "/" },
  { icon: Users, label: "Dossier patient", path: "/patients" },
  { icon: Stethoscope, label: "Consultations", path: "/consultations" },
  { icon: Calendar, label: "Rendez-vous", path: "/calendar" },
  { icon: CreditCard, label: "Recette", path: "/revenue" },
  { icon: Sparkles, label: "Assistant IA", path: "/ai" },
  { icon: HelpCircle, label: "Contact", path: "/contact" },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {isOpen ? <button className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={onClose} type="button" aria-label="Fermer la barre latérale" /> : null}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-slate-900 font-headline shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
      <div className="flex flex-col gap-1 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">CabinetPlus</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Medical Suite</p>
          </div>
        </div>
      </div>

      <nav className="scrollbar-hide mt-6 flex-1 space-y-2 overflow-y-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                isActive
                  ? "border-r-4 border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
              )}
            >
              <item.icon className={cn("h-5 w-5", item.label === "Assistant IA" && "text-indigo-400")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <Link href="/patients" onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-bold text-slate-950 transition-all active:scale-95 hover:bg-emerald-400">
          <UserPlus className="h-5 w-5" />
          <span>Nouveau Patient</span>
        </Link>
      </div>

      <div className="mt-auto p-6">
        <div className="flex items-center gap-3 rounded-xl bg-slate-800 p-4">
          <Image
            alt="Dr. Ferkoune"
            className="h-10 w-10 rounded-full border border-slate-700 object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVQDQ_McjvDT4z1UJ-dF_gV4hp-_ihzxU7B0ih8uLa_QPv-FcCiOeCQNoNzs_zbJZBk0Dxp3YJXse0qDjWASJ8MnliNXvEAVmjNoyFdqs1yVloI9lf3TMzSDtnLsQpCeBZKGofVbtBHrVOGtKO0NCcvgAojtkG8oeiOa16yZAWSIkS1fpl9lQYoTFBcwgLoKYr_NE7Zc8iwgP-mRk5JqSG9ePd0oYzufk3qKw5ouoPqPV1QoNRllfVrkc1yjp88A4EpNAFNxjfcRDC"
            width={40}
            height={40}
            unoptimized
          />
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold text-white">Dr. Ferkoune</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
