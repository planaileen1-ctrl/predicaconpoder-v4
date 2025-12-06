"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import bible from "@/data/bible.json";

export default function LibroPage() {
  const params = useParams();

  // 🔥 Convertir a string siempre para evitar arrays
  const book = Array.isArray(params.book) ? params.book[0] : params.book;

  // 🔥 Obtener capítulos correctamente
  const chapters = Object.keys(bible[book] || {});

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">{book}</h1>
      <p className="text-neutral-400 mb-4">Selecciona un capítulo:</p>

      <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
        {chapters.map((c) => (
          <Link
            key={c}
            href={`/biblia/${book}/${c}`}
            className="p-2 bg-neutral-900 text-center rounded-lg border border-neutral-800 hover:bg-neutral-800 transition"
          >
            {c}
          </Link>
        ))}
      </div>
    </main>
  );
}
