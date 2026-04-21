"use client";

import SupportChat from "@/app/components/SupportChat";
import { AppCard, PageHeader } from "@/app/components/ui/primitives";

export default function AIAssistantPage() {
  return (
    <div className="mx-auto max-w-[1480px] space-y-6">
      <PageHeader
        title="Assistant clinique IA"
        subtitle="Echangez directement avec l'assistant IA pour le raisonnement clinique et les questions generales."
      />

      <AppCard className="p-4 md:p-5">
        <SupportChat embedded />
      </AppCard>
    </div>
  );
}
