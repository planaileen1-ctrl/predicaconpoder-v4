"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";

/* ================= TIPOS ================= */
type Numero = {
  estado: "reservado" | "pagado";
  nombre?: string;
  telefono?: string;
};

/* ================= HELPERS ================= */
function normalizarTelefono(raw: string) {
  let t = (raw || "").replace(/[^\d+]/g, "");
  if (t.startsWith("+")) t = t.slice(1);
  if (t.startsWith("00")) t = t.slice(2);
  if (t.startsWith("0")) t = `593${t.slice(1)}`; // Ecuador
  return t;
}

function abrirWhatsApp(telefono: string, mensaje: string) {
  const tel = normalizarTelefono(telefono);
  const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/* ================= COMPONENTE ================= */
export default function AdminRifaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rifa, setRifa] = useState<any>(null);
  const [numeros, setNumeros] = useState<Record<string, Numero>>({});

  /* ===== AUTH + CARGA ===== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const rifaSnap = await getDoc(doc(db, "rifas", id as string));
      if (!rifaSnap.exists()) {
        alert("Rifa no encontrada");
        router.push("/rifas");
        return;
      }

      const data = rifaSnap.data();
      if (data.creadorUid !== user.uid) {
        alert("Acceso denegado");
        router.push(`/rifas/${id}`);
        return;
      }

      setRifa(data);

      const numsSnap = await getDocs(
        collection(db, "rifas", id as string, "numeros")
      );

      const mapa: Record<string, Numero> = {};
      numsSnap.forEach((d) => {
        mapa[d.id] = d.data() as Numero;
      });

      setNumeros(mapa);
      setLoading(false);
    });

    return () => unsub();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Cargando panel admin…
      </div>
    );
  }

  /* ================= MENSAJES ================= */
  const mensajePago = (num: string) => {
    const fecha = rifa?.fechaSorteo || "Por confirmar";
    return `✅ PAGO CONFIRMADO

🎟️ Rifa: ${rifa.titulo}
🎁 Premio: ${rifa.premio}
🔢 Número: ${num}
📅 Sorteo: ${fecha}

Gracias por participar 🙌`;
  };

  const mensajeGanador = (num: string) => {
    return `🎉 FELICIDADES 🎉

Has ganado la rifa:

🎟️ ${rifa.titulo}
🎁 Premio: ${rifa.premio}
🔢 Número ganador: ${num}

Por favor responde para coordinar la entrega 🙌`;
  };

  /* ================= ACCIONES ================= */
  const marcarPagado = async (num: string) => {
    await updateDoc(doc(db, "rifas", id as string, "numeros", num), {
      estado: "pagado",
    });

    setNumeros((p) => ({
      ...p,
      [num]: { ...p[num], estado: "pagado" },
    }));

    if (numeros[num]?.telefono) {
      abrirWhatsApp(numeros[num].telefono!, mensajePago(num));
    }
  };

  const liberarNumero = async (num: string) => {
    if (!confirm(`¿Liberar número ${num}?`)) return;

    await deleteDoc(doc(db, "rifas", id as string, "numeros", num));

    setNumeros((p) => {
      const c = { ...p };
      delete c[num];
      return c;
    });
  };

  /* ================= SORTEO ================= */
  const realizarSorteo = async () => {
    if (rifa.estado === "sorteada") {
      alert("La rifa ya fue sorteada");
      return;
    }

    const pagados = Object.entries(numeros).filter(
      ([_, info]) => info.estado === "pagado"
    );

    if (pagados.length === 0) {
      alert("No hay números pagados");
      return;
    }

    const idx = Math.floor(Math.random() * pagados.length);
    const [num, info] = pagados[idx];

    await updateDoc(doc(db, "rifas", id as string), {
      estado: "sorteada",
      ganador: {
        numero: num,
        nombre: info.nombre || "",
        telefono: info.telefono || "",
        fecha: Timestamp.now(),
      },
    });

    setRifa((p: any) => ({
      ...p,
      estado: "sorteada",
      ganador: { numero: num, nombre: info.nombre, telefono: info.telefono },
    }));

    alert(`🎉 Ganador: ${num}`);

    if (info.telefono) {
      abrirWhatsApp(info.telefono, mensajeGanador(num));
    }
  };

  /* ================= RESET ================= */
  const resetearRifa = async () => {
    if (!confirm("⚠️ ¿Seguro que deseas RESETEAR la rifa?")) return;
    const ok = prompt("Escribe RESETEAR para confirmar");
    if (ok !== "RESETEAR") return;

    const numsSnap = await getDocs(
      collection(db, "rifas", id as string, "numeros")
    );

    for (const d of numsSnap.docs) {
      await deleteDoc(d.ref);
    }

    await updateDoc(doc(db, "rifas", id as string), {
      estado: "activa",
      ganador: null,
    });

    setNumeros({});
    setRifa((p: any) => ({ ...p, estado: "activa", ganador: null }));

    alert("✅ Rifa reseteada correctamente");
  };

  const badge = (estado: string) =>
    estado === "pagado"
      ? "bg-emerald-600/20 text-emerald-300 border-emerald-600/40"
      : "bg-amber-600/20 text-amber-300 border-amber-600/40";

  /* ================= UI ================= */
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push(`/rifas/${id}`)}
          className="text-indigo-400 text-sm hover:underline"
        >
          ← Volver a la rifa
        </button>

        <h1 className="text-3xl font-bold mt-2">
          Panel Admin — <span className="text-pink-400">{rifa.titulo}</span>
        </h1>

        <div className="flex flex-wrap gap-3 mt-4">
          {rifa.estado !== "sorteada" && (
            <button
              onClick={realizarSorteo}
              className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-bold"
            >
              🎉 Realizar sorteo
            </button>
          )}

          <button
            onClick={resetearRifa}
            className="bg-red-700 hover:bg-red-800 px-5 py-3 rounded-xl font-bold"
          >
            🧹 Resetear rifa
          </button>
        </div>

        {rifa.estado === "sorteada" && rifa.ganador && (
          <div className="mt-6 p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <h2 className="font-bold text-lg">🏆 Ganador</h2>
            <p className="mt-1">
              Número <b>{rifa.ganador.numero}</b> — {rifa.ganador.nombre}
            </p>
          </div>
        )}

        <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800">
              <tr>
                <th className="p-3 text-left">Número</th>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Teléfono</th>
                <th className="p-3 text-left">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(numeros)
                .sort()
                .map((n) => (
                  <tr key={n} className="border-t border-neutral-800">
                    <td className="p-3 font-bold">{n}</td>
                    <td className="p-3">{numeros[n].nombre}</td>
                    <td className="p-3">{numeros[n].telefono}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full border text-xs ${badge(
                          numeros[n].estado
                        )}`}
                      >
                        {numeros[n].estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => marcarPagado(n)}
                        className="px-3 py-1 bg-emerald-600 rounded text-xs"
                      >
                        Pagado
                      </button>
                      <button
                        onClick={() => liberarNumero(n)}
                        className="px-3 py-1 bg-red-600 rounded text-xs"
                      >
                        Liberar
                      </button>
                    </td>
                  </tr>
                ))}
              {Object.keys(numeros).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-400">
                    No hay números aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
