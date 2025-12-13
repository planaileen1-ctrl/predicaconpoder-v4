"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NuevaRifaPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  /* ===== CAMPOS RIFA ===== */
  const [titulo, setTitulo] = useState("");
  const [premio, setPremio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioNumero, setPrecioNumero] = useState("");
  const [totalNumeros, setTotalNumeros] = useState("");
  const [fechaSorteo, setFechaSorteo] = useState("");

  /* ===== ESTADO ===== */
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

  /* ===== GUARDAR RIFA ===== */
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
      console.error("Error creando rifa:", e);
      alert("Ocurrió un error al crear la rifa");
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
      <div className="w-full max-w-3xl">
        {/* HEADER */}
        <header className="mb-10">
          <button
            onClick={() => router.push("/rifas")}
            className="text-indigo-400 text-sm hover:underline"
          >
            ← Volver a Rifas
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            Nueva <span className="text-pink-400">Rifa</span>
          </h1>
          <p className="text-neutral-400 mt-2 max-w-xl">
            Crea una rifa profesional: define el premio, precio por número y
            cantidad total.
          </p>
        </header>

        {/* FORMULARIO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6">
          {/* TÍTULO */}
          <div>
            <label className="block mb-2 font-semibold">
              Título de la rifa *
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Rifa solidaria – Viaje misionero"
              className="w-full bg-neutral-800 p-4 rounded-xl"
            />
          </div>

          {/* PREMIO */}
          <div>
            <label className="block mb-2 font-semibold">
              Premio *
            </label>
            <input
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              placeholder="Ej: Canasta familiar, TV, Celular"
              className="w-full bg-neutral-800 p-4 rounded-xl"
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block mb-2 font-semibold">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el objetivo de la rifa, reglas, etc."
              className="w-full bg-neutral-800 p-4 rounded-xl min-h-[100px]"
            />
          </div>

          {/* PRECIO + TOTAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-semibold">
                Precio por número *
              </label>
              <input
                type="number"
                value={precioNumero}
                onChange={(e) => setPrecioNumero(e.target.value)}
                placeholder="Ej: 2"
                className="w-full bg-neutral-800 p-4 rounded-xl"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">
                Cantidad de números *
              </label>
              <input
                type="number"
                value={totalNumeros}
                onChange={(e) => setTotalNumeros(e.target.value)}
                placeholder="Ej: 100"
                className="w-full bg-neutral-800 p-4 rounded-xl"
              />
            </div>
          </div>

          {/* FECHA SORTEO */}
          <div>
            <label className="block mb-2 font-semibold">
              Fecha de sorteo
            </label>
            <input
              type="date"
              value={fechaSorteo}
              onChange={(e) => setFechaSorteo(e.target.value)}
              className="w-full bg-neutral-800 p-4 rounded-xl"
            />
          </div>

          {/* ESTADO */}
          <div>
            <label className="block mb-2 font-semibold">
              Estado inicial
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="w-full bg-neutral-800 p-4 rounded-xl"
            >
              <option value="activa">Activa (vendiendo)</option>
              <option value="cerrada">Cerrada</option>
            </select>
          </div>

          {/* BOTONES */}
          <div className="pt-6 flex gap-4">
            <button
              onClick={() => router.push("/rifas")}
              className="px-5 py-3 rounded-xl bg-neutral-700 hover:bg-neutral-600"
            >
              Cancelar
            </button>

            <button
              onClick={guardarRifa}
              disabled={guardando}
              className="flex-1 px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 font-bold disabled:opacity-60"
            >
              {guardando ? "Creando rifa…" : "Crear Rifa"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
