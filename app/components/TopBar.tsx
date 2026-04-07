"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, Menu, RefreshCw, Search } from "lucide-react";
import { AppButton } from "@/app/components/ui/primitives";
import { logoutAction } from "@/app/(dashboard)/actions";

export default function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();

  const logout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="fixed right-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 backdrop-blur-lg md:px-6 lg:w-[calc(100%-16rem)] lg:px-8">
      <div className="flex flex-1 items-center gap-4">
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onToggleSidebar} type="button" aria-label="Ouvrir le menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border-none bg-slate-100 py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Rechercher un dossier..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-4 text-slate-500">
          <button className="transition-colors hover:text-emerald-500" type="button">
            <RefreshCw className="h-5 w-5" />
          </button>
          <button className="relative transition-colors hover:text-emerald-500" type="button">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
          </button>
        </div>
        <AppButton variant="secondary" className="hidden md:inline-flex" onClick={logout}>
          Deconnexion
        </AppButton>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-headline text-sm font-bold text-slate-900">Dr. Ferkoune</p>
          </div>
          <Link href="/contact" className="hidden rounded-xl p-1 ring-2 ring-emerald-500/10 transition hover:ring-emerald-500/30 sm:block">
            <Image
              alt="Dr. Ferkoune Profile"
              className="h-8 w-8 rounded-xl object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYejzer72MA0UOGiSQCmJI_1rnt1mer5IS0O1lp9PUwVXLXgY8V5muv_EyIWYwIyV-YImjHMh5wgWl4xvYltD6sY-nnb9yGuyan-ip9uXOj0ompmjTI_JYQS1SXGfmKxU0tiSoeEoOBEWz_kkGhNSNky-DwXh6PhhL-s2OOQ2dOkhqExAWEd9SM8ZxJXgt52NQIl8SSbp4OtL949H5jlmFUT8cLwTOCuucFs5vAkt0BjkNkZSXtWRyD4NGCsurUCL6Rm1SYSAW_Rw"
              width={32}
              height={32}
              unoptimized
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
