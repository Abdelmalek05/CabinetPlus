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
  MessageCircle, 
  FileSearch,
  History,
  AlertCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import { MOCK_PATIENTS } from "@/app/constants";
import type { Patient } from "@/app/types";
import { AppButton, AppCard, FieldLabel, PageHeader, SelectInput, TextArea, TextInput, StatusPill } from "@/app/components/ui/primitives";
import { cn } from "@/app/lib/utils";

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
  const [motif, setMotif] = useState("Céphalées persistantes et fatigue");
  const [examenClinique, setExamenClinique] = useState("");
  const [bp, setBp] = useState("14/9");
  const [temp, setTemp] = useState("37.2");
  const [diagnostique, setDiagnostique] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([
    { id: "1", medication: "Doliprane 1000mg", type: "Comprimé", prise: "1 comprimé 3 fois par jour", duration: "5 jours" }
  ]);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  // State for new medication addition
  const [newMedication, setNewMedication] = useState("");
  const [newMedicationType, setNewMedicationType] = useState("");
  const [newMedicationPrise, setNewMedicationPrise] = useState("");
  const [newMedicationDuration, setNewMedicationDuration] = useState("");

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
    setMotif("Céphalées persistantes et fatigue");
    setExamenClinique("");
    setBp("14/9");
    setTemp("37.2");
    setDiagnostique("");
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

  const removePrescriptionItem = (id: string) => {
    setPrescriptionItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      {/* Breadcrumb & Header Section */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="cursor-pointer hover:text-emerald-500" onClick={() => setSelectedPatientId("")}>Patients</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold text-slate-900">{selectedPatient?.name || "Nouvelle Consultation"}</span>
          </nav>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-primary">
            Nouvelle Consultation
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <AppButton variant="secondary" className="px-6" onClick={resetConsultation}>
            Mettre en attente
          </AppButton>
          <AppButton className="px-8 shadow-xl" onClick={submitConsultation}>
            Valider la séance
          </AppButton>
        </div>
      </header>

      {/* Patient Selection (Styled for the new design) */}
      {!selectedPatient && (
        <AppCard className="border-dashed border-slate-300 bg-slate-50/50 text-center py-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Rechercher un patient</h3>
          <p className="mt-2 text-slate-500">Veuillez d'abord sélectionner un patient pour commencer la consultation.</p>
          <div className="mx-auto mt-6 max-w-md space-y-4">
            <SelectInput 
              value={selectedPatientId} 
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-white shadow-sm"
            >
              <option value="">Choisir un patient...</option>
              {searchablePatients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </SelectInput>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput 
                className="pl-10 bg-white shadow-sm"
                placeholder="Recherche rapide..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>
          </div>
        </AppCard>
      )}

      {selectedPatient && (
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Left: History Timeline */}
          <section className="col-span-3 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <History className="h-5 w-5 text-primary" />
              <h3 className="font-headline font-bold text-lg text-primary">Historique</h3>
            </div>
            <div className="space-y-4">
              {[
                { date: "12 OCT 2023", title: "Suivi Hypertension", desc: "Pression artérielle stable. Adaptation posologie Amlodipine.", active: true },
                { date: "05 JUIL 2023", title: "Infection Respiratoire", desc: "Bronchite aiguë. Prescription antibiotiques 7 jours.", active: false },
                { date: "18 JAN 2023", title: "Bilan Annuel", desc: "Analyses de sang normales. Rappel vaccin grippe effectué.", active: false },
              ].map((item, i) => (
                <div 
                  key={i}
                  className={cn(
                    "bg-white p-5 rounded-2xl card-shadow border-l-4 transition-all hover:-translate-y-1 cursor-pointer",
                    item.active ? "border-emerald-500" : "border-slate-200 opacity-70"
                  )}
                >
                  <div className="mb-2">
                    <span className={cn(
                      "text-[10px] font-bold p-1 px-2 rounded uppercase tracking-wider",
                      item.active ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-50"
                    )}>
                      {item.date}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Center: Active Consultation Form */}
          <section className="col-span-6 space-y-8">
            <AppCard className="p-10 rounded-4xl border-slate-100">
              <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
                {/* Motif */}
                <div className="space-y-3">
                  <FieldLabel>Motif de consultation</FieldLabel>
                  <TextInput 
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    className="text-lg font-bold border-none bg-slate-50/50 focus:ring-emerald-500/10"
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
                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tension Artérielle</span>
                      <Activity className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <TextInput 
                        value={bp}
                        onChange={(e) => setBp(e.target.value)}
                        className="text-3xl font-headline font-extrabold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-24"
                      />
                      <span className="text-xs font-bold text-slate-400">mmHg</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Température</span>
                      <Thermometer className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                       <TextInput 
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                        className="text-3xl font-headline font-extrabold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-24"
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
                      className="pr-12 bg-slate-50/50 border-none"
                      value={diagnostique}
                      onChange={(e) => setDiagnostique(e.target.value)}
                    />
                    <Stethoscope className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  </div>
                </div>

                {/* Traitement */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <FieldLabel>Traitement / Ordonnance</FieldLabel>
                    <button 
                      type="button"
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                      onClick={() => {/* Mock add */}}
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter médicament
                    </button>
                  </div>
                  <div className="space-y-3">
                    {prescriptionItems.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/50 group hover:bg-emerald-50 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{item.medication}</p>
                          <p className="text-xs text-slate-500">{item.prise} - {item.duration}</p>
                        </div>
                        <button 
                          className="p-2 hover:bg-white rounded-lg text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                          onClick={() => removePrescriptionItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {prescriptionItems.length === 0 && (
                      <p className="text-sm text-center text-slate-400 py-4 border-2 border-dashed border-slate-100 rounded-xl">
                        Aucun médicament ajouté
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </AppCard>
          </section>

          {/* Right: AI Suggestions Sidebar */}
          <section className="col-span-3 sticky top-24 space-y-6">
            <AppCard className="overflow-hidden p-0 border-slate-100">
              <div className="pulse-gradient p-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 fill-current" />
                  <h3 className="font-headline font-bold text-lg">Assistant Aura</h3>
                </div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  AI Analysis Engine • Online
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Corrélation Détectée
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-primary">
                    <p className="text-sm leading-relaxed text-slate-700">
                      Les <span className="font-bold text-primary">céphalées</span> actuelles pourraient être liées au pic de tension ({bp}) observé ce matin.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-secondary font-bold text-[10px] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Suggestion d&apos;Examen
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-secondary">
                    <p className="text-sm leading-relaxed text-slate-700 italic">
                      &quot;Considérer un fond d&apos;œil pour exclure une rétinopathie hypertensive débutante.&quot;
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-[10px] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Contre-indication
                  </div>
                  <div className="bg-rose-50 p-4 rounded-xl border-l-4 border-rose-500">
                    <p className="text-sm leading-relaxed text-rose-900">
                      Patient allergique à la <span className="font-bold">Pénicilline</span> (vu dossier 2019).
                    </p>
                  </div>
                </div>

                <button 
                  className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                  onClick={() => setChatbotOpen(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Poser une question à l&apos;IA
                </button>
              </div>
            </AppCard>

            {/* Patient Documents */}
            <AppCard className="p-6 border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Documents Patient
              </h4>
              <div className="space-y-3">
                {[
                  { name: "Dernier Bilan Bio", info: "PDF • 12 Oct 2023", icon: FileText },
                  { name: "Radio Thorax", info: "DICOM • 05 Juil 2023", icon: FileSearch },
                ].map((doc, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
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

      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-8 right-8 z-100">
        <button 
          onClick={() => setChatbotOpen(!chatbotOpen)}
          className={cn(
            "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 group relative",
            chatbotOpen ? "bg-rose-500 rotate-90" : "bg-primary hover:scale-110"
          )}
        >
          {chatbotOpen ? (
            <Plus className="h-8 w-8 text-white rotate-45" />
          ) : (
            <>
              <Sparkles className="h-8 w-8 text-white group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-bounce">
                2
              </span>
            </>
          )}
        </button>

        {/* Quick Chat Overlay (Simplified) */}
        {chatbotOpen && (
          <div className="absolute bottom-20 right-0 w-96 bg-white rounded-4xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="pulse-gradient p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h4 className="font-bold">Assistant Aura</h4>
              </div>
              <StatusPill text="En ligne" tone="success" />
            </div>
            <div className="p-6 h-80 overflow-y-auto space-y-4 scrollbar-hide">
              <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none mr-12 text-sm">
                Bonjour Dr. Ferkoune, je suis là pour vous aider avec Mme Durand. Souhaitez-vous analyser les résultats du dernier bilan bio ?
              </div>
              <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none ml-12 text-sm">
                Oui, vérifie s&apos;il y a une augmentation de la créatinine.
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="relative">
                <TextInput placeholder="Posez votre question..." className="bg-white pr-12" />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-slate-100 rounded-lg">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold">{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
