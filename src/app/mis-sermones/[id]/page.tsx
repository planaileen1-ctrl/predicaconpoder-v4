"use client";

import { useEffect, useState } from "react";
import app from "@/lib/firebase";
import { getFirestore } from "firebase/firestore";
const db = getFirestore(app);
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function VerSermonPage() {
  const { id } = useParams<{ id: string }>();
  const [sermon, setSermon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      const snap = await getDoc(doc(db, "sermones", id));
      if (snap.exists()) setSermon(snap.data());
      setLoading(false);
    };

    cargar();
  }, [id]);

  if (loading)
    return (
      <main className="min-h-screen bg-black text-white p-6">
        Cargando sermón…
      </main>
    );

  if (!sermon)
    return (
      <main className="min-h-screen bg-black text-white p-6">
        Sermón no encontrado
      </main>
    );

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <Link
        href="/mis-sermones"
        className="text-blue-400"
      >
        ← Volver
      </Link>

      <h1 className="text-3xl font-bold mt-4 mb-2">
        {sermon.titulo}
      </h1>

      <p className="text-neutral-400 mb-6">
        {sermon.pasaje}
      </p>

      <p className="whitespace-pre-wrap mb-6">
        {sermon.contenido}
      </p>

      <Link
        href={`/mis-sermones/${id}/presentar`}
        className="inline-block px-4 py-2 bg-indigo-600 rounded-lg"
      >
        🎤 Predicar
      </Link>
    </main>
  );
}
