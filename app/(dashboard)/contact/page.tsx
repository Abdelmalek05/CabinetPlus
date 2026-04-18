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

type FormErrors = {
  nom?: string;
  email?: string;
  tel?: string;
  message?: string;
};

export default function ContactPage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): boolean {
    const e: FormErrors = {};

    if (!nom.trim()) {
      e.nom = "Le nom est obligatoire.";
    }

    if (!email.trim()) {
      e.email = "L'email est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "L'adresse email n'est pas valide.";
    }

    if (!tel.trim()) {
      e.tel = "Le numéro de téléphone est obligatoire.";
    } else if (!/^(0)[0-9]{9}$/.test(tel.replace(/\s/g, ""))) {
      e.tel = "Le numéro doit contenir 10 chiffres et commencer par 0 (ex: 0542930649).";
    }

    if (!message.trim()) {
      e.message = "Le message est obligatoire.";
    } else if (message.trim().length < 10) {
      e.message = "Le message doit contenir au moins 10 caractères.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function sendMessage() {
    if (!validate()) return;
    setSending(true);
    try {
      await (window as any).cabinet.messages.create({
        nom: nom.trim(),
        email: email.trim(),
        tel: tel.trim(),
        message: message.trim(),
        medecin: "Dr. Ferkoune",
      });
      setSent(true);
      setNom("");
      setEmail("");
      setTel("");
      setMessage("");
      setErrors({});
    } catch (err) {
      console.error("Erreur envoi message:", err);
      setErrors({ message: "Erreur lors de l'envoi. Veuillez réessayer." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Support CabinetPlus"
        subtitle="Contactez l'assistance technique et operationnelle."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <ContactCard icon={HelpCircle} title="Assistance" detail="Disponible 24h/24" />
        <ContactCard icon={Phone} title="Telephone" detail="0542930649" />
        <ContactCard icon={Mail} title="Email" detail="support@cabinetplus.dz" />
      </div>

      <AppCard className="space-y-4">
        <h2 className="text-lg font-bold text-primary">Envoyer une demande</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Nom complet</FieldLabel>
            <TextInput
              value={nom}
              onChange={(e) => {
                setNom(e.target.value);
                setErrors((prev) => ({ ...prev, nom: undefined }));
                setSent(false);
              }}
              placeholder="Ex: Dr. Ferkoune"
            />
            {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom}</p>}
          </div>

          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
                setSent(false);
              }}
              placeholder="Ex: contact@cabinet.dz"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>

        <div>
          <FieldLabel>Téléphone</FieldLabel>
          <TextInput
            type="tel"
            value={tel}
            onChange={(e) => {
              setTel(e.target.value);
              setErrors((prev) => ({ ...prev, tel: undefined }));
              setSent(false);
            }}
            placeholder="Ex: 0542930649"
          />
          {errors.tel && <p className="mt-1 text-xs text-red-500">{errors.tel}</p>}
        </div>

        <div>
          <FieldLabel>Message</FieldLabel>
          <TextArea
            rows={5}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setErrors((prev) => ({ ...prev, message: undefined }));
              setSent(false);
            }}
            placeholder="Decrivez votre besoin en detail..."
          />
          {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
        </div>

        <div className="flex items-center justify-between">
          {sent ? (
            <p className="text-sm font-medium text-emerald-700">
              ✓ Message envoyé. Un conseiller vous recontactera rapidement.
            </p>
          ) : (
            <span />
          )}
          <AppButton onClick={sendMessage} disabled={sending}>
            {sending ? "Envoi en cours..." : "Envoyer"}
          </AppButton>
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