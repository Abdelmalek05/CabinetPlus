"use client";

import { CalendarPlus, Clock3, PlusCircle, Search as SearchIcon, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Appointment } from "@/app/types";
import {
  AppButton,
  AppCard,
  EmptyState,
  FieldLabel,
  PageHeader,
  SelectInput,
  StatusPill,
  TextInput,
} from "@/app/components/ui/primitives";
import { cn } from "@/app/lib/utils";

const daySlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];

// Build the current week days dynamically
function getWeekDays() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      name: dayNames[i],
      date: d.toISOString().slice(0, 10),
    };
  });
}

const days = getWeekDays();
const todayStr = new Date().toISOString().slice(0, 10);

type FormErrors = {
  patientName?: string;
  date?: string;
  time?: string;
};

declare global {
  interface Window {
    cabinet: {
      appointments: {
        list: (options: { date?: string }) => Promise<Appointment[]>;
        create: (input: { patientId: string; date: string; state?: number }) => Promise<Appointment>;
        remove: (id: string) => Promise<boolean>;
      };
      patients: {
        search: (query: string, limit?: number) => Promise<{ id: string; name: string }[]>;
      };
    };
  }
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    days.find((d) => d.date === todayStr)?.date ?? days[1].date,
  );
  const [search, setSearch] = useState("");

  // Form fields
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientSuggestions, setPatientSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState("Consultation de suivi");
  const [status, setStatus] = useState<Appointment["status"]>("normal");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Load appointments when selected date changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await window.cabinet.appointments.list({ date: selectedDate });
        setAppointments(data);
      } catch (err) {
        console.error("Erreur chargement RDV:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedDate]);

  // Patient search suggestions
  useEffect(() => {
    if (!patientName.trim() || patientName.length < 2) {
      setPatientSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const results = await window.cabinet.patients.search(patientName, 5);
        setPatientSuggestions(results);
      } catch {
        setPatientSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientName]);

  const visibleAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.patientName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, search]);

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!patientName.trim()) {
      errors.patientName = "Le nom du patient est obligatoire.";
    }
    if (!selectedDate) {
      errors.date = "La date est obligatoire.";
    }
    if (!time) {
      errors.time = "L'heure est obligatoire.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    if (!patientId) {
      setFormErrors((prev) => ({
        ...prev,
        patientName: "Veuillez sélectionner un patient depuis la liste.",
      }));
      return;
    }

    setSubmitting(true);
    try {
      const created = await window.cabinet.appointments.create({
        patientId,
        date: selectedDate,
        state: status === "urgent" ? 1 : 0,
      });
      setAppointments((prev) => [...prev, { ...created, time, type }]);
      setPatientName("");
      setPatientId(null);
      setTime("09:00");
      setType("Consultation de suivi");
      setStatus("normal");
      setFormErrors({});
    } catch (err) {
      console.error("Erreur création RDV:", err);
      setFormErrors({ patientName: "Erreur lors de la création. Réessayez." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await window.cabinet.appointments.remove(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Erreur suppression RDV:", err);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <PageHeader
          title="Calendrier des rendez-vous"
          subtitle="Planification journaliere et suivi des disponibilites."
        />

        {/* Week days */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {days.map((day) => {
            const active = day.date === selectedDate;
            return (
              <button
                key={day.date}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  active
                    ? "border-emerald-500 bg-emerald-500 text-slate-950"
                    : "border-slate-200 bg-white hover:border-emerald-200",
                )}
                onClick={() => setSelectedDate(day.date)}
                type="button"
              >
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", active ? "text-slate-900/70" : "text-slate-500")}>
                  {day.name}
                </p>
                <p className="mt-1 text-sm font-bold">{day.date.slice(-2)}</p>
              </button>
            );
          })}
        </div>

        {/* Appointments list */}
        <AppCard>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-bold text-primary">Planning du {selectedDate}</h2>
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                className="pl-10"
                placeholder="Filtrer par patient"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Chargement...</p>
          ) : visibleAppointments.length === 0 ? (
            <EmptyState title="Aucun rendez-vous" message="Ajoutez un rendez-vous depuis le panneau de planification." />
          ) : (
            <div className="space-y-3">
              {daySlots.map((slot) => {
                const slotAppointments = visibleAppointments.filter((a) => a.time === slot);
                if (slotAppointments.length === 0) {
                  return (
                    <div key={slot} className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-3">
                      <div className="w-16 text-xs font-bold text-slate-400">{slot}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <PlusCircle className="h-4 w-4" /> Libre
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={slot} className="space-y-2">
                    {slotAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-white p-2 text-slate-600">
                            <Clock3 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {appointment.time} - {appointment.patientName}
                            </p>
                            <p className="text-sm text-slate-500">{appointment.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusPill
                            text={appointment.status === "urgent" ? "Urgent" : "Normal"}
                            tone={appointment.status === "urgent" ? "warning" : "success"}
                          />
                          <AppButton
                            variant="danger"
                            className="px-2.5"
                            onClick={() => handleDelete(appointment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </AppButton>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </AppCard>
      </div>

      {/* Sidebar form */}
      <aside>
        <AppCard className="sticky top-24 space-y-4">
          <h3 className="text-lg font-bold text-primary">Planification rapide</h3>

          {/* Patient field with suggestions */}
          <div className="relative">
            <FieldLabel>Patient</FieldLabel>
            <TextInput
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                setPatientId(null);
              }}
              placeholder="Rechercher un patient..."
            />
            {formErrors.patientName && (
              <p className="mt-1 text-xs text-red-500">{formErrors.patientName}</p>
            )}
            {patientSuggestions.length > 0 && !patientId && (
              <ul className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                {patientSuggestions.map((p) => (
                  <li
                    key={p.id}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-slate-50"
                    onClick={() => {
                      setPatientName(p.name);
                      setPatientId(p.id);
                      setPatientSuggestions([]);
                      setFormErrors((prev) => ({ ...prev, patientName: undefined }));
                    }}
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Date</FieldLabel>
              <TextInput
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              {formErrors.date && (
                <p className="mt-1 text-xs text-red-500">{formErrors.date}</p>
              )}
            </div>
            <div>
              <FieldLabel>Heure</FieldLabel>
              <TextInput
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              {formErrors.time && (
                <p className="mt-1 text-xs text-red-500">{formErrors.time}</p>
              )}
            </div>
          </div>

          <div>
            <FieldLabel>Type de visite</FieldLabel>
            <SelectInput value={type} onChange={(e) => setType(e.target.value)}>
              <option>Consultation de suivi</option>
              <option>Premiere visite</option>
              <option>Vaccination</option>
              <option>Urgence</option>
            </SelectInput>
          </div>

          <div>
            <FieldLabel>Priorite</FieldLabel>
            <SelectInput
              value={status}
              onChange={(e) => setStatus(e.target.value as Appointment["status"])}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </SelectInput>
          </div>

          <AppButton className="w-full" onClick={handleCreate} disabled={submitting}>
            <CalendarPlus className="h-4 w-4" />
            {submitting ? "Enregistrement..." : "Confirmer le RDV"}
          </AppButton>
        </AppCard>
      </aside>
    </div>
  );
}