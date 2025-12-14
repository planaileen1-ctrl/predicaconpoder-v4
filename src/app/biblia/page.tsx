"use client";

import Link from "next/link";
import bible from "../../data/bible.json";

export default function BibliaHome() {
  const books = Object.keys(bible);

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">

      {/* 🔙 VOLVER AL DASHBOARD */}
      <Link
        href="/dashboard"
        className="inline-block mb-4 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition"
      >
        ← Volver al Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-6">Biblia</h1>

      {/* 🔍 Botón de búsqueda */}
      <Link
        href="/biblia/buscar"
        className="inline-block mb-6 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
      >
        🔍 Buscar en la Biblia
      </Link>

      <p className="text-neutral-400 mb-6">Selecciona un libro:</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {books.map((book) => (
          <Link
            key={book}
            href={`/biblia/${book}`}
            className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition"
          >
            {book}
          </Link>
        ))}
      </div>

    </main>
  );
}
