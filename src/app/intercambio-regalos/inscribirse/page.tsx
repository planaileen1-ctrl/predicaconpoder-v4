"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

/* ================= HELPERS ================= */
function generarCodigo5Digitos() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/* ================= TIPOS ================= */
type Participante = {
  id: string;
  nombreCompleto: string;
};

export default function InscribirsePage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [deseo, setDeseo] = useState("");
  const [inscrito, setInscrito] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  /* ================= LISTA EN TIEMPO REAL ================= */
  useEffect(() => {
    const q = query(
      collection(db, "intercambio_regalos_participantes"),
      orderBy("creadoEn", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: Participante[] = snap.docs.map((d) => ({
          id: d.id,
          nombreCompleto: d.data().nombreCompleto,
        }));
        setParticipantes(data);
      },
      (err) => {
        console.error(err);
      }
    );

    return () => unsub();
  }, []);

  /* ================= GUARDAR ================= */
  const handleSubmit = async () => {
    if (!nombre.trim() || !deseo.trim()) {
      alert("Completa todos los campos.");
      return;
    }

    try {
      setGuardando(true);

      const codigoGenerado = generarCodigo5Digitos();

      await addDoc(collection(db, "intercambio_regalos_participantes"), {
        nombreCompleto: nombre.trim(),
        deseo: deseo.trim(),
        codigo: codigoGenerado, // ✅ se guarda aunque NO se muestre
        creadoEn: Timestamp.now(),
      });

      setInscrito(true);
      setNombre("");
      setDeseo("");
    } catch (err: any) {
      console.error(err);
      alert((err?.code || "error") + " - " + (err?.message || "Error al inscribirse"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push("/intercambio-regalos")}
          className="text-sm text-indigo-400 hover:text-indigo-300 mb-6"
        >
          ← Volver al menú
        </button>

        <h1 className="text-3xl font-bold mb-2">✍️ Inscribirse</h1>
        <p className="text-neutral-400 mb-8">
          Presupuesto máximo por regalo:{" "}
          <span className="text-pink-400 font-semibold">$5</span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO */}
          <section className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm mb-1 text-neutral-300">
                Nombre y apellido
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-pink-500"
                disabled={inscrito}
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-neutral-300">
                ¿Qué te gustaría recibir?
              </label>
              <textarea
                value={deseo}
                onChange={(e) => setDeseo(e.target.value)}
                placeholder="Ej: chocolate, taza, cuaderno, dulces..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-pink-500 min-h-[90px]"
                disabled={inscrito}
              />
            </div>

            {!inscrito ? (
              <button
                onClick={handleSubmit}
                disabled={guardando}
                className="w-full bg-pink-600 hover:bg-pink-700 py-3 rounded-xl font-bold text-lg transition disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Inscribirme"}
              </button>
            ) : (
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-center">
                <p className="text-sm text-neutral-300 mb-1">
                  ✅ Inscripción exitosa
                </p>
                <p className="text-sm text-neutral-400">
                  Ya estás participando. ¡Gracias!
                </p>
              </div>
            )}
          </section>

          {/* LISTA DE INSCRITOS */}
          <aside className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              👥 Inscritos ({participantes.length})
            </h2>

            {participantes.length === 0 ? (
              <p className="text-neutral-500 text-sm">Aún no hay inscritos.</p>
            ) : (
              <ul className="space-y-2">
                {participantes.map((p, i) => (
                  <li
                    key={p.id}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
                  >
                    {i + 1}. {p.nombreCompleto}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
