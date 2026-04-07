"use client";

import { HelpCircle, Mail, Phone } from "lucide-react";
import { useState } from "react";
import {
  AppButton,
  AppCard,
  FieldLabel,
  PageHeader,
  TextArea,
  TextInput,
} from "@/app/components/ui/primitives";

export default function ContactPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const sendMessage = () => {
    if (!subject.trim() || !message.trim()) return;
    setSent(true);
    setSubject("");
    setMessage("");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Support CabinetPlus" subtitle="Contactez l'assistance technique et operationnelle." />

      <div className="grid gap-4 md:grid-cols-3">
        <ContactCard icon={HelpCircle} title="Assistance" detail="Disponible 24h/24" />
        <ContactCard icon={Phone} title="Telephone" detail="0542930649" />
        <ContactCard icon={Mail} title="Email" detail="support@cabinetplus.dz" />
      </div>

      <AppCard className="space-y-4">
        <h2 className="text-lg font-bold text-primary">Envoyer une demande</h2>
        <div>
          <FieldLabel>Sujet</FieldLabel>
          <TextInput value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex: Problemes d'impression ordonnance" />
        </div>
        <div>
          <FieldLabel>Message</FieldLabel>
          <TextArea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Decrivez votre besoin en detail..." />
        </div>
        <div className="flex items-center justify-between">
          {sent ? <p className="text-sm font-medium text-emerald-700">Message envoye. Un conseiller vous recontactera rapidement.</p> : <span />}
          <AppButton onClick={sendMessage}>Envoyer</AppButton>
        </div>
      </AppCard>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <AppCard>
      <Icon className="mb-3 h-6 w-6 text-emerald-600" />
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </AppCard>
  );
}
