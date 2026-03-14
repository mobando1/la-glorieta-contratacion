"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  label: string;
  required?: boolean;
  docType: string;
  uploadUrl: string;
  onUploaded: (info: { id: string; fileName: string }) => void;
  existingFile?: { id: string; fileName: string } | null;
}

export function FileUpload({
  label,
  required,
  docType,
  uploadUrl,
  onUploaded,
  existingFile,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState(existingFile || null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    // Client-side validation
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Solo se aceptan archivos JPG, PNG o PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo no debe exceder 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const info = { id: data.documentId, fileName: data.fileName };
        setUploadedFile(info);
        onUploaded(info);
      } else {
        const data = await res.json();
        setError(data.error || "Error al subir el archivo");
      }
    } catch {
      setError("Error de conexión. Si necesitas ayuda, escríbenos a laglorietarest@gmail.com");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (uploadedFile) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
          <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <div className="flex-1 text-sm">
            <p className="font-medium text-primary-800">{uploadedFile.fileName}</p>
            <p className="text-primary-600">Archivo subido correctamente</p>
          </div>
          <button
            onClick={() => {
              setUploadedFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <>
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            <p className="text-sm text-gray-600">Subiendo archivo...</p>
          </>
        ) : (
          <>
            <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-gray-600">
              Arrastra un archivo aquí o <span className="font-medium text-primary-600">haz clic para seleccionar</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">JPG, PNG o PDF (máx. 5MB)</p>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
