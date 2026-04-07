"use client";

import { Calendar, Printer, Share } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AppButton,
  AppCard,
  FieldLabel,
  PageHeader,
  TextInput,
} from "@/app/components/ui/primitives";

type Transaction = {
  id: string;
  patient: string;
  address: string;
  date: string;
  amount: number;
};

const transactions: Transaction[] = [
  { id: "1", patient: "Mme. Saoula", address: "Alger Centre", date: "2026-04-02", amount: 1000 },
  { id: "2", patient: "M. Kaci Hakim", address: "Bab Ezzouar", date: "2026-04-03", amount: 1000 },
  { id: "3", patient: "Cherami Malika", address: "Hydra", date: "2026-04-04", amount: 1200 },
  { id: "4", patient: "M. Amrani Brahim", address: "Zeralda", date: "2026-04-05", amount: 1000 },
  { id: "5", patient: "Mme. Lofti Dalila", address: "Dely Ibrahim", date: "2026-04-06", amount: 1500 },
  { id: "6", patient: "M. Mekhloufi Karim", address: "Boumerdes", date: "2026-04-07", amount: 1000 },
];

export default function RevenuePage() {
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2026-04-30");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => transaction.date >= startDate && transaction.date <= endDate);
  }, [startDate, endDate]);

  const total = useMemo(() => {
    return filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="mx-auto max-w-[1460px] space-y-6">
      <PageHeader
        title="Calcul de la recette"
        subtitle="Suivi des honoraires par jour ou par periode selectionnee."
        actions={
          <>
            <AppButton variant="secondary">
              <Printer className="h-4 w-4" /> Imprimer
            </AppButton>
            <AppButton variant="secondary">
              <Share className="h-4 w-4" /> Partager
            </AppButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <AppCard className="space-y-4">
          <h2 className="text-base font-bold text-primary">Parametres de recherche</h2>
          <div>
            <FieldLabel>Date de debut</FieldLabel>
            <TextInput type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div>
            <FieldLabel>Date de fin</FieldLabel>
            <TextInput type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <AppButton className="w-full">
            <Calendar className="h-4 w-4" /> Appliquer le calcul
          </AppButton>

          <div className="rounded-2xl bg-primary p-5 text-white">
            <p className="text-xs uppercase tracking-wider text-white/70">Recette totale</p>
            <p className="mt-1 text-3xl font-extrabold">{total.toLocaleString("fr-FR")} DA</p>
            <p className="mt-2 text-xs text-emerald-300">{filteredTransactions.length} consultations facturees</p>
          </div>
        </AppCard>

        <AppCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Patient</th>
                  <th className="px-5 py-4">Adresse</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Honoraires</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 text-sm hover:bg-slate-50/80">
                    <td className="px-5 py-4 font-semibold text-slate-900">{transaction.patient}</td>
                    <td className="px-5 py-4 text-slate-600">{transaction.address}</td>
                    <td className="px-5 py-4 text-slate-600">{transaction.date}</td>
                    <td className="px-5 py-4 text-right font-bold text-primary">{transaction.amount.toLocaleString("fr-FR")} DA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>
    </div>
  );
}
