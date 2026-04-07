"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MOCK_PATIENTS } from "@/app/constants";
import type { Patient } from "@/app/types";
import { AppButton, AppCard, FieldLabel, PageHeader, SelectInput, TextArea, TextInput } from "@/app/components/ui/primitives";

type PrescriptionItem = {
  id: string;
  medication: string;
  type: string;
  prise: string;
  duration: string;
};

export default function ConsultationPage() {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [constat, setConstat] = useState("");
  const [diagnostique, setDiagnostique] = useState("");
  const [traitement, setTraitement] = useState("");
  const [note, setNote] = useState("");
  const [honoraires, setHonoraires] = useState("");
  const [selectedPrescriptionTab, setSelectedPrescriptionTab] = useState<"ordonnance" | "bilan" | "travail" | "maladie">("ordonnance");
  const [statusMessage, setStatusMessage] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const [newMedicationType, setNewMedicationType] = useState("");
  const [newMedicationPrise, setNewMedicationPrise] = useState("");
  const [newMedicationDuration, setNewMedicationDuration] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);

  const selectedPatient = MOCK_PATIENTS.find((patient) => patient.id === selectedPatientId);

  const searchablePatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();

    if (!query) return MOCK_PATIENTS;

    return MOCK_PATIENTS.filter((patient) => {
      return (
        patient.name.toLowerCase().includes(query) ||
        patient.phone.toLowerCase().includes(query) ||
        patient.address.toLowerCase().includes(query)
      );
    });
  }, [patientSearch]);

  const consultationDate = new Date().toLocaleDateString("fr-FR").replaceAll("/", "-");

  const patientSummary = (patient: Patient) => {
    const agePart = `${patient.age} ans`;
    const professionPart = patient.profession ? `, ${patient.profession.toLowerCase()}` : "";
    const addressPart = patient.address ? `, adresse: ${patient.address}` : "";
    return `${agePart}${professionPart}${addressPart}`;
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
  };

  const resetConsultation = () => {
    setConstat("");
    setDiagnostique("");
    setTraitement("");
    setNote("");
    setHonoraires("");
    setSelectedPrescriptionTab("ordonnance");
    setPrescriptionItems([]);
    setStatusMessage("");
  };

  const submitConsultation = () => {
    if (!selectedPatient) {
      setStatusMessage("Veuillez d'abord selectionner un patient.");
      return;
    }

    setStatusMessage(`Consultation du ${consultationDate} enregistree pour ${selectedPatient.name}.`);
  };

  return (
    <div className="mx-auto max-w-387.5 space-y-6">
      <PageHeader
        title="Nouvelle consultation"
        subtitle="Selectionnez d'abord un patient, puis completez la consultation."
      />

      <AppCard className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[280px_1fr]">
          <div>
            <FieldLabel>Selectionner un patient</FieldLabel>
            <SelectInput value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)}>
              <option value="">Choisir un patient...</option>
              {searchablePatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
              {searchablePatients.length === 0 ? <option value="" disabled>Aucun patient trouve</option> : null}
            </SelectInput>
          </div>
          <div>
            <FieldLabel>Recherche rapide</FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                className="pl-10"
                placeholder="Rechercher un patient par nom, telephone ou adresse"
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
              />
            </div>
          </div>
        </div>

        {statusMessage ? <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">{statusMessage}</p> : null}

        {!selectedPatient ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Vous devez d'abord selectionner un patient pour afficher le formulaire de nouvelle consultation.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
              Accueil / Recherche / Resultat / Nouvelle consultation
            </div>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 card-shadow">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {selectedPatient.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">{selectedPatient.gender}. {selectedPatient.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{patientSummary(selectedPatient)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{selectedPatient.familyStatus}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{selectedPatient.age} ans</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{selectedPatient.phone}</span>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 card-shadow">
              <h3 className="text-lg font-bold text-primary">Informations personnelles</h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Chiffa</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedPatient.cardNumber || "Non renseigne"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Taille</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedPatient.heightCm ?? 0} cm</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Poids</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedPatient.weightKg ?? 0} kg</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2 xl:col-span-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Telephone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedPatient.phone}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Antecedents personnels</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedPatient.personalHistory || "RAS"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Antecedents familiaux</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedPatient.familyHistory || "RAS"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2 xl:col-span-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedPatient.note || "-"}</p>
                </div>
              </div>
            </section>

            <div className="border-t border-slate-200" />

            <section className="space-y-4">
              <h3 className="text-4xl font-light text-slate-500">Nouvelle consultation du {consultationDate}</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Constat</FieldLabel>
                  <TextArea rows={3} placeholder="constat ..." value={constat} onChange={(event) => setConstat(event.target.value)} className="rounded-none" />
                </div>
                <div>
                  <FieldLabel>Diagnostique</FieldLabel>
                  <TextArea rows={3} placeholder="Diagnostique ..." value={diagnostique} onChange={(event) => setDiagnostique(event.target.value)} className="rounded-none" />
                </div>
                <div>
                  <FieldLabel>Traitement</FieldLabel>
                  <TextArea rows={3} placeholder="Traitement ..." value={traitement} onChange={(event) => setTraitement(event.target.value)} className="rounded-none" />
                </div>
                <div>
                  <FieldLabel>Note</FieldLabel>
                  <TextArea rows={3} placeholder="Note ..." value={note} onChange={(event) => setNote(event.target.value)} className="rounded-none" />
                </div>
              </div>

              <div className="max-w-md space-y-2">
                <FieldLabel>Honoraires</FieldLabel>
                <div className="grid grid-cols-[56px_1fr_72px]">
                  <span className="border border-slate-300 bg-slate-100 px-3 py-2 text-sm">DZD</span>
                  <TextInput value={honoraires} onChange={(event) => setHonoraires(event.target.value)} placeholder="Honoraires ..." className="rounded-none border-x-0" />
                  <span className="border border-slate-300 bg-slate-100 px-3 py-2 text-sm">,00 DA</span>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-[170px_1fr]">
              <aside className="space-y-2 text-sm font-semibold text-slate-600">
                <button
                  className={`w-full border px-3 py-2 text-left ${selectedPrescriptionTab === "ordonnance" ? "border-slate-300 bg-white text-slate-900" : "border-slate-200 bg-slate-100"}`}
                  type="button"
                  onClick={() => setSelectedPrescriptionTab("ordonnance")}
                >
                  Ordonnance
                </button>
                <button
                  className={`w-full border px-3 py-2 text-left ${selectedPrescriptionTab === "bilan" ? "border-slate-300 bg-white text-slate-900" : "border-slate-200 bg-slate-100"}`}
                  type="button"
                  onClick={() => setSelectedPrescriptionTab("bilan")}
                >
                  Fiche bilan
                </button>
                <button
                  className={`w-full border px-3 py-2 text-left ${selectedPrescriptionTab === "travail" ? "border-slate-300 bg-white text-slate-900" : "border-slate-200 bg-slate-100"}`}
                  type="button"
                  onClick={() => setSelectedPrescriptionTab("travail")}
                >
                  Arret de travail
                </button>
                <button
                  className={`w-full border px-3 py-2 text-left ${selectedPrescriptionTab === "maladie" ? "border-slate-300 bg-white text-slate-900" : "border-slate-200 bg-slate-100"}`}
                  type="button"
                  onClick={() => setSelectedPrescriptionTab("maladie")}
                >
                  Arret de maladie
                </button>
              </aside>

              <div className="space-y-3">
                <h4 className="text-4xl font-light text-slate-500">Ordonnance</h4>
                <div className="border border-fuchsia-700">
                  <div className="flex items-center justify-between bg-fuchsia-700 px-4 py-2 text-sm font-semibold text-white">
                    <span>Gestion de l'ordonnance</span>
                    <span>▾</span>
                  </div>

                  <div className="space-y-3 bg-white p-3">
                    <button type="button" onClick={addPrescriptionItem} className="inline-flex items-center gap-1 border bg-slate-50 px-3 py-2 text-sm font-semibold">
                      Nouveau <Plus className="h-4 w-4" />
                    </button>

                    <div className="grid gap-2 md:grid-cols-4">
                      <TextInput value={newMedication} onChange={(event) => setNewMedication(event.target.value)} placeholder="Medicament" className="rounded-none" />
                      <TextInput value={newMedicationType} onChange={(event) => setNewMedicationType(event.target.value)} placeholder="Type" className="rounded-none" />
                      <TextInput value={newMedicationPrise} onChange={(event) => setNewMedicationPrise(event.target.value)} placeholder="Prise" className="rounded-none" />
                      <TextInput value={newMedicationDuration} onChange={(event) => setNewMedicationDuration(event.target.value)} placeholder="Duree" className="rounded-none" />
                    </div>

                    <div className="overflow-x-auto border border-slate-300">
                      <table className="w-full min-w-200 border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-300 bg-slate-50 text-slate-600">
                            <th className="px-3 py-2 font-semibold">Medicament</th>
                            <th className="px-3 py-2 font-semibold">Type</th>
                            <th className="px-3 py-2 font-semibold">Prise</th>
                            <th className="px-3 py-2 font-semibold">Duree</th>
                            <th className="px-3 py-2 font-semibold">Modifier</th>
                            <th className="px-3 py-2 font-semibold">Supprimer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptionItems.length === 0 ? (
                            <tr>
                              <td className="px-3 py-3 text-slate-500" colSpan={6}>
                                Aucun traitement introduit
                              </td>
                            </tr>
                          ) : (
                            prescriptionItems.map((item) => (
                              <tr key={item.id} className="border-b border-slate-200">
                                <td className="px-3 py-2">{item.medication}</td>
                                <td className="px-3 py-2">{item.type || "-"}</td>
                                <td className="px-3 py-2">{item.prise || "-"}</td>
                                <td className="px-3 py-2">{item.duration || "-"}</td>
                                <td className="px-3 py-2 text-slate-500">-</td>
                                <td className="px-3 py-2 text-slate-500">-</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex items-center gap-2 border-t border-slate-200 pt-4">
              <AppButton onClick={submitConsultation}>Ajouter</AppButton>
              <AppButton variant="secondary" onClick={resetConsultation}>
                Annuler
              </AppButton>
            </div>
          </div>
        )}
      </AppCard>
    </div>
  );
}
