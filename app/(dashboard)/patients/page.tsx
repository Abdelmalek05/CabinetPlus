"use client";

import { Edit, Filter, Plus, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MOCK_PATIENTS } from "@/app/constants";
import type { Patient } from "@/app/types";
import {
  AppButton,
  AppCard,
  EmptyState,
  FieldLabel,
  Modal,
  PageHeader,
  SelectInput,
  TextArea,
  TextInput,
} from "@/app/components/ui/primitives";

type PatientForm = {
  cardNumber: string;
  gender: Patient["gender"];
  firstName: string;
  lastName: string;
  ageYears: number;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
  familyStatus: string;
  children: number;
  profession: string;
  address: string;
  phone: string;
  personalHistory: string;
  familyHistory: string;
  note: string;
};

const DEFAULT_FORM: PatientForm = {
  cardNumber: "",
  firstName: "",
  lastName: "",
  ageYears: 0,
  ageMonths: 0,
  weightKg: 0,
  heightCm: 0,
  address: "",
  phone: "",
  gender: "M",
  profession: "",
  children: 0,
  familyStatus: "Célibataire",
  personalHistory: "",
  familyHistory: "",
  note: "",
};

const normalizeFamilyStatus = (status: string) => {
  if (status === "Mariée" || status === "Marié" || status === "Marie(e)") return "Marie(e)";
  if (status === "Divorce(e)") return "Divorcé(e)";
  if (status === "Celibataire") return "Célibataire";
  return status;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [query, setQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState("Tous");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [form, setForm] = useState<PatientForm>(DEFAULT_FORM);

  useEffect(() => {
    setPatients((prev) => prev.map((patient) => ({ ...patient, familyStatus: normalizeFamilyStatus(patient.familyStatus) })));
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Ignore browser autofill updates when the search field is not actively focused.
    if (document.activeElement !== event.currentTarget) return;
    setQuery(event.target.value);
  };

  const isStepOneValid = () => {
    return Boolean(form.lastName.trim() && form.firstName.trim() && form.ageYears > 0);
  };

  const closePatientModal = () => {
    setIsModalOpen(false);
    setActiveStep(1);
    setFormError(null);
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchQuery =
        patient.name.toLowerCase().includes(query.toLowerCase()) ||
        patient.phone.includes(query) ||
        patient.address.toLowerCase().includes(query.toLowerCase());
      const matchStatus = familyFilter === "Tous" || normalizeFamilyStatus(patient.familyStatus) === familyFilter;
      return matchQuery && matchStatus;
    });
  }, [patients, query, familyFilter]);

  const openCreateModal = () => {
    setEditingPatientId(null);
    setForm(DEFAULT_FORM);
    setActiveStep(1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatientId(patient.id);
    setActiveStep(1);
    setFormError(null);
    setForm({
      cardNumber: patient.cardNumber ?? "",
      firstName: patient.firstName ?? "",
      lastName: patient.lastName ?? "",
      ageYears: patient.age,
      ageMonths: patient.ageMonths ?? 0,
      weightKg: patient.weightKg ?? 0,
      heightCm: patient.heightCm ?? 0,
      address: patient.address,
      phone: patient.phone,
      gender: patient.gender,
      profession: patient.profession,
      children: patient.children,
      familyStatus: patient.familyStatus,
      personalHistory: patient.personalHistory ?? "",
      familyHistory: patient.familyHistory ?? "",
      note: patient.note ?? "",
    });
    setIsModalOpen(true);
  };

  const goToConsultationStep = () => {
    if (!isStepOneValid()) {
      setFormError("Veuillez renseigner Nom, Prenom et Age avant de continuer.");
      return;
    }

    setFormError(null);
    setActiveStep(2);
  };

  const savePatient = () => {
    if (!isStepOneValid()) {
      setFormError("Veuillez renseigner Nom, Prenom et Age avant de valider.");
      setActiveStep(1);
      return;
    }

    setFormError(null);

    const fullName = `${form.lastName} ${form.firstName}`.trim();

    if (editingPatientId) {
      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === editingPatientId
            ? {
                ...patient,
                name: fullName,
                age: form.ageYears,
                address: form.address,
                phone: form.phone,
                gender: form.gender,
                profession: form.profession,
                children: form.children,
                familyStatus: form.familyStatus,
                cardNumber: form.cardNumber,
                firstName: form.firstName,
                lastName: form.lastName,
                ageMonths: form.ageMonths,
                weightKg: form.weightKg,
                heightCm: form.heightCm,
                personalHistory: form.personalHistory,
                familyHistory: form.familyHistory,
                note: form.note,
              }
            : patient,
        ),
      );
    } else {
      const newPatient: Patient = {
        id: String(Date.now()),
        name: fullName,
        age: form.ageYears,
        address: form.address,
        phone: form.phone,
        gender: form.gender,
        profession: form.profession,
        children: form.children,
        familyStatus: form.familyStatus,
        lastConsultation: new Date().toISOString().slice(0, 10),
        cardNumber: form.cardNumber,
        firstName: form.firstName,
        lastName: form.lastName,
        ageMonths: form.ageMonths,
        weightKg: form.weightKg,
        heightCm: form.heightCm,
        personalHistory: form.personalHistory,
        familyHistory: form.familyHistory,
        note: form.note,
      };
      setPatients((prev) => [newPatient, ...prev]);
    }

    closePatientModal();
  };

  const deletePatient = () => {
    if (!patientToDelete) return;
    setPatients((prev) => prev.filter((patient) => patient.id !== patientToDelete.id));
    setPatientToDelete(null);
  };

  return (
    <div className="mx-auto max-w-[1480px] space-y-6">
      <PageHeader
        title="Gestion des patients"
        subtitle="Recherche, ajout, mise a jour et suivi des dossiers patients."
        actions={
          <AppButton onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Nouveau patient
          </AppButton>
        }
      />

      <AppCard className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput
              className="pl-10"
              placeholder="Rechercher par nom, telephone ou adresse"
              name="patient-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={handleSearchChange}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <SelectInput className="pl-10" value={familyFilter} onChange={(event) => setFamilyFilter(event.target.value)}>
              <option>Tous</option>
              <option>Célibataire</option>
              <option>Marie(e)</option>
              <option>Divorcé(e)</option>
              <option>Veuf/Veuve</option>
            </SelectInput>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <EmptyState title="Aucun patient trouve" message="Essayez un autre filtre ou ajoutez un nouveau dossier." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-3">Patient</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Age</th>
                  <th className="px-3 py-3">Profession</th>
                  <th className="px-3 py-3">Derniere consultation</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-100 text-sm hover:bg-slate-50/80">
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{patient.name}</p>
                          <p className="text-xs text-slate-500">{patient.familyStatus}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-slate-600">
                      <p>{patient.phone}</p>
                      <p className="text-xs text-slate-500">{patient.address}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-700">{patient.age} ans</td>
                    <td className="px-3 py-4 text-slate-700">{patient.profession || "-"}</td>
                    <td className="px-3 py-4 text-slate-700">{patient.lastConsultation}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-1">
                        <AppButton variant="ghost" className="px-2.5" onClick={() => openEditModal(patient)}>
                          <Edit className="h-4 w-4" />
                        </AppButton>
                        <AppButton variant="danger" className="px-2.5" onClick={() => setPatientToDelete(patient)}>
                          <Trash2 className="h-4 w-4" />
                        </AppButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppCard>

      <Modal
        open={isModalOpen}
        title={editingPatientId ? "Modifier le patient" : "Ajouter un patient"}
        onClose={closePatientModal}
        size="xl"
        footer={
          <>
            <AppButton variant="secondary" onClick={closePatientModal}>
              Annuler
            </AppButton>
            {activeStep === 2 ? (
              <AppButton variant="secondary" onClick={() => setActiveStep(1)}>
                Retour
              </AppButton>
            ) : null}
            <AppButton onClick={activeStep === 1 ? goToConsultationStep : savePatient}>
              {activeStep === 1 ? "Suivant" : editingPatientId ? "Mettre a jour" : "Ajouter"}
            </AppButton>
          </>
        }
      >
        <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-xl bg-slate-100 p-1">
            <button
              className={`rounded-lg px-4 py-2 text-sm ${activeStep === 1 ? "bg-primary font-bold text-white" : "font-semibold text-slate-500"}`}
              onClick={() => setActiveStep(1)}
              type="button"
            >
              1- Information Personnelles
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm ${activeStep === 2 ? "bg-primary font-bold text-white" : "font-semibold text-slate-500"}`}
              onClick={() => setActiveStep(2)}
              type="button"
            >
              2- Consultation
            </button>
          </div>

          {formError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{formError}</p> : null}

          {activeStep === 1 ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <FieldLabel>N deg; Carte Chiffa</FieldLabel>
                  <TextInput value={form.cardNumber} onChange={(event) => setForm((prev) => ({ ...prev, cardNumber: event.target.value }))} placeholder="Carte Chiffa..." />
                </div>
                <div>
                  <FieldLabel>Civilite</FieldLabel>
                  <SelectInput value={form.gender} onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value as Patient["gender"] }))}>
                    <option value="M">M.</option>
                    <option value="Mme">Mme.</option>
                    <option value="Mlle">Mlle.</option>
                  </SelectInput>
                </div>
                <div>
                  <FieldLabel>Nom (*)</FieldLabel>
                  <TextInput value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} placeholder="Nom..." />
                </div>
                <div>
                  <FieldLabel>Prenom (*)</FieldLabel>
                  <TextInput value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} placeholder="Prenom..." />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel>Age (*)</FieldLabel>
                  <TextInput type="number" min={0} value={String(form.ageYears)} onChange={(event) => setForm((prev) => ({ ...prev, ageYears: Number(event.target.value) || 0 }))} placeholder="Age..." />
                </div>
                <div>
                  <FieldLabel>Poids</FieldLabel>
                  <TextInput type="number" min={0} value={String(form.weightKg)} onChange={(event) => setForm((prev) => ({ ...prev, weightKg: Number(event.target.value) || 0 }))} placeholder="Poids (kg)..." />
                </div>
                <div>
                  <FieldLabel>Taille</FieldLabel>
                  <TextInput type="number" min={0} value={String(form.heightCm)} onChange={(event) => setForm((prev) => ({ ...prev, heightCm: Number(event.target.value) || 0 }))} placeholder="Taille (cm)..." />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-6">
                <div className="md:col-span-1">
                  <FieldLabel>Sit. familiale</FieldLabel>
                  <SelectInput value={form.familyStatus} onChange={(event) => setForm((prev) => ({ ...prev, familyStatus: event.target.value }))}>
                    <option>Célibataire</option>
                    <option>Marie(e)</option>
                    <option>Divorcé(e)</option>
                    <option>Veuf/Veuve</option>
                  </SelectInput>
                </div>
                <div className="md:col-span-1">
                  <FieldLabel>Nb enfants</FieldLabel>
                  <TextInput type="number" min={0} value={String(form.children)} onChange={(event) => setForm((prev) => ({ ...prev, children: Number(event.target.value) || 0 }))} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Profession</FieldLabel>
                  <TextInput value={form.profession} onChange={(event) => setForm((prev) => ({ ...prev, profession: event.target.value }))} placeholder="Profession..." />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Adresse</FieldLabel>
                  <TextInput value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="Adresse..." />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-1">
                  <FieldLabel>Telephone</FieldLabel>
                  <TextInput value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Telephone..." />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <FieldLabel>Antecedants personnels</FieldLabel>
                <TextArea rows={3} value={form.personalHistory} onChange={(event) => setForm((prev) => ({ ...prev, personalHistory: event.target.value }))} placeholder="Antecedants personnels..." />
              </div>

              <div>
                <FieldLabel>Antecedants familiaux</FieldLabel>
                <TextArea rows={3} value={form.familyHistory} onChange={(event) => setForm((prev) => ({ ...prev, familyHistory: event.target.value }))} placeholder="Antecedants familiaux..." />
              </div>

              <div>
                <FieldLabel>Note</FieldLabel>
                <TextArea rows={3} value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Note..." />
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(patientToDelete)}
        title="Supprimer ce dossier ?"
        onClose={() => setPatientToDelete(null)}
        footer={
          <>
            <AppButton variant="secondary" onClick={() => setPatientToDelete(null)}>
              Annuler
            </AppButton>
            <AppButton variant="danger" onClick={deletePatient}>
              Supprimer
            </AppButton>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Le dossier de <strong>{patientToDelete?.name}</strong> sera supprime de la liste locale.
        </p>
      </Modal>
    </div>
  );
}
