"use client";

import { useState } from "react";
import { getPersonalInterviewSections } from "@/domain/personal-interview-questions";
import type { PersonalInterviewField } from "@/domain/personal-interview-questions";
import type { Position } from "@/domain/types";

interface Props {
  position: Position;
  onSubmit: (data: { observations: Record<string, string>; answers: Record<string, string> }) => Promise<void>;
  submitting: boolean;
}

export function PersonalInterviewForm({ position, onSubmit, submitting }: Props) {
  const sections = getPersonalInterviewSections(position);
  const [formData, setFormData] = useState<{ observations: Record<string, string>; answers: Record<string, string>; [key: string]: Record<string, string> }>({
    observations: {},
    answers: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(sectionId: string, fieldId: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [fieldId]: value },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const section of sections) {
      for (const field of section.fields) {
        if (!field.required) continue;
        const val = formData[section.id]?.[field.id];
        if (!val || val.trim() === "") {
          newErrors[field.id] = "Este campo es obligatorio";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">{section.title}</h3>
          <p className="mb-4 text-sm text-gray-500">{section.description}</p>

          <div className="space-y-5">
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={formData[section.id]?.[field.id] || ""}
                error={errors[field.id]}
                onChange={(val) => updateField(section.id, field.id, val)}
              />
            ))}
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
      >
        {submitting ? "Guardando entrevista..." : "Completar Entrevista Personal"}
      </button>
    </form>
  );
}

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: PersonalInterviewField;
  value: string;
  error?: string;
  onChange: (val: string) => void;
}) {
  if (field.type === "scale" || field.type === "punctuality") {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">{field.label}</label>
        <div className="flex flex-wrap gap-2">
          {field.options?.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                value === opt.value
                  ? opt.value === "EXCELENTE" || opt.value === "TEMPRANO" || opt.value === "A_TIEMPO"
                    ? "bg-primary-600 text-white ring-2 ring-primary-600/30"
                    : opt.value === "BUENA"
                      ? "bg-blue-600 text-white ring-2 ring-blue-600/30"
                      : opt.value === "REGULAR" || opt.value === "TARDE"
                        ? "bg-amber-500 text-white ring-2 ring-amber-500/30"
                        : "bg-red-500 text-white ring-2 ring-red-500/30"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          rows={3}
          className={`w-full rounded-lg border px-3 py-2.5 text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
            error ? "border-red-400" : "border-gray-200 ring-1 ring-gray-100"
          } resize-none`}
        />
        {field.maxLength && (
          <p className={`mt-0.5 text-right text-xs ${value.length > field.maxLength * 0.9 ? "text-orange-500" : "text-gray-400"}`}>
            {value.length}/{field.maxLength}
          </p>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return null;
}
