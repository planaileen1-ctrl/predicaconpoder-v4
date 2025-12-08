"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function PresentarSermon() {
  const { id } = useParams();
  const [sermon, setSermon] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      const snap = await getDoc(doc(db, "sermones", id as string));
      if (snap.exists()) setSermon(snap.data());
    };
    cargar();
  }, [id]);

  // cronómetro
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const format = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!sermon)
    return <div className="min-h-screen text-white p-6">Cargando...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6 text-xl leading-relaxed">
      <h1 className="text-3xl font-bold mb-4">{sermon.titulo}</h1>
      <p className="text-neutral-400 mb-6">{sermon.pasaje}</p>

      <div className="mb-8 text-2xl font-bold">⏱ {format(seconds)}</div>

      {sermon.contenido?.split("\n").map((p: string, i: number) => (
        <p key={i} className="mb-6">
          {p}
        </p>
      ))}
    </main>
  );
}
