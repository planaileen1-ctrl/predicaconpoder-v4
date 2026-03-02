"use client";

import { useEffect, useState } from "react";
import app from "@/lib/firebase";
import { getFirestore } from "firebase/firestore";
const db = getFirestore(app);
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

export default function PresentarSermon() {
  const { id } = useParams();
  const router = useRouter();

  const [sermon, setSermon] = useState<any>(null);

  /* ===== CRONÓMETRO ===== */
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  /* ===== UI ===== */
  const [fontSize, setFontSize] = useState(22);

  /* ================= CARGAR SERMON ================= */
  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      const snap = await getDoc(doc(db, "sermones", id as string));
      if (snap.exists()) {
        setSermon(snap.data());
      }
    };

    cargar();
  }, [id]);

  /* ================= CRONÓMETRO ================= */
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const format = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!sermon) {
    return (
      <div className="h-screen bg-black text-white p-6 flex items-center justify-center">
        Cargando sermón…
      </div>
    );
  }

  return (
    <main
      className="min-h-screen overflow-y-auto bg-black text-white p-8 leading-relaxed"
      style={{ fontSize }}
    >
      {/* ================= CONTROLES ================= */}
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => setRunning(!running)}
          className="px-3 py-1 bg-neutral-800 rounded hover:bg-neutral-700"
        >
          {running ? "⏸" : "▶"}
        </button>

        <button
          onClick={() => setFontSize((s) => s + 2)}
          className="px-3 py-1 bg-neutral-800 rounded hover:bg-neutral-700"
        >
          A+
        </button>

        <button
          onClick={() => setFontSize((s) => Math.max(16, s - 2))}
          className="px-3 py-1 bg-neutral-800 rounded hover:bg-neutral-700"
        >
          A-
        </button>

        <button
          onClick={() =>
            document.fullscreenElement
              ? document.exitFullscreen()
              : document.documentElement.requestFullscreen()
          }
          className="px-3 py-1 bg-neutral-800 rounded hover:bg-neutral-700"
        >
          ⛶
        </button>

        <button
          onClick={() => router.push(`/mis-sermones/${id}`)}
          className="px-3 py-1 bg-red-600 rounded hover:bg-red-500"
        >
          Salir
        </button>
      </div>

      {/* ================= CONTENIDO ================= */}
      <div className="max-w-4xl mx-auto">
        {/* TÍTULO */}
        <h1 className="text-3xl font-bold mb-2">{sermon.titulo}</h1>
        <p className="text-neutral-400 mb-6">{sermon.pasaje}</p>

        {/* TEXTO BÍBLICO */}
        {sermon.versiculoTexto && (
          <div className="mb-8 p-5 bg-neutral-900 border border-neutral-700 rounded-xl italic">
            <p className="whitespace-pre-wrap">{sermon.versiculoTexto}</p>
            <p className="text-sm text-neutral-400 mt-2 text-right">
              {sermon.pasaje} ({sermon.versionBiblia || "RVR1960"})
            </p>
          </div>
        )}

        {/* CRONÓMETRO */}
        <div className="mb-8 text-2xl font-bold">
          ⏱ {format(seconds)}
        </div>

        {/* ===== CONTENIDO PRINCIPAL (ANTES NO SE MOSTRABA) ===== */}
        {sermon.contenido && (
          <div className="mb-12 whitespace-pre-wrap">
            {sermon.contenido}
          </div>
        )}

        {/* SUBTEMAS */}
        {sermon.subtemas?.map((sub: any, i: number) => (
          <div key={i} className="mb-12">
            <h2 className="text-xl font-bold mb-4">{sub.titulo}</h2>
            <div className="whitespace-pre-wrap">
              {sub.contenido}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
