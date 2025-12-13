"use client";

import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

type Rifa = {
  id: string;
  titulo: string;
  premio: string;
  precioNumero: number;
  totalNumeros: number;
  estado: "activa" | "cerrada" | "sorteada";
  vendidos?: number;
  createdAt?: Timestamp;
  fechaSorteo?: string;
};

export default function RifasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cargandoRifas, setCargandoRifas] = useState(true);
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const cargarRifas = useCallback(async (userUid: string) => {
    setCargandoRifas(true);
    try {
      const q = query(
        collection(db, "rifas"),
        where("creadorUid", "==", userUid)
      );

      const snap = await getDocs(q);

      const lista: Rifa[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          titulo: data.titulo ?? "Rifa sin título",
          premio: data.premio ?? "",
          precioNumero: Number(data.precioNumero ?? 0),
          totalNumeros: Number(data.totalNumeros ?? 0),
          estado: (data.estado ?? "activa") as Rifa["estado"],
          vendidos: Number(data.vendidos ?? 0),
          createdAt: data.createdAt,
          fechaSorteo: data.fechaSorteo ?? "",
        };
      });

      setRifas(lista);
    } catch (e) {
      console.error("Error cargando rifas:", e);
    } finally {
      setCargandoRifas(false);
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    cargarRifas(uid);
  }, [uid, cargarRifas]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    router.push("/login");
  }, [router]);

  const badge = (estado: Rifa["estado"]) => {
    if (estado === "activa")
      return "bg-emerald-600/20 text-emerald-300 border-emerald-600/40";
    if (estado === "cerrada")
      return "bg-amber-600/20 text-amber-200 border-amber-600/40";
    return "bg-sky-600/20 text-sky-200 border-sky-600/40";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Verificando acceso...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10 flex justify-center">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-indigo-400 text-sm hover:underline"
            >
              ← Volver al Dashboard
            </button>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
              Rifas <span className="text-pink-400">PRO</span>
            </h1>
            <p className="text-neutral-400 mt-2 max-w-2xl text-sm sm:text-base">
              Crea rifas, vende números, valida pagos y realiza sorteos con
              transparencia.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/rifas/nueva")}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              + Nueva Rifa
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Contenido */}
        {cargandoRifas ? (
          <div className="text-neutral-300">Cargando rifas…</div>
        ) : rifas.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-2">Aún no tienes rifas</h2>
            <p className="text-neutral-400 mb-6">
              Crea tu primera rifa y empieza a vender números desde un enlace
              público.
            </p>
            <button
              onClick={() => router.push("/rifas/nueva")}
              className="bg-pink-600 hover:bg-pink-700 px-5 py-3 rounded-xl font-semibold"
            >
              Crear mi primera rifa
            </button>
          </div>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rifas.map((r) => (
              <Link
                key={r.id}
                href={`/rifas/${r.id}`}
                className="group rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-lg hover:shadow-pink-500/15 transition transform hover:-translate-y-1"
              >
                <div className="bg-gradient-to-r from-fuchsia-500 to-pink-600 p-4 h-28 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-3xl mb-1">🎟️</div>
                    <h2 className="text-lg font-semibold truncate">
                      {r.titulo}
                    </h2>
                  </div>
                  <div className="opacity-80 text-5xl group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${badge(
                        r.estado
                      )}`}
                    >
                      {r.estado.toUpperCase()}
                    </span>

                    <span className="text-xs text-neutral-400">
                      {r.fechaSorteo ? `Sorteo: ${r.fechaSorteo}` : "Sin fecha"}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-300 line-clamp-2">
                    🎁 {r.premio || "Premio sin descripción"}
                  </p>

                  <div className="flex items-center justify-between text-sm text-neutral-300">
                    <span>💵 ${r.precioNumero || 0}</span>
                    <span>🔢 {r.totalNumeros || 0} núm.</span>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs font-medium text-indigo-300 group-hover:text-indigo-200">
                      Administrar →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
