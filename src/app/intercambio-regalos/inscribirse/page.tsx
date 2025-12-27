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

type Publico = { id: string; nombreCompleto: string };

export default function InscribirsePage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [deseo, setDeseo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [codigoMostrado, setCodigoMostrado] = useState<string | null>(null);

  const [publicos, setPublicos] = useState<Publico[]>([]);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  // ✅ Lista pública SOLO nombres
  useEffect(() => {
    setErrorLista(null);

    const q = query(
      collection(db, "intercambio_regalos_public"),
      orderBy("creadoEn", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          nombreCompleto: d.data().nombreCompleto,
        }));
        setPublicos(data);
      },
      (err: any) => {
        console.error("onSnapshot error:", err);
        setErrorLista((err?.code || "error") + " - " + (err?.message || "No se pudo leer la lista"));
      }
    );

    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    setErrorGuardar(null);

    if (!nombre.trim() || !deseo.trim()) {
      setErrorGuardar("Completa todos los campos.");
      return;
    }

    setGuardando(true);
    try {
      const codigo = generarCodigo5Digitos();

      // 1) Público: SOLO nombre (para lista)
      await addDoc(collection(db, "intercambio_regalos_public"), {
        nombreCompleto: nombre.trim(),
        creadoEn: Timestamp.now(),
      });

      // 2) Privado: nombre + deseo + código (solo admin podrá leer)
      await addDoc(collection(db, "intercambio_regalos_participantes"), {
        nombreCompleto: nombre.trim(),
        deseo: deseo.trim(),
        codigo,
        creadoEn: Timestamp.now(),
      });

      setCodigoMostrado(codigo);
      setNombre("");
      setDeseo("");
    } catch (err: any) {
      console.error("addDoc error:", err);
      setErrorGuardar((err?.code || "error") + " - " + (err?.message || "Error al inscribirse"));
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
            {codigoMostrado ? (
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 text-center">
                <p className="text-sm text-neutral-300 mb-2">✅ Inscripción exitosa</p>
                <p className="text-xs text-neutral-400 mb-2">
                  Este es tu <b>código secreto</b>. Guárdalo.
                </p>
                <p className="text-3xl font-bold tracking-widest text-pink-400">
                  {codigoMostrado}
                </p>
                <p className="text-xs text-neutral-500 mt-3">
                  Con este código podrás ver a quién te toca regalar. No lo compartas.
                </p>

                <button
                  onClick={() => setCodigoMostrado(null)}
                  className="mt-4 text-sm text-indigo-300 hover:text-indigo-200"
                >
                  Inscribir a otra persona →
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm mb-1 text-neutral-300">
                    Nombre y apellido
                  </label>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-neutral-300">
                    ¿Qué te gustaría recibir?
                  </label>
                  <textarea
                    value={deseo}
                    onChange={(e) => setDeseo(e.target.value)}
                    placeholder="Ej: chocolate, taza, cuaderno..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-pink-500 min-h-[90px]"
                  />
                </div>

                {errorGuardar && (
                  <div className="bg-red-950/40 border border-red-900 rounded-xl p-3 text-sm text-red-200">
                    {errorGuardar}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={guardando}
                  className="w-full bg-pink-600 hover:bg-pink-700 py-3 rounded-xl font-bold text-lg transition disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Inscribirme"}
                </button>
              </>
            )}
          </section>

          {/* LISTA PÚBLICA */}
          <aside className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-2">
              👥 Inscritos ({publicos.length})
            </h2>

            {errorLista && (
              <div className="bg-amber-950/40 border border-amber-900 rounded-xl p-3 text-xs text-amber-200 mb-4">
                {errorLista}
              </div>
            )}

            {publicos.length === 0 ? (
              <p className="text-neutral-500 text-sm">Aún no hay inscritos.</p>
            ) : (
              <ul className="space-y-2 mt-4">
                {publicos.map((p, i) => (
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
