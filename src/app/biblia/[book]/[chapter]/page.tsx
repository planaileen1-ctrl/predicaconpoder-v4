"use client";

import { useParams } from "next/navigation";
import bible from "@/data/bible.json";

export default function CapituloPage() {
  const params = useParams();

  if (!params || typeof params !== 'object' || !('book' in params) || !('chapter' in params)) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-400">Error: Parámetros inválidos</h1>
        <p>No se pudo obtener el libro o capítulo.</p>
      </main>
    );
  }

  // 🔥 Siempre convertir a string
  const book = Array.isArray(params.book) ? params.book[0] : params.book;
  const chapter = Array.isArray(params.chapter) ? params.chapter[0] : params.chapter;

  // 🔥 Tipar versículos para evitar errores
  const verses: Record<string, string> = bible[book]?.[chapter] || {};

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">
        {book} — Capítulo {chapter}
      </h1>

      <div className="space-y-4 text-lg leading-relaxed">
        {Object.entries(verses).map(([num, text]) => (
          <p key={num}>
            <span className="text-neutral-400">{num}. </span>
            {text}
          </p>
        ))}
      </div>
    </main>
  );
}
