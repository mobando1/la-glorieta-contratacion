"use client";

import { useState, useEffect, use } from "react";
import { FileUpload } from "@/components/onboarding/file-upload";

interface EmployeeData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  cedulaNumber: string;
  onboardingStatus: string;
}

interface DocInfo {
  id: string;
  type: string;
  fileName: string;
}

interface CompanyDocInfo {
  id: string;
  name: string;
  fileName: string;
}

type Step = 0 | 1 | 2 | 3;

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [step, setStep] = useState<Step>(0);
  const [completed, setCompleted] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cedulaNumber, setCedulaNumber] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // File refs
  const [cedulaFrente, setCedulaFrente] = useState<{ id: string; fileName: string } | null>(null);
  const [cedulaReverso, setCedulaReverso] = useState<{ id: string; fileName: string } | null>(null);

  // Company documents
  const [companyDocs, setCompanyDocs] = useState<CompanyDocInfo[]>([]);
  const [docsAcknowledged, setDocsAcknowledged] = useState(false);

  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const uploadUrl = `/api/onboarding/${token}/upload`;

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/onboarding/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al cargar datos");
        return;
      }
      const data = await res.json();
      setEmployee(data.employee);
      setDocuments(data.documents);

      // Pre-fill form
      setFullName(data.employee.fullName || "");
      setPhone(data.employee.phone || "");
      setEmail(data.employee.email || "");
      setAddress(data.employee.address || "");
      setCedulaNumber(data.employee.cedulaNumber || "");

      // Pre-fill uploaded docs
      const frente = data.documents.find((d: DocInfo) => d.type === "CEDULA_FRENTE");
      const reverso = data.documents.find((d: DocInfo) => d.type === "CEDULA_REVERSO");
      if (frente) setCedulaFrente({ id: frente.id, fileName: frente.fileName });
      if (reverso) setCedulaReverso({ id: reverso.id, fileName: reverso.fileName });

      // Fetch company documents
      try {
        const companyRes = await fetch(`/api/onboarding/${token}/company-documents`);
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompanyDocs(companyData.documents);
        }
      } catch {
        // Non-critical: continue without company docs
      }

      if (data.employee.onboardingStatus === "COMPLETADO") {
        setCompleted(true);
      }
    } catch {
      setError("Error de conexión. Si necesitas ayuda, escríbenos a laglorietarest@gmail.com");
    } finally {
      setLoading(false);
    }
  }

  function validateStep0(): boolean {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Nombre es obligatorio";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 7) errs.phone = "Teléfono inválido";
    if (!address.trim()) errs.address = "Dirección es obligatoria";
    if (!cedulaNumber.trim() || cedulaNumber.length < 5) errs.cedulaNumber = "Número de cédula inválido";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email inválido";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSaveInfo() {
    if (!validateStep0()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding/${token}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, address, cedulaNumber }),
      });
      if (res.ok) {
        setStep(hasCompanyDocs ? 1 : docsStep);
        window.scrollTo(0, 0);
      } else {
        const data = await res.json();
        setError(data.error || "Error al guardar");
      }
    } catch {
      setError("Error de conexión. Si necesitas ayuda, escríbenos a laglorietarest@gmail.com");
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${token}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        setCompleted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Error al completar");
      }
    } catch {
      setError("Error de conexión. Si necesitas ayuda, escríbenos a laglorietarest@gmail.com");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-sm rounded-card bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">Enlace inválido</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="mt-3 text-xs text-gray-400">
            Si necesitas ayuda, escr&iacute;benos a{" "}
            <a href="mailto:laglorietarest@gmail.com" className="text-primary-600 underline">laglorietarest@gmail.com</a>
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-sm animate-slide-up rounded-card bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">¡Proceso completado!</h2>
          <p className="text-sm text-gray-600">
            Tus datos y documentos han sido enviados exitosamente. Nos pondremos en contacto contigo pronto.
          </p>
        </div>
      </div>
    );
  }

  const hasCompanyDocs = companyDocs.length > 0;

  const STEPS = hasCompanyDocs
    ? [
        { title: "Datos Personales", shortTitle: "Datos" },
        { title: "Documentos Empresa", shortTitle: "Empresa" },
        { title: "Tus Documentos", shortTitle: "Docs" },
        { title: "Confirmación", shortTitle: "Conf." },
      ]
    : [
        { title: "Datos Personales", shortTitle: "Datos" },
        { title: "Documentos", shortTitle: "Docs" },
        { title: "Confirmación", shortTitle: "Conf." },
      ];

  const docsStep = hasCompanyDocs ? 2 : 1;
  const confirmStep = hasCompanyDocs ? 3 : 2;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  i < step
                    ? "bg-primary-600 text-white"
                    : i === step
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-600 ring-offset-2"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < step ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`mt-1 text-[10px] font-medium ${i === step ? "text-primary-700" : "text-gray-400"}`}>
                {s.shortTitle}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-0.5 flex-1">
                <div className={`h-full rounded-full ${i < step ? "bg-primary-600" : "bg-gray-200"}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Step 0: Personal info */}
      {step === 0 && (
        <div className="animate-slide-up rounded-card border-t-4 border-primary-500 bg-white p-6 shadow-card">
          <h2 className="mb-1 text-xl font-semibold text-gray-900">Datos Personales</h2>
          <p className="mb-6 text-sm text-gray-500">Verifica y completa tu información personal</p>

          <div className="space-y-4">
            <FormField label="Nombre completo" required value={fullName} onChange={setFullName} error={fieldErrors.fullName} />
            <FormField label="Teléfono" required value={phone} onChange={setPhone} error={fieldErrors.phone} />
            <FormField label="Email" value={email} onChange={setEmail} error={fieldErrors.email} placeholder="correo@ejemplo.com" />
            <FormField label="Dirección" required value={address} onChange={setAddress} error={fieldErrors.address} placeholder="Calle, barrio, ciudad" />
            <FormField label="Número de cédula" required value={cedulaNumber} onChange={setCedulaNumber} error={fieldErrors.cedulaNumber} />
          </div>

          <button
            onClick={handleSaveInfo}
            disabled={saving}
            className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Siguiente"}
          </button>
        </div>
      )}

      {/* Step 1: Company Documents (only if company docs exist) */}
      {hasCompanyDocs && step === 1 && (
        <div className="animate-slide-up rounded-card border-t-4 border-primary-500 bg-white p-6 shadow-card">
          <h2 className="mb-1 text-xl font-semibold text-gray-900">Documentos de la Empresa</h2>
          <p className="mb-6 text-sm text-gray-500">
            Por favor revisa y descarga los siguientes documentos importantes antes de continuar
          </p>

          <div className="space-y-3">
            {companyDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-8 w-8 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-400">{doc.fileName}</p>
                  </div>
                </div>
                <a
                  href={`/api/onboarding/${token}/company-documents/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100"
                >
                  Descargar
                </a>
              </div>
            ))}
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={docsAcknowledged}
              onChange={(e) => setDocsAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              He revisado y descargado los documentos de la empresa
            </span>
          </label>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setStep(0); window.scrollTo(0, 0); }}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => {
                if (!docsAcknowledged) {
                  setError("Debes confirmar que revisaste los documentos");
                  return;
                }
                setError(null);
                setStep(docsStep as Step);
                window.scrollTo(0, 0);
              }}
              disabled={!docsAcknowledged}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Documents step: Upload cédula */}
      {step === docsStep && (
        <div className="animate-slide-up rounded-card border-t-4 border-primary-500 bg-white p-6 shadow-card">
          <h2 className="mb-1 text-xl font-semibold text-gray-900">Tus Documentos</h2>
          <p className="mb-6 text-sm text-gray-500">Sube una foto o escaneo de tu cédula de ciudadanía</p>

          <div className="space-y-5">
            <FileUpload
              label="Cédula - Parte frontal"
              required
              docType="CEDULA_FRENTE"
              uploadUrl={uploadUrl}
              onUploaded={setCedulaFrente}
              existingFile={cedulaFrente}
            />
            <FileUpload
              label="Cédula - Parte posterior"
              docType="CEDULA_REVERSO"
              uploadUrl={uploadUrl}
              onUploaded={setCedulaReverso}
              existingFile={cedulaReverso}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setStep((hasCompanyDocs ? 1 : 0) as Step); window.scrollTo(0, 0); }}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => {
                if (!cedulaFrente) {
                  setError("Debes subir la parte frontal de tu cédula");
                  return;
                }
                setError(null);
                setStep(confirmStep as Step);
                window.scrollTo(0, 0);
              }}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.98]"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Confirmation step */}
      {step === confirmStep && (
        <div className="animate-slide-up rounded-card border-t-4 border-primary-500 bg-white p-6 shadow-card">
          <h2 className="mb-1 text-xl font-semibold text-gray-900">Confirmación</h2>
          <p className="mb-6 text-sm text-gray-500">Revisa que toda la información sea correcta</p>

          <div className="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
            <SummaryRow label="Nombre" value={fullName} />
            <SummaryRow label="Teléfono" value={phone} />
            {email && <SummaryRow label="Email" value={email} />}
            <SummaryRow label="Dirección" value={address} />
            <SummaryRow label="Cédula" value={cedulaNumber} />
            <div className="border-t border-gray-200 pt-3">
              <SummaryRow label="Cédula frontal" value={cedulaFrente?.fileName || "—"} />
              {cedulaReverso && <SummaryRow label="Cédula posterior" value={cedulaReverso.fileName} />}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setStep(docsStep as Step); window.scrollTo(0, 0); }}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
            >
              {completing ? "Enviando..." : "Confirmar y Completar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  required,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2.5 text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
          error ? "border-red-400" : "border-gray-200 ring-1 ring-gray-100"
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
