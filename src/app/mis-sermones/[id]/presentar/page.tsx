"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
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
      const snap = await getDoc(
        doc(db, "sermones", id as string)
      );
      if (snap.exists()) {
        setSermon(snap.data());
      }
    };

    cargar();
  }, [id]);

  /* ================= CRONÓMETRO ================= */
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(
      () => setSeconds((s) => s + 1),
      1000
    );
    return () => clearInterval(interval);
  }, [running]);

  const format = (s: number) =>
    `${Math.floor(s / 60)}:${String(
      s % 60
    ).padStart(2, "0")}`;

  if (!sermon) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        Cargando sermón…
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-black text-white p-8 leading-relaxed"
      style={{ fontSize }}
    >
      {/* CONTROLES */}
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => setRunning(!running)}
          className="px-3 py-1 bg-neutral-800 rounded"
        >
          {running ? "⏸" : "▶"}
        </button>

        <button
          onClick={() => setFontSize((s) => s + 2)}
          className="px-3 py-1 bg-neutral-800 rounded"
        >
          A+
        </button>

        <button
          onClick={() =>
            setFontSize((s) => Math.max(16, s - 2))
          }
          className="px-3 py-1 bg-neutral-800 rounded"
        >
          A-
        </button>

        <button
          onClick={() =>
            document.fullscreenElement
              ? document.exitFullscreen()
              : document.documentElement.requestFullscreen()
          }
          className="px-3 py-1 bg-neutral-800 rounded"
        >
          ⛶
        </button>

        <button
          onClick={() =>
            router.push(`/mis-sermones/${id}`)
          }
          className="px-3 py-1 bg-red-600 rounded"
        >
          Salir
        </button>
      </div>

      {/* TÍTULO */}
      <h1 className="text-3xl font-bold mb-2">
        {sermon.titulo}
      </h1>

      <p className="text-neutral-400 mb-4">
        {sermon.pasaje}
      </p>

      {/* TEXTO BÍBLICO */}
      {sermon.versiculoTexto && (
        <div className="mb-8 p-5 bg-neutral-900 border border-neutral-700 rounded-xl italic">
          <p>{sermon.versiculoTexto}</p>
          <p className="text-sm text-neutral-400 mt-2 text-right">
            {sermon.pasaje} (
            {sermon.versionBiblia || "RVR1960"})
          </p>
        </div>
      )}

      {/* CRONÓMETRO */}
      <div className="mb-8 text-2xl font-bold">
        ⏱ {format(seconds)}
      </div>

      {/* SUBTEMAS Y CONTENIDO (HTML REAL) */}
      {sermon.subtemas?.map((sub: any, i: number) => (
        <div key={i} className="mb-10">
          <h2 className="font-bold mb-4">
            {sub.titulo}
          </h2>

          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: sub.contenido,
            }}
          />
        </div>
      ))}
    </main>
  );
}
