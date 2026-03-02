"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import app from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const auth = getAuth(app);
const db = getFirestore(app);
import {
  collection,
  getDocs,
  doc,
  getDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";

type Participante = {
  id: string;
  nombreCompleto: string;
  deseo: string;
  codigo: string;
};

function normalizeName(v: string) {
  return (v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function matchAlias(nombre: string, aliases: string[]) {
  const n = normalizeName(nombre);
  return aliases.some((a) => n === normalizeName(a));
}

/**
 * RESTRICCIONES:
 * - Nadie le regala a YUDITH (Yudith NO puede ser "para")
 * - RAUL LEON no regala a nadie (Raúl NO puede ser "de")
 * - Yudith sí regala a alguien
 * - Raúl sí recibe de alguien
 */
function generarAsignacionesConRestricciones(participantes: Participante[]) {
  const RAUL_ALIASES = ["raul leon"];
  const YUDITH_ALIASES = ["yudith"];

  const raulIdx = participantes.findIndex((p) => matchAlias(p.nombreCompleto, RAUL_ALIASES));
  const yudithIdx = participantes.findIndex((p) => matchAlias(p.nombreCompleto, YUDITH_ALIASES));

  // Si no están, sorteo normal (nadie a sí mismo)
  if (raulIdx < 0 || yudithIdx < 0) {
    const givers = participantes;
    const MAX = 4000;
    for (let t = 0; t < MAX; t++) {
      const recipients = shuffle(participantes);
      const ok = recipients.every((r, i) => r.id !== givers[i].id);
      if (ok) return { modo: "normal", givers, recipients, raul: null };
    }
    throw new Error("No se pudo generar sorteo normal.");
  }

  const raul = participantes[raulIdx];
  const yudith = participantes[yudithIdx];

  // GIVERS: todos menos Raúl (Raúl no regala)
  const givers = participantes.filter((p) => p.id !== raul.id);

  // RECIPIENTS: todos menos Yudith (nadie le regala a Yudith)
  const recipientsPool = participantes.filter((p) => p.id !== yudith.id);

  if (givers.length !== recipientsPool.length) {
    throw new Error("Reglas incompatibles: tamaños no coinciden.");
  }

  const MAX_TRIES = 9000;
  for (let t = 0; t < MAX_TRIES; t++) {
    const recipients = shuffle(recipientsPool);

    // Evitar auto-asignación para quienes están en ambos lados
    let ok = true;
    for (let i = 0; i < givers.length; i++) {
      if (givers[i].id === recipients[i].id) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    // Raúl está dentro del recipientsPool, entonces alguien lo recibirá sí o sí.
    // Yudith NO está, así que nadie le regalará.
    return { modo: "restricciones", givers, recipients, raul };
  }

  throw new Error("No se pudo generar sorteo con restricciones.");
}

export default function SorteoAdminPage() {
  const router = useRouter();
  const adminEmail = useMemo(() => "planaileen@gmail.com", []);

  const [loading, setLoading] = useState(true);
  const [userOk, setUserOk] = useState(false);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [sorteoHecho, setSorteoHecho] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.push("/login");
          return;
        }
        if (user.email !== adminEmail) {
          router.push("/intercambio-regalos");
          return;
        }
        setUserOk(true);

        const estadoRef = doc(db, "intercambio_regalos_estado", "sorteo");
        const estadoSnap = await getDoc(estadoRef);
        if (estadoSnap.exists() && estadoSnap.data()?.locked === true) {
          setSorteoHecho(true);
        }

        const snap = await getDocs(collection(db, "intercambio_regalos_participantes"));
        const data: Participante[] = snap.docs.map((d) => ({
          id: d.id,
          nombreCompleto: d.data().nombreCompleto || "",
          deseo: d.data().deseo || "",
          codigo: d.data().codigo || "",
        }));

        const limpios = data.filter(
          (p) => p.nombreCompleto && p.deseo && p.codigo && String(p.codigo).length === 5
        );

        setParticipantes(limpios);
      } catch (e) {
        console.error(e);
        alert("Error cargando admin sorteo.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router, adminEmail]);

  const realizarSorteo = async () => {
    if (sorteoHecho) return alert("El sorteo ya fue realizado.");
    if (participantes.length < 2) return alert("Se necesitan al menos 2 participantes.");
    if (!confirm("¿Confirmas realizar el sorteo? Se guardará y no se debe repetir.")) return;

    setProcesando(true);
    try {
      const res = generarAsignacionesConRestricciones(participantes);
      const { givers, recipients, raul, modo } = res;

      const batch = writeBatch(db);

      // Guardar asignación por código del que REGALA (givers)
      for (let i = 0; i < givers.length; i++) {
        const de = givers[i];
        const para = recipients[i];

        const asignRef = doc(db, "intercambio_regalos_asignaciones", String(de.codigo));
        batch.set(asignRef, {
          deCodigo: String(de.codigo),
          deNombre: de.nombreCompleto,
          paraNombre: para.nombreCompleto,
          // ✅ guardamos deseo pero NO se muestra en la UI
          paraDeseo: para.deseo,
          presupuesto: 5,
          creadoEn: Timestamp.now(),
          modo,
        });
      }

      // Crear doc para Raúl indicando que NO regala
      if (raul) {
        const raulRef = doc(db, "intercambio_regalos_asignaciones", String(raul.codigo));
        batch.set(raulRef, {
          deCodigo: String(raul.codigo),
          deNombre: raul.nombreCompleto,
          noRegala: true,
          presupuesto: 5,
          creadoEn: Timestamp.now(),
          modo,
        });
      }

      const estadoRef = doc(db, "intercambio_regalos_estado", "sorteo");
      batch.set(estadoRef, {
        locked: true,
        creadoEn: Timestamp.now(),
        totalParticipantes: participantes.length,
        totalRegalan: givers.length,
        presupuesto: 5,
        modo,
        restricciones: {
          nadieLeRegalaA: "Yudith",
          raulNoRegala: true,
        },
      });

      await batch.commit();

      setSorteoHecho(true);
      alert("🎉 Sorteo realizado y guardado.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error realizando el sorteo.");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Cargando...
      </div>
    );
  }
  if (!userOk) return null;

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/intercambio-regalos")}
          className="text-sm text-indigo-400 hover:text-indigo-300 mb-6"
        >
          ← Volver al menú
        </button>

        <h1 className="text-3xl font-bold mb-2">🎲 Realizar sorteo (Admin)</h1>
        <p className="text-neutral-400 mb-6">
          Solo admin: <span className="text-pink-300 font-semibold">{adminEmail}</span>
        </p>

        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
          <p className="text-sm text-neutral-300">
            Participantes válidos: <span className="font-semibold">{participantes.length}</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">Presupuesto: $5</p>

          <div className="mt-4 bg-neutral-800 border border-neutral-700 rounded-xl p-3">
            <p className="text-xs text-neutral-300">Restricciones activas:</p>
            <ul className="text-xs text-neutral-400 list-disc pl-5 mt-1 space-y-1">
              <li>Nadie le regala a <b>Yudith</b>.</li>
              <li><b>RAUL LEON</b> no regala a nadie.</li>
              <li>Yudith sí regala; Raúl sí recibe.</li>
            </ul>
          </div>
        </section>

        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          {sorteoHecho ? (
            <p className="text-green-400 font-semibold">✅ Sorteo ya realizado y bloqueado.</p>
          ) : (
            <button
              onClick={realizarSorteo}
              disabled={procesando}
              className="w-full bg-pink-600 hover:bg-pink-700 py-3 rounded-xl font-bold text-lg disabled:opacity-50"
            >
              {procesando ? "Procesando..." : "Realizar sorteo"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
