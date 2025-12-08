"use client";

import { useState } from "react";
import Link from "next/link";
import bible from "@/data/bible.json";

export default function BuscarBiblia() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { book: string; chapter: string; verse: string; text: string }[]
  >([]);

  const handleSearch = () => {
    if (!query.trim()) return;

    const q = query.toLowerCase();
    const found: any[] = [];

    for (const book of Object.keys(bible)) {
      const chapters = bible[book];

      for (const chapter of Object.keys(chapters)) {
        const verses = chapters[chapter];

        for (const verse of Object.keys(verses)) {
          const text = verses[verse];

          if (text.toLowerCase().includes(q)) {
            found.push({
              book,
              chapter,
              verse,
              text,
            });
          }
        }
      }
    }

    setResults(found);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">

      {/* 🔙 BOTÓN PARA REGRESAR A BIBLIA */}
      <Link
        href="/biblia"
        className="inline-block mb-4 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition"
      >
        ← Volver a Biblia
      </Link>

      <h1 className="text-2xl font-bold mb-4">Buscar en la Biblia</h1>

      {/* Barra de búsqueda */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Ej: amor, fe, Cristo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500"
        >
          Buscar
        </button>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        {results.length === 0 && query !== "" && (
          <p className="text-neutral-400">No se encontraron resultados.</p>
        )}

        {results.map((r, i) => (
          <Link
            key={i}
            href={`/biblia/${r.book}/${r.chapter}`}
            className="block p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition"
          >
            <p className="text-indigo-400 font-semibold">
              {r.book} {r.chapter}:{r.verse}
            </p>
            <p className="mt-1 text-neutral-200">{r.text}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
