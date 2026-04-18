"use client";

import { Calendar, Printer, Share } from "lucide-react";
import { useState } from "react";
import {
  AppButton,
  AppCard,
  FieldLabel,
  PageHeader,
  TextInput,
} from "@/app/components/ui/primitives";

type RevenueRow = {
  consultationId: string;
  patientId: string;
  patientName: string;
  address: string;
  date: string;
  amount: number;
};

type DateErrors = {
  startDate?: string;
  endDate?: string;
};

export default function RevenuePage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 7) + "-01";

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<DateErrors>({});
  const [searched, setSearched] = useState(false);

  function validate(): boolean {
    const e: DateErrors = {};
    if (!startDate) e.startDate = "La date de début est obligatoire.";
    if (!endDate) e.endDate = "La date de fin est obligatoire.";
    if (startDate && endDate && startDate > endDate) {
      e.endDate = "La date de fin doit être après la date de début.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function applyFilter() {
    const e: DateErrors = {};
    if (!startDate) e.startDate = "La date de début est obligatoire.";
    if (!endDate) e.endDate = "La date de fin est obligatoire.";
    if (startDate && endDate && startDate > endDate) {
      e.endDate = "La date de fin doit être après la date de début.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    setSearched(true);
    try {
      const range = { startDate, endDate };
      const [data, totalAmount] = await Promise.all([
        (window as any).cabinet.revenue.list(range),
        (window as any).cabinet.revenue.total(range),
      ]);
      setRows(data);
      setTotal(totalAmount);
    } catch (err) {
      console.error("Erreur chargement recette:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1460px] space-y-6">
      <PageHeader
        title="Calcul de la recette"
        subtitle="Suivi des honoraires par jour ou par periode selectionnee."
        actions={
          <>
            <AppButton variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimer
            </AppButton>
            <AppButton variant="secondary">
              <Share className="h-4 w-4" /> Partager
            </AppButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Filter panel */}
        <AppCard className="space-y-4">
          <h2 className="text-base font-bold text-primary">Parametres de recherche</h2>

          <div>
            <FieldLabel>Date de debut</FieldLabel>
            <TextInput
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setErrors((prev) => ({ ...prev, startDate: undefined }));
              }}
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div>
            <FieldLabel>Date de fin</FieldLabel>
            <TextInput
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setErrors((prev) => ({ ...prev, endDate: undefined }));
              }}
            />
            {errors.endDate && (
              <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>
            )}
          </div>

          <AppButton className="w-full" onClick={applyFilter} disabled={loading}>
            <Calendar className="h-4 w-4" />
            {loading ? "Calcul en cours..." : "Appliquer le calcul"}
          </AppButton>

          {/* Total card — only shown after a search */}
          {searched && total !== null && (
            <div className="rounded-2xl bg-primary p-5 text-white">
              <p className="text-xs uppercase tracking-wider text-white/70">Recette totale</p>
              <p className="mt-1 text-3xl font-extrabold">{total.toLocaleString("fr-FR")} DA</p>
              <p className="mt-2 text-xs text-emerald-300">{rows.length} consultations facturees</p>
            </div>
          )}
        </AppCard>

        {/* Table */}
        <AppCard className="overflow-hidden p-0">
          {!searched ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              Appliquez un filtre pour afficher les résultats.
            </div>
          ) : loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              Chargement...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              Aucune consultation trouvée pour cette période.
            </div>
          ) : (
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
                  {rows.map((row) => (
                    <tr key={row.consultationId} className="border-b border-slate-100 text-sm hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-semibold text-slate-900">{row.patientName}</td>
                      <td className="px-5 py-4 text-slate-600">{row.address}</td>
                      <td className="px-5 py-4 text-slate-600">{row.date}</td>
                      <td className="px-5 py-4 text-right font-bold text-primary">
                        {row.amount.toLocaleString("fr-FR")} DA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>
      </div>
    </div>
  );
}