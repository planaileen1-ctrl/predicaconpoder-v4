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

  const [mensajeTransferencia, setMensajeTransferencia] = useState<string | null>(
    null
  );

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

<<<<<<< HEAD
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
=======
  /* ================= RESERVA MANUAL ================= */
  const reservarNumero = async () => {
    if (rifa.estado === "sorteada") {
      alert("Esta rifa ya fue sorteada.");
>>>>>>> a707d1dda4b4e47d0cd94a10aef1484ca1c28026
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
      `Sus números han sido separados, pero para mantenerlos debe realizar el pago de: $${totalPagar}.\n\n` +
        `Puede hacer la transferencia al Banco de Guayaquil,\n` +
        `Cuenta de ahorro 50174323\n` +
        `A nombre de Olga Jiménez Alvarado.`
    );

    setSeleccionados([]);
    setNombre("");
    setTelefono("");
  };

  /* ================= PAYPHONE (ARREGLADO) ================= */
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
          numero: seleccionados.join(","), // ✅ PayPhone recibe string
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

<<<<<<< HEAD
=======
  /* ================= PAYPHONE (DEBUG) ================= */
  const pagarConPayPhone = async () => {
    if (!seleccionado || !nombre || !telefono) {
      alert("Completa nombre y teléfono");
      return;
    }

    try {
      console.log("➡️ Enviando a PayPhone:", {
        rifaId: id,
        numero: seleccionado,
        nombre,
        telefono,
        monto: rifa.precioNumero,
      });

      const res = await fetch(
        "https://us-central1-predicaconpoder-a8aa0.cloudfunctions.net/createPayphonePayment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rifaId: id,
            numero: seleccionado,
            nombre,
            telefono,
            monto: rifa.precioNumero,
          }),
        }
      );

      console.log("⬅️ STATUS:", res.status);

      const text = await res.text();
      console.log("⬅️ RESPUESTA RAW:", text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        alert(
          "Respuesta NO es JSON. Revisa Firebase Logs.\n\nRespuesta:\n" +
            text
        );
        return;
      }

      if (!res.ok) {
        alert(
          `Error PayPhone HTTP ${res.status}\n\n` +
            JSON.stringify(data, null, 2)
        );
        return;
      }

      if (!data.paymentUrl) {
        alert(
          "No se recibió paymentUrl.\n\n" +
            JSON.stringify(data, null, 2)
        );
        return;
      }

      console.log("✅ Redirigiendo a PayPhone:", data.paymentUrl);

      window.location.href = data.paymentUrl;
    } catch (e: any) {
      console.error("❌ ERROR PAYPHONE:", e);
      alert(
        "Error PayPhone (ver consola F12)\n\nMensaje:\n" +
          (e?.message || "sin mensaje")
      );
    }
  };

>>>>>>> a707d1dda4b4e47d0cd94a10aef1484ca1c28026
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

<<<<<<< HEAD
        {/* ✅ PANEL ADMIN (SOLO TÚ) */}
=======
        {/* ===== GANADOR ===== */}
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
>>>>>>> a707d1dda4b4e47d0cd94a10aef1484ca1c28026
        {rifa.creadorUid === auth.currentUser?.uid && (
          <button
            onClick={() => router.push(`/rifas/${id}/admin`)}
            className="mb-6 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold"
          >
            ⚙️ Panel Admin
          </button>
        )}

<<<<<<< HEAD
        {/* MENSAJE TRANSFERENCIA */}
        {mensajeTransferencia && (
          <div className="mb-8 bg-emerald-900/30 border border-emerald-600 rounded-2xl p-6 whitespace-pre-line">
            {mensajeTransferencia}
          </div>
        )}

        {/* FORMULARIO */}
        {seleccionados.length > 0 && (
          <div className="mb-10 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md">
            <h2 className="text-xl font-bold mb-2">
              Números seleccionados: {seleccionados.join(", ")}
=======
        {/* ================= FORMULARIO ================= */}
        {seleccionado && rifa.estado !== "sorteada" && (
          <div
            id="form-reserva"
            className="mb-10 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">
              Número {seleccionado}
>>>>>>> a707d1dda4b4e47d0cd94a10aef1484ca1c28026
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
<<<<<<< HEAD
                onClick={reservarPorTransferencia}
                className="bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-bold"
              >
                🏦 Transferencia bancaria
=======
                onClick={pagarConPayPhone}
                className="bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold"
              >
                💳 Pagar con PayPhone
              </button>

              <button
                onClick={reservarNumero}
                className="bg-pink-600 hover:bg-pink-700 py-3 rounded-xl font-bold"
              >
                Reservar sin pagar
>>>>>>> a707d1dda4b4e47d0cd94a10aef1484ca1c28026
              </button>
            </div>
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {lista.map((n) => {
            const bloqueado =
<<<<<<< HEAD
=======
              rifa.estado === "sorteada" ||
>>>>>>> a707d1dda4b4e47d0cd94a10aef1484ca1c28026
              numeros[n]?.estado === "pendiente_pago" ||
              numeros[n]?.estado === "pagado";

            return (
              <button
                key={n}
                disabled={bloqueado}
<<<<<<< HEAD
                onClick={() => toggleNumero(n)}
=======
                onClick={() => {
                  if (rifa.estado === "sorteada") return;
                  setSeleccionado(n);
                  setTimeout(() => {
                    document
                      .getElementById("form-reserva")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
>>>>>>> a707d1dda4b4e47d0cd94a10aef1484ca1c28026
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
