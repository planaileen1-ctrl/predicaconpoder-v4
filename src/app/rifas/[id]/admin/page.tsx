"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";

/* ================= CONFIG ================= */
const PRECIO_RIFA = 2;

/* ================= TIPOS ================= */
type Numero = {
  estado: "pendiente_pago" | "pagado";
  nombre?: string;
  telefono?: string;
};

/* ================= HELPERS ================= */
function normalizarTelefono(raw: string) {
  let t = (raw || "").replace(/[^\d+]/g, "");
  if (t.startsWith("+")) t = t.slice(1);
  if (t.startsWith("00")) t = t.slice(2);
  if (t.startsWith("0")) t = `593${t.slice(1)}`;
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

  const unsubNumerosRef = useRef<null | (() => void)>(null);

  /* ================= CARGA MANUAL ================= */
  const cargarNumeros = async () => {
    const snap = await getDocs(
      collection(db, "rifas", id as string, "numeros")
    );

    const mapa: Record<string, Numero> = {};
    snap.forEach((d) => {
      mapa[d.id] = d.data() as Numero;
    });

    setNumeros(mapa);
  };

  /* ================= AUTH + REALTIME ================= */
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
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

      const ref = collection(db, "rifas", id as string, "numeros");
      unsubNumerosRef.current = onSnapshot(ref, (snap) => {
        const mapa: Record<string, Numero> = {};
        snap.forEach((d) => {
          mapa[d.id] = d.data() as Numero;
        });
        setNumeros(mapa);
      });

      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubNumerosRef.current) unsubNumerosRef.current();
    };
  }, [id, router]);

  /* ================= CONTADORES ================= */
  const totalVendidas = Object.keys(numeros).length;

  const totalPagadas = useMemo(
    () =>
      Object.values(numeros).filter((n) => n.estado === "pagado").length,
    [numeros]
  );

  const totalPendientes = useMemo(
    () =>
      Object.values(numeros).filter(
        (n) => n.estado === "pendiente_pago"
      ).length,
    [numeros]
  );

  const totalDisponibles = Math.max(
    0,
    (rifa?.totalNumeros || 0) - totalVendidas
  );

  /* ================= DINERO ================= */
  const dineroVendidas = totalVendidas * PRECIO_RIFA;
  const dineroPagadas = totalPagadas * PRECIO_RIFA;
  const dineroPendientes = totalPendientes * PRECIO_RIFA;
  const dineroDisponibles = totalDisponibles * PRECIO_RIFA;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Cargando panel admin…
      </div>
    );
  }

  /* ================= MENSAJES ================= */
  const mensajeRecordatorio = (num: string) =>
    `Hola 👋 te escribo por la *Rifa Solidaria*.\n\n` +
    `Tienes separado el número *${num}* y aún está pendiente el pago.\n\n` +
    `Por favor envíame el comprobante 🙏`;

  const mensajePago = (num: string) =>
    `🎉 *GRACIAS POR TU COMPRA* 🎉\n\n` +
    `🎟️ Rifa: ${rifa.titulo}\n` +
    `🎁 Premio: ${rifa.premio}\n` +
    `🔢 Número elegido: *${num}*\n` +
    `💵 Valor: $${PRECIO_RIFA}\n\n` +
    `📅 *Fecha del sorteo:* 23 de diciembre\n\n` +
    `¡Mucha suerte! 🍀`;

  const mensajeGanador = (num: string) =>
    `🎉 FELICIDADES 🎉\n\n` +
    `Has ganado la rifa:\n\n` +
    `🎟️ ${rifa.titulo}\n` +
    `🎁 Premio: ${rifa.premio}\n` +
    `🔢 Número ganador: ${num}\n\n` +
    `Responde para coordinar la entrega 🙌`;

  /* ================= ACCIONES ================= */
  const marcarPagado = async (num: string) => {
    await updateDoc(doc(db, "rifas", id as string, "numeros", num), {
      estado: "pagado",
    });

    const tel = numeros[num]?.telefono;
    if (tel) {
      abrirWhatsApp(tel, mensajePago(num));
    }
  };

  const liberarNumero = async (num: string) => {
    if (!confirm(`¿Liberar número ${num}?`)) return;
    await deleteDoc(doc(db, "rifas", id as string, "numeros", num));
  };

  const realizarSorteo = async () => {
    const pagados = Object.entries(numeros).filter(
      ([_, info]) => info.estado === "pagado"
    );

    if (pagados.length === 0) {
      alert("No hay números pagados");
      return;
    }

    const [num, info] =
      pagados[Math.floor(Math.random() * pagados.length)];

    await updateDoc(doc(db, "rifas", id as string), {
      estado: "sorteada",
      ganador: {
        numero: num,
        nombre: info.nombre || "",
        telefono: info.telefono || "",
        fecha: Timestamp.now(),
      },
    });

    alert(`🎉 Ganador: ${num}`);

    if (info.telefono) {
      abrirWhatsApp(info.telefono, mensajeGanador(num));
    }
  };

  const resetearRifa = async () => {
    if (!confirm("¿Seguro que deseas RESETEAR la rifa?")) return;

    const snap = await getDocs(
      collection(db, "rifas", id as string, "numeros")
    );

    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }

    await updateDoc(doc(db, "rifas", id as string), {
      estado: "activa",
      ganador: null,
    });

    alert("✅ Rifa reseteada");
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

        {/* ===== RESUMEN DINERO ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Resumen titulo="🎟️ Vendidas" cantidad={totalVendidas} dinero={dineroVendidas} />
          <Resumen titulo="⏳ Pendientes" cantidad={totalPendientes} dinero={dineroPendientes} color="text-amber-400" />
          <Resumen titulo="✅ Pagadas" cantidad={totalPagadas} dinero={dineroPagadas} color="text-emerald-400" />
          <Resumen titulo="📦 Disponibles" cantidad={totalDisponibles} dinero={dineroDisponibles} color="text-sky-400" />
        </div>

        {/* ===== BOTONES ===== */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={realizarSorteo} className="bg-purple-600 px-5 py-3 rounded-xl font-bold">🎉 Realizar sorteo</button>
          <button onClick={resetearRifa} className="bg-red-700 px-5 py-3 rounded-xl font-bold">🧹 Resetear rifa</button>
          <button onClick={cargarNumeros} className="bg-blue-600 px-5 py-3 rounded-xl font-bold">🔄 Refrescar</button>
        </div>

        {/* ===== TABLA ===== */}
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
              {Object.keys(numeros).sort().map((n) => (
                <tr key={n} className="border-t border-neutral-800">
                  <td className="p-3 font-bold">{n}</td>
                  <td className="p-3">{numeros[n].nombre}</td>
                  <td className="p-3">{numeros[n].telefono}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full border text-xs ${badge(numeros[n].estado)}`}>
                      {numeros[n].estado.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {numeros[n].estado === "pendiente_pago" && (
                      <button
                        onClick={() =>
                          abrirWhatsApp(
                            numeros[n].telefono || "",
                            mensajeRecordatorio(n)
                          )
                        }
                        className="px-3 py-1 bg-green-600 rounded text-xs"
                      >
                        WhatsApp
                      </button>
                    )}
                    <button onClick={() => marcarPagado(n)} className="px-3 py-1 bg-emerald-600 rounded text-xs">Pagado</button>
                    <button onClick={() => liberarNumero(n)} className="px-3 py-1 bg-red-600 rounded text-xs">Liberar</button>
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

/* ================= COMPONENTE RESUMEN ================= */
function Resumen({
  titulo,
  cantidad,
  dinero,
  color = "text-white",
}: {
  titulo: string;
  cantidad: number;
  dinero: number;
  color?: string;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="text-sm text-neutral-400">{titulo}</div>
      <div className={`text-2xl font-bold ${color}`}>{cantidad}</div>
      <div className="text-sm text-neutral-400">${dinero}</div>
    </div>
  );
}
