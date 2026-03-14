"use client";

import { useState, useRef } from "react";

interface PhotoUploadProps {
  onUploaded: (photoToken: string | null) => void;
  currentToken?: string | null;
}

async function compressImage(file: File, maxSize = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Error al comprimir"));
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Error al leer la imagen"));
    img.src = URL.createObjectURL(file);
  });
}

export function PhotoUpload({ onUploaded, currentToken }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(!!currentToken);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!["image/jpeg", "image/png", "image/heic", "image/heif"].includes(file.type)) {
      setError("Solo se aceptan archivos JPG, PNG o HEIC.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La foto no puede superar 10MB.");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);

      // Show preview of compressed image
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(compressed);

      const formData = new FormData();
      formData.append("photo", compressed);

      const res = await fetch("/api/aplicar/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploaded(true);
        onUploaded(data.photoToken);
      } else {
        const data = await res.json();
        setError(data.error || "Error al subir la foto.");
        setPreview(null);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo. Si el problema persiste, escríbenos a laglorietarest@gmail.com");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    setUploaded(false);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <label className="mb-3 block text-sm font-medium text-gray-700">
        Foto de identificacion <span className="text-red-400">*</span>
      </label>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {/* Photo area */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Subir foto de identificación"
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); !uploading && inputRef.current?.click(); } }}
          className={`relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors ${
            preview
              ? "border-primary-300 bg-primary-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif"
            onChange={handleInputChange}
            className="hidden"
          />

          {uploading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          ) : preview ? (
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
              />
            </svg>
          )}
        </div>

        {/* Text and actions */}
        <div className="flex-1 text-center sm:text-left">
          {uploaded && preview ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-primary-700">Foto subida correctamente</p>
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Eliminar foto
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600">
                Toca para {preview ? "cambiar" : "subir"} tu foto
              </p>
              <p className="mt-0.5 text-xs text-gray-400">JPG, PNG o HEIC (max. 10MB)</p>
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Legal disclaimer */}
      <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2.5">
        <p className="text-xs leading-relaxed text-amber-800">
          <span className="font-semibold">Aviso:</span> Esta foto es necesaria y sera utilizada
          unicamente con fines de identificacion interna durante el proceso de seleccion. Al subir
          tu foto, autorizas su uso exclusivo para este proposito. No sera compartida con terceros.
        </p>
      </div>
    </div>
  );
}
