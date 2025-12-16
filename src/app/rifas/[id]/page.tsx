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

  // 🔥 NUEVO: control de pasos
  const [pasoPago, setPasoPago] = useState(false);

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
    if (pasoPago) return; // ⛔ no cambiar selección en paso pago

    setSeleccionados((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  /* ================= RESET ================= */
  const resetSeleccion = () => {
    setSeleccionados([]);
    setNombre("");
    setTelefono("");
    setMensajeTransferencia(null);
    setPasoPago(false);
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
      "Acabas de separar tus números, ahora haz el depósito a la cuenta de ahorro #55443713 del Banco de Guayaquil a nombre de Olga Jiménez Alvarado.\n\nEnvía tu comprobante al 0961079919."
    );

    setSeleccionados([]);
    setNombre("");
    setTelefono("");
    setPasoPago(false);
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
          <div className="mb-8 bg-emerald-900/30 border border-emerald-600 rounded-2xl p-6 whitespace-pre-line text-lg">
            {mensajeTransferencia}
          </div>
        )}

        {/* ===== PASO 1: BOTÓN SIGUIENTE ===== */}
        {seleccionados.length > 0 && !pasoPago && !mensajeTransferencia && (
          <div className="my-6 text-center">
            <p className="mb-3 text-neutral-300">
              Has seleccionado:{" "}
              <b className="text-white">{seleccionados.join(", ")}</b>
            </p>

            <button
              onClick={() => setPasoPago(true)}
              className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 rounded-2xl font-bold text-lg"
            >
              👉 Siguiente paso ({seleccionados.length} número
              {seleccionados.length > 1 ? "s" : ""})
            </button>
          </div>
        )}

        {/* ===== PASO 2: FORMULARIO ===== */}
        {pasoPago && !mensajeTransferencia && (
          <div className="mb-10 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md">
            <h2 className="text-xl font-bold mb-2">
              Números: {seleccionados.join(", ")}
            </h2>

            <p className="mb-2">Total: ${totalPagar}</p>

            <button
              onClick={() => setPasoPago(false)}
              className="mb-4 w-full bg-neutral-700 hover:bg-neutral-600 py-2 rounded-lg text-sm"
            >
              ← Volver a elegir números
            </button>

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

            <button
              onClick={reservarPorTransferencia}
              className="bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-bold w-full"
            >
              🏦 Transferencia bancaria
            </button>
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {lista.map((n) => {
            const bloqueado =
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
