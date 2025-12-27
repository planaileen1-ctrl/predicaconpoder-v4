"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

/* ================= HELPERS ================= */
function formatFecha(fecha: string) {
  if (!fecha) return "Sin definir";
  return new Date(fecha).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ================= COMPONENTE ================= */
export default function NuevaRifaPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  /* ===== CAMPOS ===== */
  const [titulo, setTitulo] = useState("");
  const [premio, setPremio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioNumero, setPrecioNumero] = useState<number | "">("");
  const [totalNumeros, setTotalNumeros] = useState<number | "">("");
  const [fechaSorteo, setFechaSorteo] = useState("");
  const [estado, setEstado] = useState<"activa" | "cerrada">("activa");

  /* ===== AUTH ===== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  /* ===== CÁLCULOS ===== */
  const totalRecaudar = useMemo(() => {
    if (!precioNumero || !totalNumeros) return 0;
    return Number(precioNumero) * Number(totalNumeros);
  }, [precioNumero, totalNumeros]);

  /* ===== GUARDAR ===== */
  const guardarRifa = async () => {
    if (!uid) return;

    if (!titulo || !premio || !precioNumero || !totalNumeros) {
      alert("Completa los campos obligatorios");
      return;
    }

    setGuardando(true);

    try {
      await addDoc(collection(db, "rifas"), {
        creadorUid: uid,
        titulo,
        premio,
        descripcion,
        precioNumero: Number(precioNumero),
        totalNumeros: Number(totalNumeros),
        fechaSorteo,
        estado,
        vendidos: 0,
        createdAt: Timestamp.now(),
      });

      router.push("/rifas");
    } catch (e) {
      console.error(e);
      alert("Error al crear la rifa");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Verificando acceso…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10 flex justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ===== FORMULARIO ===== */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6">
          <header>
            <button
              onClick={() => router.push("/rifas")}
              className="text-indigo-400 text-sm hover:underline"
            >
              ← Volver a Rifas
            </button>
            <h1 className="text-3xl font-bold mt-2">
              Crear <span className="text-pink-400">Rifa</span>
            </h1>
          </header>

          <input
            placeholder="Título de la rifa *"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-neutral-800 p-4 rounded-xl"
          />

          <input
            placeholder="Premio *"
            value={premio}
            onChange={(e) => setPremio(e.target.value)}
            className="w-full bg-neutral-800 p-4 rounded-xl"
          />

          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full bg-neutral-800 p-4 rounded-xl min-h-[100px]"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Precio por número *"
              value={precioNumero}
              onChange={(e) => setPrecioNumero(Number(e.target.value))}
              className="w-full bg-neutral-800 p-4 rounded-xl"
            />
            <input
              type="number"
              placeholder="Cantidad de números *"
              value={totalNumeros}
              onChange={(e) => setTotalNumeros(Number(e.target.value))}
              className="w-full bg-neutral-800 p-4 rounded-xl"
            />
          </div>

          <input
            type="date"
            value={fechaSorteo}
            onChange={(e) => setFechaSorteo(e.target.value)}
            className="w-full bg-neutral-800 p-4 rounded-xl"
          />

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as any)}
            className="w-full bg-neutral-800 p-4 rounded-xl"
          >
            <option value="activa">Activa</option>
            <option value="cerrada">Cerrada</option>
          </select>

          <button
            onClick={guardarRifa}
            disabled={guardando}
            className="w-full mt-4 px-6 py-4 rounded-xl bg-pink-600 hover:bg-pink-700 font-bold disabled:opacity-60"
          >
            {guardando ? "Creando rifa…" : "Crear Rifa"}
          </button>
        </div>

        {/* ===== RESUMEN TIPO RIFARY ===== */}
        <aside className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 h-fit">
          <h2 className="text-xl font-bold">Resumen</h2>

          <div className="bg-neutral-800 rounded-2xl p-4 space-y-2">
            <p className="text-sm text-neutral-400">Recaudarás</p>
            <p className="text-3xl font-bold text-emerald-400">
              ${totalRecaudar}
            </p>
          </div>

          <div className="text-sm space-y-1">
            <p>🎟️ Precio: <strong>${precioNumero || 0}</strong></p>
            <p>🔢 Números: <strong>{totalNumeros || 0}</strong></p>
            <p>📅 Sorteo: <strong>{formatFecha(fechaSorteo)}</strong></p>
            <p>🟢 Estado: <strong>{estado}</strong></p>
          </div>

          <p className="text-xs text-neutral-400 pt-3">
            Al crear la rifa aceptas las condiciones de uso.
          </p>
        </aside>
      </div>
    </main>
  );
}
