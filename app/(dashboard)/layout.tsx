"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "@/app/components/Sidebar";
import TopBar from "@/app/components/TopBar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="relative flex min-h-screen flex-1 flex-col pt-16 lg:ml-64">
        <TopBar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <div className="flex-1 p-4 md:p-6 xl:p-8">{children}</div>
      </main>
    </div>
  );
}
