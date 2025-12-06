"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, getDocs, query, where, collection } from "firebase/firestore";

export default function AileenHome() {
  const [tema, setTema] = useState<"mujer" | "hombre">("hombre");
  const [calificaciones, setCalificaciones] = useState<Record<number, number | null>>({});
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setTema(data.sexo === "mujer" ? "mujer" : "hombre");

        // =======================================================
        // 🔥 CARGAR NOTAS DESDE aileen_calificaciones (colección correcta)
        // =======================================================
        const q = query(
          collection(db, "aileen_calificaciones"), // ← CAMBIO CRÍTICO AQUÍ
          where("userId", "==", user.uid)
        );

        const res = await getDocs(q);

        const notas: Record<number, number | null> = {};

        res.docs.forEach((d) => {
          const data = d.data();

          const dayNumber = Number(data.day);
          if (!isNaN(dayNumber)) {
            notas[dayNumber] = data.nota ?? null;
          }
        });

        setCalificaciones(notas);
      }
    });

    return () => unsub();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const totalDias = 30;

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10 relative">

      {/* BOTÓN DE CERRAR SESIÓN */}
      <button
        onClick={handleLogout}
        className="absolute right-4 top-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
      >
        Cerrar sesión
      </button>

      <h1 className="text-2xl font-bold mb-6">Plan Aileen – Tu progreso</h1>
      <p className="text-neutral-400 mb-6">Selecciona un día para ver el contenido.</p>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
        {Array.from({ length: totalDias }).map((_, i) => {
          const dia = i + 1;
          const nota = calificaciones[dia] ?? null;

          const colorNota =
            nota == null
              ? "text-neutral-500"
              : nota >= 9
              ? "text-green-400"
              : nota >= 7
              ? "text-yellow-400"
              : "text-red-400";

          return (
            <Link
              key={i}
              href={`/aileen/${dia}`}
              className="p-4 text-center rounded-xl bg-neutral-800 border border-neutral-700"
            >
              Día {dia}
              <p className={`text-xs mt-1 font-bold ${colorNota}`}>
                {nota != null ? `Nota: ${nota}` : "Sin calificar"}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
