"use client";

import { CalendarPlus, Clock3, PlusCircle, Search as SearchIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MOCK_APPOINTMENTS } from "@/app/constants";
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

const days = [
  { name: "Lun", date: "2026-04-06" },
  { name: "Mar", date: "2026-04-07" },
  { name: "Mer", date: "2026-04-08" },
  { name: "Jeu", date: "2026-04-09" },
  { name: "Ven", date: "2026-04-10" },
  { name: "Sam", date: "2026-04-11" },
];

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(
    MOCK_APPOINTMENTS.map((appointment) => ({ ...appointment, date: "2026-04-07" })),
  );
  const [selectedDate, setSelectedDate] = useState("2026-04-07");
  const [search, setSearch] = useState("");
  const [patientName, setPatientName] = useState("");
  const [time, setTime] = useState("11:00");
  const [type, setType] = useState("Consultation de suivi");
  const [status, setStatus] = useState<Appointment["status"]>("normal");

  const visibleAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.date === selectedDate)
      .filter((appointment) =>
        appointment.patientName.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, search, selectedDate]);

  const createAppointment = () => {
    if (!patientName.trim()) return;

    setAppointments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        patientName,
        time,
        date: selectedDate,
        type,
        status,
      },
    ]);
    setPatientName("");
    setStatus("normal");
    setType("Consultation de suivi");
  };

  const removeAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <PageHeader title="Calendrier des rendez-vous" subtitle="Planification journaliere et suivi des disponibilites." />

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
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", active ? "text-slate-900/70" : "text-slate-500")}>{day.name}</p>
                <p className="mt-1 text-sm font-bold">{day.date.slice(-2)}</p>
              </button>
            );
          })}
        </div>

        <AppCard>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-bold text-primary">Planning du {selectedDate}</h2>
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput className="pl-10" placeholder="Filtrer par patient" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>

          {visibleAppointments.length === 0 ? (
            <EmptyState title="Aucun rendez-vous" message="Ajoutez un rendez-vous depuis le panneau de planification." />
          ) : (
            <div className="space-y-3">
              {daySlots.map((slot) => {
                const slotAppointments = visibleAppointments.filter((appointment) => appointment.time === slot);

                if (slotAppointments.length === 0) {
                  return (
                    <div key={slot} className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-3">
                      <div className="w-16 text-xs font-bold text-slate-400">{slot}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <PlusCircle className="h-4 w-4" />
                        Libre
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={slot} className="space-y-2">
                    {slotAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
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
                          <StatusPill text={appointment.status === "urgent" ? "Urgent" : "Normal"} tone={appointment.status === "urgent" ? "warning" : "success"} />
                          <AppButton variant="danger" className="px-2.5" onClick={() => removeAppointment(appointment.id)}>
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

      <aside>
        <AppCard className="sticky top-24 space-y-4">
          <h3 className="text-lg font-bold text-primary">Planification rapide</h3>
          <div>
            <FieldLabel>Patient</FieldLabel>
            <TextInput value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="Nom du patient" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Date</FieldLabel>
              <TextInput type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </div>
            <div>
              <FieldLabel>Heure</FieldLabel>
              <TextInput type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
          </div>
          <div>
            <FieldLabel>Type de visite</FieldLabel>
            <SelectInput value={type} onChange={(event) => setType(event.target.value)}>
              <option>Consultation de suivi</option>
              <option>Premiere visite</option>
              <option>Vaccination</option>
              <option>Urgence</option>
            </SelectInput>
          </div>
          <div>
            <FieldLabel>Priorite</FieldLabel>
            <SelectInput value={status} onChange={(event) => setStatus(event.target.value as Appointment["status"])}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </SelectInput>
          </div>
          <AppButton className="w-full" onClick={createAppointment}>
            <CalendarPlus className="h-4 w-4" />
            Confirmer le RDV
          </AppButton>
        </AppCard>
      </aside>
    </div>
  );
}
