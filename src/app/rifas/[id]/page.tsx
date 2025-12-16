"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

/* ================= TIPOS ================= */
type Numero = {
  estado: "disponible" | "reservado" | "pendiente_pago" | "pagado";
  nombre?: string;
  telefono?: string;
};

export default function RifaPublicaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [rifa, setRifa] = useState<any>(null);
  const [numeros, setNumeros] = useState<Record<string, Numero>>({});

  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  const [mensajeTransferencia, setMensajeTransferencia] =
    useState<string | null>(null);

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
  const lista = Array.from({ length: rifa.totalNumeros }, (_, i) =>
    String(i + 1).padStart(3, "0")
  );

  const totalPagar = rifa.precioNumero * seleccionados.length;

  /* ================= TOGGLE ================= */
  const toggleNumero = (n: string) => {
    setSeleccionados((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  /* ================= TRANSFERENCIA ================= */
  const reservarPorTransferencia = async () => {
    if (!nombre || !telefono || seleccionados.length === 0) {
      alert("Selecciona números y completa tus datos");
      return;
    }

    const batch = writeBatch(db);

    seleccionados.forEach((n) => {
      batch.set(doc(db, "rifas", id as string, "numeros", n), {
        estado: "pendiente_pago",
        nombre,
        telefono,
        metodoPago: "transferencia",
        creadoAt: Timestamp.now(),
      });
    });

    await batch.commit();

    setMensajeTransferencia(
      `Sus números han sido separados.\n\n` +
        `Para mantenerlos debe realizar el pago de: $${totalPagar}.\n\n` +
        `Banco de Guayaquil\nCuenta de ahorro: 50174323\n` +
        `A nombre de Olga Jiménez Alvarado.`
    );

    setSeleccionados([]);
    setNombre("");
    setTelefono("");
  };

  /* ================= PAYPHONE ================= */
  const pagarConPayPhone = async () => {
    if (!nombre || !telefono || seleccionados.length === 0) {
      alert("Selecciona números y completa tus datos");
      return;
    }

    const res = await fetch(
      "https://us-central1-predicaconpoder-a8aa0.cloudfunctions.net/createPayphonePayment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rifaId: id,
          numero: seleccionados.join(","),
          nombre,
          telefono,
          monto: totalPagar,
        }),
      }
    );

    const data = await res.json();

    if (!data.paymentUrl) {
      alert("Error al generar pago");
      return;
    }

    window.location.href = data.paymentUrl;
  };

  /* ================= COLORES ================= */
  const color = (n: string) => {
    const e = numeros[n]?.estado;
    if (e === "pendiente_pago") return "bg-yellow-500";
    if (e === "reservado") return "bg-amber-500";
    if (e === "pagado") return "bg-red-600";
    if (seleccionados.includes(n)) return "bg-indigo-600";
    return "bg-emerald-600 hover:bg-emerald-500";
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{rifa.titulo}</h1>
        <p className="text-neutral-300 mb-1">🎁 {rifa.premio}</p>
        <p className="mb-4">💵 ${rifa.precioNumero} por número</p>

        {/* ===== GANADOR ===== */}
        {rifa.estado === "sorteada" && rifa.ganador && (
          <div className="mb-8 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <h2 className="text-xl font-bold mb-2">🏆 Ganador</h2>
            <p className="text-lg">
              Número ganador:{" "}
              <span className="text-pink-400 font-bold">
                {rifa.ganador.numero}
              </span>
            </p>
            <p className="text-neutral-400">{rifa.ganador.nombre}</p>
          </div>
        )}

        {/* PANEL ADMIN */}
        {rifa.creadorUid === auth.currentUser?.uid && (
          <button
            onClick={() => router.push(`/rifas/${id}/admin`)}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold"
          >
            ⚙️ Panel Admin
          </button>
        )}

        {/* MENSAJE TRANSFERENCIA */}
        {mensajeTransferencia && (
          <div className="mb-8 bg-emerald-900/30 border border-emerald-600 rounded-2xl p-6 whitespace-pre-line">
            {mensajeTransferencia}
          </div>
        )}

        {/* FORMULARIO */}
        {seleccionados.length > 0 && rifa.estado !== "sorteada" && (
          <div className="mb-10 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md">
            <h2 className="text-xl font-bold mb-2">
              Números: {seleccionados.join(", ")}
            </h2>

            <p className="mb-4">Total: ${totalPagar}</p>

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

            <div className="flex flex-col gap-3">
              <button
                onClick={pagarConPayPhone}
                className="bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold"
              >
                💳 Pagar con PayPhone
              </button>

              <button
                onClick={reservarPorTransferencia}
                className="bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-bold"
              >
                🏦 Transferencia bancaria
              </button>
            </div>
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {lista.map((n) => {
            const bloqueado =
              rifa.estado === "sorteada" ||
              numeros[n]?.estado === "pendiente_pago" ||
              numeros[n]?.estado === "pagado";

            return (
              <button
                key={n}
                disabled={bloqueado}
                onClick={() => toggleNumero(n)}
                className={`h-12 rounded-xl font-bold text-sm ${color(n)} ${
                  bloqueado ? "opacity-60 cursor-not-allowed" : ""
                }`}
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
