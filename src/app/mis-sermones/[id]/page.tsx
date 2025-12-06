"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ViewSermonPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const [sermon, setSermon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "sermones", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSermon(snap.data());
      }
      setLoading(false);
    };

    load();
  }, [id]);

  const archivarSermon = async () => {
    const ref = doc(db, "sermones", id);
    await updateDoc(ref, {
      archivado: true,
    });

    router.push("/archivo");
  };

  if (loading) return <p className="text-white p-6">Cargando...</p>;
  if (!sermon) return <p className="text-white p-6">Sermón no encontrado</p>;

  return (
    <main className="min-h-screen bg-black text-white p-6">

      {/* 🔙 BOTÓN DE RETORNO */}
      <Link
        href="/dashboard"
        className="inline-block mb-6 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition"
      >
        ← Regresar al Dashboard
      </Link>

      {/* TÍTULO */}
      <h1 className="text-3xl font-bold mb-2">{sermon.titulo}</h1>

      {/* PASAJE */}
      <p className="text-neutral-400 mb-6">{sermon.pasaje}</p>

      {/* CONTENIDO */}
      <p className="mb-6 whitespace-pre-wrap">{sermon.contenido}</p>

      {/* SUBTEMAS (si existen) */}
      {sermon.subtemas && sermon.subtemas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3">Subtemas</h2>
          <div className="space-y-4">
            {sermon.subtemas.map((sub: any, i: number) => (
              <div
                key={i}
                className="bg-neutral-900 p-4 rounded-xl border border-neutral-700"
              >
                <h3 className="font-semibold mb-2">{sub.titulo}</h3>
                <p className="whitespace-pre-wrap">{sub.contenido}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTONES */}
      <div className="flex gap-4">

        <Link
          href={`/mis-sermones/${id}/editar`}
          className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-500"
        >
          Editar
        </Link>

        <Link
          href={`/mis-sermones/${id}/predicar`}
          className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500"
        >
          Modo Predicación
        </Link>

        <button
          onClick={archivarSermon}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500"
        >
          Archivar
        </button>

      </div>
    </main>
  );
}
