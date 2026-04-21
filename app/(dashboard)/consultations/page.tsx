"use client";

import {
  Plus,
  Search,
  ChevronRight,
  Stethoscope,
  Thermometer,
  Activity,
  FileText,
  Trash2,
  Sparkles,
  FileSearch,
  History,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MOCK_PATIENTS } from "@/app/constants";
import type { Patient } from "@/app/types";
import {
  AppButton,
  AppCard,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from "@/app/components/ui/primitives";
import { cn } from "@/app/lib/utils";

/* ------------------------------------------------------------------ */
/* Electron IPC bridge types                                           */
/* ------------------------------------------------------------------ */

type ConsultationRow = {
  ID: number;
  CONSTAT: string | null;
  DIAGNOSTIC: string | null;
  EXPLORATION: string | null;
  MALADIE: string | null;
  TRAITEMENT: string | null;
  NOTE: string | null;
  DATE: string | null;
  HEURE: string | null;
  TARIF: number | null;
  ID_PATIENT: number;
};

type PrescriptionRow = {
  ID: number;
  MEDICAMENT: string;
  TYPE: string;
  PRISE: string;
  DUREE: string;
  ID_PATIENT: number;
  ID_CONSULT: number;
};

type ConsultationCreateInput = {
  patientId: string | number;
  date: string;
  time?: string;
  tarif?: number | null;
  constat?: string;
  diagnostic?: string;
  exploration?: string;
  maladie?: string;
  traitement?: string;
  note?: string;
};

type PrescriptionCreateInput = {
  consultationId: string | number;
  patientId: string | number;
  medicament: string;
  type: string;
  prise: string;
  duree: string;
};

type CabinetBridge = {
  patients: {
    list: (options?: { limit?: number }) => Promise<{ items: Patient[]; total: number }>;
  };
  consultations: {
    byPatient: (patientId: string | number) => Promise<ConsultationRow[]>;
    get: (id: string | number) => Promise<ConsultationRow | undefined>;
    create: (input: ConsultationCreateInput) => Promise<ConsultationRow>;
    remove: (id: string | number) => Promise<boolean>;
  };
  prescriptions: {
    byConsultation: (consultationId: string | number) => Promise<PrescriptionRow[]>;
    add: (input: PrescriptionCreateInput) => Promise<number>;
    remove: (id: string | number) => Promise<boolean>;
  };
};

function getCabinet(): CabinetBridge | null {
  if (typeof window !== "undefined" && "cabinet" in window) {
    return (window as unknown as { cabinet: CabinetBridge }).cabinet;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Local prescription item (before consultation is saved)              */
/* ------------------------------------------------------------------ */

type PrescriptionItem = {
  id: string;
  dbId?: number; // set once saved to DB
  medication: string;
  type: string;
  prise: string;
  duration: string;
};

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */

export default function ConsultationPage() {
  // -- Patient data --
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [useBackend, setUseBackend] = useState(false);

  // -- Patient selection --
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  // -- Consultation history --
  const [historyItems, setHistoryItems] = useState<ConsultationRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);

  // -- Active consultation form --
  const [motif, setMotif] = useState("");
  const [examenClinique, setExamenClinique] = useState("");
  const [bp, setBp] = useState("");
  const [temp, setTemp] = useState("");
  const [diagnostique, setDiagnostique] = useState("");
  const [tarif, setTarif] = useState("");
  const [note, setNote] = useState("");

  // -- Prescriptions --
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [newMedication, setNewMedication] = useState("");
  const [newMedicationType, setNewMedicationType] = useState("");
  const [newMedicationPrise, setNewMedicationPrise] = useState("");
  const [newMedicationDuration, setNewMedicationDuration] = useState("");
  const [showAddMedForm, setShowAddMedForm] = useState(false);

  // -- UI state --
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);

  /* ---- Load patients ---- */

  useEffect(() => {
    const cabinet = getCabinet();
    if (!cabinet) return;

    setUseBackend(true);
    cabinet.patients
      .list({ limit: 500 })
      .then((result) => {
        if (result.items.length > 0) setPatients(result.items);
      })
      .catch((err) => console.error("Failed to load patients:", err));
  }, []);

  /* ---- Load consultation history when patient changes ---- */

  const loadHistory = useCallback(
    async (patientId: string) => {
      const cabinet = getCabinet();
      if (!cabinet || !patientId) {
        setHistoryItems([]);
        return;
      }

      setHistoryLoading(true);
      try {
        const rows = await cabinet.consultations.byPatient(patientId);
        setHistoryItems(rows);
      } catch (err) {
        console.error("Failed to load history:", err);
        setHistoryItems([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedPatientId) {
      loadHistory(selectedPatientId);
    } else {
      setHistoryItems([]);
    }
    // Reset form when switching patient
    resetForm();
    setActiveHistoryId(null);
  }, [selectedPatientId, loadHistory]);

  /* ---- Load a historical consultation into the form ---- */

  const loadConsultation = useCallback(
    async (row: ConsultationRow) => {
      setActiveHistoryId(row.ID);
      setMotif(row.MALADIE ?? "");
      setExamenClinique(row.CONSTAT ?? "");
      setDiagnostique(row.DIAGNOSTIC ?? "");
      setNote(row.NOTE ?? "");
      setTarif(row.TARIF != null ? String(row.TARIF) : "");

      // Parse exploration for vitals (stored as free text)
      const exploration = row.EXPLORATION ?? "";
      const bpMatch = exploration.match(/TA[:\s]*([^\s,;]+)/i);
      const tempMatch = exploration.match(/T[°:\s]*([0-9.]+)/i);
      setBp(bpMatch?.[1] ?? "");
      setTemp(tempMatch?.[1] ?? "");

      // Load prescriptions
      const cabinet = getCabinet();
      if (cabinet) {
        try {
          const rxRows = await cabinet.prescriptions.byConsultation(row.ID);
          setPrescriptionItems(
            rxRows.map((rx) => ({
              id: String(rx.ID),
              dbId: rx.ID,
              medication: rx.MEDICAMENT,
              type: rx.TYPE,
              prise: rx.PRISE,
              duration: rx.DUREE,
            })),
          );
        } catch {
          setPrescriptionItems([]);
        }
      }
    },
    [],
  );

  /* ---- Derived ---- */

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const searchablePatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q),
    );
  }, [patientSearch, patients]);

  /* ---- Form helpers ---- */

  function resetForm() {
    setMotif("");
    setExamenClinique("");
    setBp("");
    setTemp("");
    setDiagnostique("");
    setTarif("");
    setNote("");
    setPrescriptionItems([]);
    setStatusMessage("");
    setShowAddMedForm(false);
    setNewMedication("");
    setNewMedicationType("");
    setNewMedicationPrise("");
    setNewMedicationDuration("");
  }

  const startNewConsultation = () => {
    resetForm();
    setActiveHistoryId(null);
  };

  const addPrescriptionItem = () => {
    if (!newMedication.trim()) return;
    setPrescriptionItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        medication: newMedication,
        type: newMedicationType,
        prise: newMedicationPrise,
        duration: newMedicationDuration,
      },
    ]);
    setNewMedication("");
    setNewMedicationType("");
    setNewMedicationPrise("");
    setNewMedicationDuration("");
    setShowAddMedForm(false);
  };

  const removePrescriptionItem = async (item: PrescriptionItem) => {
    // Remove from DB if it has a dbId
    if (item.dbId && useBackend) {
      const cabinet = getCabinet();
      if (cabinet) {
        try {
          await cabinet.prescriptions.remove(item.dbId);
        } catch (err) {
          console.error("Failed to delete prescription:", err);
        }
      }
    }
    setPrescriptionItems((prev) => prev.filter((p) => p.id !== item.id));
  };

  /* ---- Submit consultation ---- */

  const submitConsultation = async () => {
    if (!selectedPatient) {
      setStatusMessage("Veuillez d'abord sélectionner un patient.");
      return;
    }

    setSaving(true);
    const cabinet = getCabinet();
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toTimeString().slice(0, 5);

    const explorationText = [
      bp ? `TA: ${bp}` : "",
      temp ? `T°: ${temp}°C` : "",
      examenClinique,
    ]
      .filter(Boolean)
      .join(" | ");

    if (useBackend && cabinet) {
      try {
        // If viewing an existing consultation, delete it first and recreate
        // (the repo has no update function)
        if (activeHistoryId) {
          await cabinet.consultations.remove(activeHistoryId);
        }

        // Create the consultation
        const created = await cabinet.consultations.create({
          patientId: selectedPatient.id,
          date: today,
          time: now,
          tarif: tarif ? Number(tarif) : null,
          constat: examenClinique || undefined,
          diagnostic: diagnostique || undefined,
          exploration: explorationText || undefined,
          maladie: motif || undefined,
          traitement: prescriptionItems.map((p) => p.medication).join(", ") || undefined,
          note: note || undefined,
        });

        // Add prescriptions
        if (created?.ID) {
          for (const item of prescriptionItems) {
            if (!item.dbId) {
              // Only add new (unsaved) prescriptions
              await cabinet.prescriptions.add({
                consultationId: created.ID,
                patientId: selectedPatient.id,
                medicament: item.medication,
                type: item.type || "Comprimé",
                prise: item.prise || "-",
                duree: item.duration || "-",
              });
            }
          }
        }

        // Reload history
        await loadHistory(selectedPatientId);
        resetForm();
        setActiveHistoryId(null);

        setStatusMessage(
          `Consultation du ${today} enregistrée pour ${selectedPatient.name}.`,
        );
      } catch (err) {
        console.error("Failed to save consultation:", err);
        setStatusMessage("Erreur lors de l'enregistrement. Veuillez réessayer.");
      }
    } else {
      // Local-only fallback
      setStatusMessage(
        `Consultation du ${today} enregistrée pour ${selectedPatient.name}. (mode local)`,
      );
    }

    setSaving(false);

    // Auto-dismiss status message
    setTimeout(() => setStatusMessage(""), 5000);
  };

  /* ---- Delete a consultation from history ---- */

  const deleteConsultation = async (consultationId: number) => {
    const cabinet = getCabinet();
    if (!cabinet) return;

    try {
      await cabinet.consultations.remove(consultationId);
      if (activeHistoryId === consultationId) {
        resetForm();
        setActiveHistoryId(null);
      }
      await loadHistory(selectedPatientId);
      setStatusMessage("Consultation supprimée.");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      console.error("Failed to delete consultation:", err);
    }
  };

  /* ---- Format history date ---- */

  function formatHistoryDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d
        .toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
        .toUpperCase();
    } catch {
      return dateStr;
    }
  }

  /* ---- Render ---- */

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      {/* Breadcrumb & Header */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span
              className="cursor-pointer hover:text-emerald-500"
              onClick={() => setSelectedPatientId("")}
            >
              Patients
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold text-slate-900">
              {selectedPatient?.name || "Nouvelle Consultation"}
            </span>
          </nav>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-primary">
            {activeHistoryId ? "Détail Consultation" : "Nouvelle Consultation"}
          </h2>
        </div>
        {selectedPatient && (
          <div className="flex items-center gap-3">
            {activeHistoryId && (
              <AppButton variant="secondary" className="px-6" onClick={startNewConsultation}>
                <Plus className="h-4 w-4" />
                Nouvelle
              </AppButton>
            )}
            <AppButton variant="secondary" className="px-6" onClick={resetForm}>
              Réinitialiser
            </AppButton>
            <AppButton
              className="px-8 shadow-xl"
              onClick={submitConsultation}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Valider la séance"
              )}
            </AppButton>
          </div>
        )}
      </header>

      {/* Patient Selection */}
      {!selectedPatient && (
        <AppCard className="border-dashed border-slate-300 bg-slate-50/50 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Rechercher un patient</h3>
          <p className="mt-2 text-slate-500">
            Veuillez d&apos;abord sélectionner un patient pour commencer la consultation.
          </p>
          <div className="mx-auto mt-6 max-w-md space-y-4">
            <SelectInput
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-white shadow-sm"
            >
              <option value="">Choisir un patient...</option>
              {searchablePatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                className="bg-white pl-10 shadow-sm"
                placeholder="Recherche rapide..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>
          </div>
        </AppCard>
      )}

      {selectedPatient && (
        <div className="grid grid-cols-12 items-start gap-8">
          {/* Left: History Timeline */}
          <section className="col-span-3 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <h3 className="font-headline text-lg font-bold text-primary">Historique</h3>
              </div>
              {historyLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>

            {historyItems.length === 0 && !historyLoading && (
              <p className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                Aucune consultation précédente
              </p>
            )}

            <div className="space-y-4">
              {historyItems.map((row) => {
                const isActive = activeHistoryId === row.ID;
                return (
                  <div
                    key={row.ID}
                    className={cn(
                      "group relative cursor-pointer rounded-2xl border-l-4 bg-white p-5 transition-all hover:-translate-y-1 card-shadow",
                      isActive ? "border-emerald-500" : "border-slate-200 opacity-70",
                    )}
                    onClick={() => loadConsultation(row)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "rounded p-1 px-2 text-[10px] font-bold uppercase tracking-wider",
                          isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-50 text-slate-500",
                        )}
                      >
                        {formatHistoryDate(row.DATE)}
                      </span>
                      <button
                        className="rounded-lg p-1 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConsultation(row.ID);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <h4 className="mb-1 font-bold text-slate-900">{row.MALADIE || row.DIAGNOSTIC || "Consultation"}</h4>
                    <p className="line-clamp-2 text-sm text-slate-500">
                      {row.CONSTAT || row.NOTE || "—"}
                    </p>
                    {row.TARIF != null && row.TARIF > 0 && (
                      <p className="mt-2 text-xs font-bold text-emerald-600">{row.TARIF} DA</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Center: Active Consultation Form */}
          <section className="col-span-6 space-y-8">
            <AppCard className="rounded-4xl border-slate-100 p-10">
              <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
                {/* Motif */}
                <div className="space-y-3">
                  <FieldLabel>Motif de consultation</FieldLabel>
                  <TextInput
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Ex: Céphalées persistantes, fièvre..."
                    className="border-none bg-slate-50/50 text-lg font-bold focus:ring-emerald-500/10"
                  />
                </div>

                {/* Examen Clinique */}
                <div className="space-y-3">
                  <FieldLabel>Examen clinique</FieldLabel>
                  <TextArea
                    placeholder="Observations cliniques..."
                    className="min-h-[160px] border-none bg-slate-50/50 leading-relaxed"
                    value={examenClinique}
                    onChange={(e) => setExamenClinique(e.target.value)}
                  />
                </div>

                {/* Vitals */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tension Artérielle
                      </span>
                      <Activity className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <TextInput
                        value={bp}
                        onChange={(e) => setBp(e.target.value)}
                        placeholder="14/9"
                        className="w-24 border-none bg-transparent p-0 font-headline text-3xl font-extrabold text-slate-900 focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-400">mmHg</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Température
                      </span>
                      <Thermometer className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <TextInput
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                        placeholder="37.0"
                        className="w-24 border-none bg-transparent p-0 font-headline text-3xl font-extrabold text-slate-900 focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-400">°C</span>
                    </div>
                  </div>
                </div>

                {/* Diagnostic */}
                <div className="space-y-3">
                  <FieldLabel>Diagnostic</FieldLabel>
                  <div className="relative">
                    <TextInput
                      placeholder="Rechercher un diagnostic (CIM-10)..."
                      className="border-none bg-slate-50/50 pr-12"
                      value={diagnostique}
                      onChange={(e) => setDiagnostique(e.target.value)}
                    />
                    <Stethoscope className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Tarif */}
                <div className="space-y-3">
                  <FieldLabel>Tarif (DA)</FieldLabel>
                  <TextInput
                    type="number"
                    min={0}
                    placeholder="Ex: 1000"
                    value={tarif}
                    onChange={(e) => setTarif(e.target.value)}
                    className="border-none bg-slate-50/50"
                  />
                </div>

                {/* Note */}
                <div className="space-y-3">
                  <FieldLabel>Note</FieldLabel>
                  <TextArea
                    placeholder="Notes supplémentaires..."
                    className="min-h-[80px] border-none bg-slate-50/50 leading-relaxed"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                {/* Traitement / Ordonnance */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FieldLabel>Traitement / Ordonnance</FieldLabel>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                      onClick={() => setShowAddMedForm(!showAddMedForm)}
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter médicament
                    </button>
                  </div>

                  {/* Add medication inline form */}
                  {showAddMedForm && (
                    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Médicament *</FieldLabel>
                          <TextInput
                            value={newMedication}
                            onChange={(e) => setNewMedication(e.target.value)}
                            placeholder="Doliprane 1000mg..."
                          />
                        </div>
                        <div>
                          <FieldLabel>Type</FieldLabel>
                          <SelectInput
                            value={newMedicationType}
                            onChange={(e) => setNewMedicationType(e.target.value)}
                          >
                            <option value="">Choisir...</option>
                            <option>Comprimé</option>
                            <option>Gélule</option>
                            <option>Sirop</option>
                            <option>Injectable</option>
                            <option>Suppositoire</option>
                            <option>Pommade</option>
                            <option>Collyre</option>
                          </SelectInput>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Prise</FieldLabel>
                          <TextInput
                            value={newMedicationPrise}
                            onChange={(e) => setNewMedicationPrise(e.target.value)}
                            placeholder="1 comp. 3x/jour"
                          />
                        </div>
                        <div>
                          <FieldLabel>Durée</FieldLabel>
                          <TextInput
                            value={newMedicationDuration}
                            onChange={(e) => setNewMedicationDuration(e.target.value)}
                            placeholder="5 jours"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <AppButton
                          variant="secondary"
                          onClick={() => setShowAddMedForm(false)}
                        >
                          Annuler
                        </AppButton>
                        <AppButton onClick={addPrescriptionItem} disabled={!newMedication.trim()}>
                          <Plus className="h-4 w-4" />
                          Ajouter
                        </AppButton>
                      </div>
                    </div>
                  )}

                  {/* Prescription list */}
                  <div className="space-y-3">
                    {prescriptionItems.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between rounded-xl border border-emerald-100/50 bg-emerald-50/30 p-4 transition-colors hover:bg-emerald-50"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.medication}
                            {item.type && (
                              <span className="ml-2 text-xs font-normal text-slate-400">
                                ({item.type})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.prise || "—"} • {item.duration || "—"}
                          </p>
                        </div>
                        <button
                          className="rounded-lg p-2 text-rose-500 opacity-0 transition-all hover:bg-white group-hover:opacity-100"
                          onClick={() => removePrescriptionItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {prescriptionItems.length === 0 && (
                      <p className="rounded-xl border-2 border-dashed border-slate-100 py-4 text-center text-sm text-slate-400">
                        Aucun médicament ajouté
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </AppCard>
          </section>

          {/* Right: AI Suggestions Sidebar */}
          <section className="sticky top-24 col-span-3 space-y-6">
            <AppCard className="overflow-hidden border-slate-100 p-0">
              <div className="pulse-gradient p-6 text-white">
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 fill-current" />
                  <h3 className="font-headline text-lg font-bold">Assistant Aura</h3>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  AI Analysis Engine • Online
                </p>
              </div>
              <div className="space-y-6 p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Corrélation Détectée
                  </div>
                  <div className="rounded-xl border-l-4 border-primary bg-slate-50 p-4">
                    <p className="text-sm leading-relaxed text-slate-700">
                      {bp ? (
                        <>
                          Les <span className="font-bold text-primary">céphalées</span> actuelles
                          pourraient être liées au pic de tension ({bp}) observé ce matin.
                        </>
                      ) : (
                        "Saisissez les constantes pour obtenir une analyse."
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    Suggestion d&apos;Examen
                  </div>
                  <div className="rounded-xl border-l-4 border-secondary bg-slate-50 p-4">
                    <p className="text-sm italic leading-relaxed text-slate-700">
                      &quot;Considérer un fond d&apos;œil pour exclure une rétinopathie
                      hypertensive débutante.&quot;
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Contre-indication
                  </div>
                  <div className="rounded-xl border-l-4 border-rose-500 bg-rose-50 p-4">
                    <p className="text-sm leading-relaxed text-rose-900">
                      Patient allergique à la <span className="font-bold">Pénicilline</span> (vu
                      dossier 2019).
                    </p>
                  </div>
                </div>

              </div>
            </AppCard>

            {/* Patient Documents */}
            <AppCard className="border-slate-100 p-6">
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Documents Patient
              </h4>
              <div className="space-y-3">
                {[
                  { name: "Dernier Bilan Bio", info: "PDF • 12 Oct 2023", icon: FileText },
                  { name: "Radio Thorax", info: "DICOM • 05 Juil 2023", icon: FileSearch },
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="group flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all group-hover:bg-primary group-hover:text-white">
                      <doc.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                      <p className="text-[10px] text-slate-500">{doc.info}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AppCard>
          </section>
        </div>
      )}

      {/* Status toast */}
      {statusMessage && (
        <div className="animate-in fade-in slide-in-from-bottom-2 fixed bottom-8 left-1/2 z-100 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full bg-slate-900 px-6 py-3 text-white shadow-2xl">
            <AlertCircle className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold">{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
