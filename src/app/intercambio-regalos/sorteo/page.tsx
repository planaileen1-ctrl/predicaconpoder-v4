"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";

type Participante = {
  id: string;
  nombreCompleto: string;
  deseo: string;
  codigo: string; // 5 dígitos
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Derangement simple:
 * - shuffle recipients
 * - si alguien queda asignado a sí mismo, intercambia con el siguiente
 * (funciona bien para n>=2)
 */
function derangement(givers: Participante[]) {
  const n = givers.length;
  let recipients = shuffle(givers);

  if (n <= 1) return recipients;

  for (let i = 0; i < n; i++) {
    if (recipients[i].id === givers[i].id) {
      const j = (i + 1) % n;
      [recipients[i], recipients[j]] = [recipients[j], recipients[i]];
    }
  }

  // Verificación final (por seguridad)
  // Si aún hay auto-asignación (muy raro), rehacer una vez.
  if (recipients.some((r, i) => r.id === givers[i].id)) {
    recipients = shuffle(givers);
    for (let i = 0; i < n; i++) {
      if (recipients[i].id === givers[i].id) {
        const j = (i + 1) % n;
        [recipients[i], recipients[j]] = [recipients[j], recipients[i]];
      }
    }
  }

  return recipients;
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

        // Estado sorteo
        const estadoRef = doc(db, "intercambio_regalos_estado", "sorteo");
        const estadoSnap = await getDoc(estadoRef);
        if (estadoSnap.exists() && estadoSnap.data()?.locked === true) {
          setSorteoHecho(true);
        }

        // Participantes
        const snap = await getDocs(collection(db, "intercambio_regalos_participantes"));
        const data: Participante[] = snap.docs.map((d) => ({
          id: d.id,
          nombreCompleto: d.data().nombreCompleto || "",
          deseo: d.data().deseo || "",
          codigo: d.data().codigo || "",
        }));

        // filtrar inválidos (por seguridad)
        const limpios = data.filter(
          (p) => p.nombreCompleto && p.deseo && p.codigo && p.codigo.length === 5
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
    if (sorteoHecho) {
      alert("El sorteo ya fue realizado.");
      return;
    }

    if (participantes.length < 2) {
      alert("Se necesitan al menos 2 participantes.");
      return;
    }

    if (!confirm("¿Confirmas realizar el sorteo? Se guardará y no se debe repetir.")) {
      return;
    }

    setProcesando(true);
    try {
      const givers = participantes;
      const recipients = derangement(givers);

      const batch = writeBatch(db);

      // Guardar asignación por CÓDIGO (documento id = codigo del que regala)
      for (let i = 0; i < givers.length; i++) {
        const de = givers[i];
        const para = recipients[i];

        const asignRef = doc(db, "intercambio_regalos_asignaciones", de.codigo);

        batch.set(asignRef, {
          deCodigo: de.codigo,
          deNombre: de.nombreCompleto,
          paraNombre: para.nombreCompleto,
          paraDeseo: para.deseo,
          presupuesto: 5,
          creadoEn: Timestamp.now(),
        });
      }

      // Bloquear sorteo (estado)
      const estadoRef = doc(db, "intercambio_regalos_estado", "sorteo");
      batch.set(estadoRef, {
        locked: true,
        creadoEn: Timestamp.now(),
        total: givers.length,
        presupuesto: 5,
      });

      await batch.commit();

      setSorteoHecho(true);
      alert("🎉 Sorteo realizado y guardado.");
    } catch (e) {
      console.error(e);
      alert("Error realizando el sorteo.");
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
          <p className="text-xs text-neutral-500 mt-1">
            Presupuesto por regalo: $5
          </p>
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
