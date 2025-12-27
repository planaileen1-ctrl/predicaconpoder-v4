"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

export default function VerAsignacionPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<null | {
    paraNombre: string;
    paraDeseo: string;
    presupuesto: number;
  }>(null);

  const buscar = async () => {
    const n = (nombre || "").trim();

    if (!n) {
      alert("Ingresa tu nombre y apellido tal como te registraste.");
      return;
    }

    setCargando(true);
    setResultado(null);

    try {
      // 1) Buscar participante por nombreCompleto exacto
      const q = query(
        collection(db, "intercambio_regalos_participantes"),
        where("nombreCompleto", "==", n),
        limit(1)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        alert("No encontramos ese nombre. Escríbelo EXACTO como te registraste.");
        return;
      }

      const participante = snap.docs[0].data();
      const codigo = participante.codigo;

      if (!codigo || String(codigo).length !== 5) {
        alert("Este registro no tiene código válido. Vuelve a inscribirte.");
        return;
      }

      // 2) Buscar asignación por el código
      const asignRef = doc(db, "intercambio_regalos_asignaciones", String(codigo));
      const asignSnap = await getDoc(asignRef);

      if (!asignSnap.exists()) {
        alert("Aún no hay asignación. Puede que el sorteo no se haya realizado.");
        return;
      }

      const data = asignSnap.data();

      setResultado({
        paraNombre: data.paraNombre || "",
        paraDeseo: data.paraDeseo || "",
        presupuesto: data.presupuesto || 5,
      });
    } catch (e) {
      console.error(e);
      alert("Error consultando asignación.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.push("/intercambio-regalos")}
          className="text-sm text-indigo-400 hover:text-indigo-300 mb-6"
        >
          ← Volver al menú
        </button>

        <h1 className="text-3xl font-bold mb-2">🎁 Ver a quién me tocó</h1>
        <p className="text-neutral-400 mb-6">
          Escribe tu <b>Nombre y Apellido</b> tal como te registraste. No necesitas login.
        </p>

        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm mb-1 text-neutral-300">
              Nombre y Apellido (exacto)
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-pink-500"
            />
          </div>

          <button
            onClick={buscar}
            disabled={cargando}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-bold text-lg disabled:opacity-50"
          >
            {cargando ? "Buscando..." : "Ver resultado"}
          </button>

          {resultado && (
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-sm text-neutral-300 mb-2">
                Presupuesto máximo:{" "}
                <span className="text-pink-300 font-semibold">${resultado.presupuesto}</span>
              </p>
              <p className="text-lg font-bold">
                Te toca regalarle a:{" "}
                <span className="text-emerald-300">{resultado.paraNombre}</span>
              </p>
              <p className="text-sm text-neutral-300 mt-2">
                Le gustaría recibir:{" "}
                <span className="text-white font-semibold">{resultado.paraDeseo}</span>
              </p>
              <p className="text-xs text-neutral-500 mt-3">
                Si hay dos personas con el mismo nombre, luego lo mejoramos con una confirmación.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
