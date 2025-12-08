"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function LecturasPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "lecturas"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBooks(list);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="text-white p-6">Cargando...</p>;

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Mis Lecturas</h1>

        <Link
          href="/dashboard"
          className="bg-neutral-800 px-4 py-2 rounded-lg hover:bg-neutral-700"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      <Link
        href="/lecturas/upload"
        className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 inline-block mb-6"
      >
        Subir nuevo libro PDF 📤
      </Link>

      <div className="flex flex-col gap-4">
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/lecturas/${b.id}`}
            className="bg-neutral-900 hover:bg-neutral-800 p-4 rounded-xl flex justify-between"
          >
            <div>
              <h2 className="text-lg font-bold">{b.titulo}</h2>
              <p className="text-neutral-400 text-sm">
                Última página: {b.lastPage ?? 1}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
