"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

type Numero = {
  estado: "disponible" | "reservado" | "pagado";
  nombre?: string;
  telefono?: string;
};

export default function RifaPublicaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [rifa, setRifa] = useState<any>(null);
  const [numeros, setNumeros] = useState<Record<string, Numero>>({});
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  /* ================= CARGAR RIFA ================= */
  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      const snap = await getDoc(doc(db, "rifas", id as string));
      if (!snap.exists()) return;

      setRifa(snap.data());

      const numsSnap = await getDocs(
        collection(db, "rifas", id as string, "numeros")
      );

      const mapa: Record<string, Numero> = {};
      numsSnap.forEach((d) => {
        mapa[d.id] = d.data() as Numero;
      });

      setNumeros(mapa);
    };

    cargar();
  }, [id]);

  if (!rifa) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Cargando rifa…
      </div>
    );
  }

  /* ================= GRID ================= */
  const total = rifa.totalNumeros;
  const lista = Array.from({ length: total }, (_, i) =>
    String(i + 1).padStart(3, "0")
  );

  /* ================= RESERVAR ================= */
  const reservarNumero = async () => {
    if (rifa.estado === "sorteada") {
      alert("Esta rifa ya fue sorteada.");
      return;
    }

    if (!seleccionado || !nombre || !telefono) {
      alert("Completa tu nombre y teléfono");
      return;
    }

    await setDoc(
      doc(db, "rifas", id as string, "numeros", seleccionado),
      {
        estado: "reservado",
        nombre,
        telefono,
        reservadoAt: Timestamp.now(),
      }
    );

    setNumeros((prev) => ({
      ...prev,
      [seleccionado]: {
        estado: "reservado",
        nombre,
        telefono,
      },
    }));

    setSeleccionado(null);
    setNombre("");
    setTelefono("");

    alert("Número reservado. Contacta al organizador para el pago.");
  };

  const color = (n: string) => {
    const e = numeros[n]?.estado;
    if (e === "reservado") return "bg-amber-500";
    if (e === "pagado") return "bg-red-600";
    return "bg-emerald-600 hover:bg-emerald-500";
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* ================= INFO ================= */}
        <h1 className="text-3xl font-bold mb-2">{rifa.titulo}</h1>
        <p className="text-neutral-300 mb-1">🎁 {rifa.premio}</p>
        <p className="mb-6">💵 ${rifa.precioNumero} por número</p>

        {/* ===== GANADOR (SI YA SE SORTEÓ) ===== */}
        {rifa.estado === "sorteada" && rifa.ganador && (
          <div className="mb-8 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <h2 className="text-xl font-bold mb-2">🏆 Ganador</h2>
            <p className="text-neutral-200 text-lg">
              Número ganador:{" "}
              <span className="font-bold text-pink-400">
                {rifa.ganador.numero}
              </span>
            </p>
            <p className="text-neutral-400 mt-1">
              {rifa.ganador.nombre}
            </p>
          </div>
        )}

        {/* BOTÓN ADMIN */}
        {rifa.creadorUid === auth.currentUser?.uid && (
          <button
            onClick={() => router.push(`/rifas/${id}/admin`)}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold"
          >
            ⚙️ Panel Admin
          </button>
        )}

        {/* ================= FORMULARIO ================= */}
        {seleccionado && rifa.estado !== "sorteada" && (
          <div
            id="form-reserva"
            className="mb-10 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">
              Reservar número {seleccionado}
            </h2>

            <input
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-neutral-800 p-3 rounded mb-3"
            />

            <input
              placeholder="Teléfono / WhatsApp"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full bg-neutral-800 p-3 rounded mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setSeleccionado(null)}
                className="px-4 py-3 bg-neutral-700 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={reservarNumero}
                className="flex-1 bg-pink-600 hover:bg-pink-700 py-3 rounded-xl font-bold"
              >
                Reservar
              </button>
            </div>
          </div>
        )}

        {/* ================= GRID ================= */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {lista.map((n) => {
            const bloqueado =
              rifa.estado === "sorteada" ||
              numeros[n]?.estado === "reservado" ||
              numeros[n]?.estado === "pagado";

            return (
              <button
                key={n}
                disabled={bloqueado}
                onClick={() => {
                  if (rifa.estado === "sorteada") {
                    alert("Esta rifa ya fue sorteada.");
                    return;
                  }
                  setSeleccionado(n);
                  setTimeout(() => {
                    document
                      .getElementById("form-reserva")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
                className={`h-12 rounded-xl font-bold text-sm ${color(n)} ${
                  seleccionado === n ? "ring-4 ring-white" : ""
                } ${bloqueado ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
