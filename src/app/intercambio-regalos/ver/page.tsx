"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function soloDigitos5(v: string) {
  return (v || "").replace(/\D/g, "").slice(0, 5);
}

export default function VerAsignacionPage() {
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<null | {
    paraNombre?: string;
    paraDeseo?: string;
    presupuesto: number;
    noRegala?: boolean;
  }>(null);

  const buscar = async () => {
    const code = soloDigitos5(codigo);

    if (code.length !== 5) {
      alert("Ingresa un código válido de 5 dígitos.");
      return;
    }

    setCargando(true);
    setResultado(null);

    try {
      const ref = doc(db, "intercambio_regalos_asignaciones", code);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("Aún no hay resultado. Puede que el sorteo no se haya realizado.");
        return;
      }

      const data: any = snap.data();

      // ✅ Caso especial: este código NO regala a nadie (RAUL LEON)
      if (data?.noRegala === true) {
        setResultado({
          presupuesto: data?.presupuesto || 5,
          noRegala: true,
        });
        return;
      }

      setResultado({
        paraNombre: data?.paraNombre || "",
        paraDeseo: data?.paraDeseo || "",
        presupuesto: data?.presupuesto || 5,
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
          Ingresa tu <b>código secreto</b> de 5 dígitos. No necesitas login.
        </p>

        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm mb-1 text-neutral-300">Código (5 dígitos)</label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(soloDigitos5(e.target.value))}
              placeholder="Ej: 48392"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-pink-500 tracking-widest"
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

              {resultado.noRegala ? (
                <p className="text-lg font-bold text-amber-300">
                  Tú no debes regalar a nadie.
                </p>
              ) : (
                <>
                  <p className="text-lg font-bold">
                    Te toca regalarle a:{" "}
                    <span className="text-emerald-300">{resultado.paraNombre}</span>
                  </p>

                  <p className="text-sm text-neutral-300 mt-3">
                    Le gustaría recibir:{" "}
                    <span className="text-white font-semibold">
                      {resultado.paraDeseo || "—"}
                    </span>
                  </p>
                </>
              )}

              <p className="text-xs text-neutral-500 mt-3">
                No compartas tu código. Ese código es tu “llave”.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
