"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, getDocs, query, where, collection } from "firebase/firestore";

export default function AileenHome() {
  const [calificaciones, setCalificaciones] = useState<Record<number, number | null>>({});
  const router = useRouter();

  const reproducirSonido = () => {
    const audio = new Audio("/sonidos/click-elegante.mp3");
    audio.volume = 0.4;
    audio.play();
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const refUsu = doc(db, "usuarios", user.uid);
      const snap = await getDoc(refUsu);

      if (snap.exists()) {
        const q = query(
          collection(db, "aileen_calificaciones"),
          where("userId", "==", user.uid)
        );
        const res = await getDocs(q);

        const notas: Record<number, number | null> = {};
        res.docs.forEach((d) => {
          const data = d.data();
          const nd = Number(data.day);
          notas[nd] = data.nota ?? null;
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
    <main className="min-h-screen relative overflow-hidden px-4 py-10 
      bg-gradient-to-br from-pink-50 via-rose-100 to-pink-200 text-rose-900">

      {/* ✨ ESTRELLAS DE FONDO */}
      <div className="pointer-events-none absolute inset-0 animate-twinkle bg-[url('/stars.png')] opacity-25"></div>

      {/* 🦋 MARIPOSAS FLOTANDO */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${5 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            🦋
          </div>
        ))}
      </div>

      {/* BOTÓN DE CERRAR SESIÓN */}
      <button
        onClick={handleLogout}
        className="absolute right-4 top-4 px-5 py-2 rounded-full 
        bg-gradient-to-r from-rose-400 to-rose-600 
        hover:from-rose-500 hover:to-rose-700
        text-white font-semibold shadow-xl transition-all"
      >
        Cerrar sesión
      </button>

      <h1 className="text-4xl font-extrabold mb-2 text-rose-700 drop-shadow-sm flex items-center gap-2">
        ✨ Plan Aileen – Tu progreso ✨
      </h1>

      <p className="text-rose-600 mb-8 font-medium text-lg">
        Selecciona un día para ver el contenido.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 relative z-10">
        {Array.from({ length: totalDias }).map((_, i) => {
          const dia = i + 1;
          const nota = calificaciones[dia] ?? null;

          const colorNota =
            nota == null
              ? "text-rose-500"
              : nota >= 9
              ? "text-green-600"
              : nota >= 7
              ? "text-yellow-600"
              : "text-red-600";

          return (
            <Link
              key={i}
              href={`/aileen/${dia}`}
              onClick={reproducirSonido}
              className="relative group p-5 text-center rounded-3xl
                bg-white/60 backdrop-blur-xl border border-rose-300
                shadow-lg shadow-rose-200 hover:shadow-pink-400
                transition-all transform hover:-translate-y-2
                hover:scale-[1.04] overflow-hidden"
            >
              {/* ✨ SHIMMER (BRILLO QUE PASA) */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700 
                bg-gradient-to-r from-transparent via-white/50 to-transparent
                animate-shimmer"></div>

              {/* ⭐ BADGE ESPECIAL PARA NOTA 10 */}
              {nota === 10 && (
                <div className="absolute -top-2 -right-2 text-3xl">
                  👑
                </div>
              )}

              <span className="text-xl font-extrabold text-rose-700 drop-shadow-sm flex items-center justify-center gap-1">
                🌸 Día {dia} 🌸
              </span>

              <p className={`text-sm mt-3 font-semibold ${colorNota}`}>
                {nota != null ? `Nota: ${nota}` : "Sin calificar"}
              </p>

            </Link>
          );
        })}
      </div>

      {/* ANIMACIONES PERSONALIZADAS */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }

        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }

        @keyframes float {
          0% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-25px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0); }
        }

        .animate-float {||
          animation: float infinite ease-in-out;
          font-size: 28px;
          opacity: 0.7;
        }

        @keyframes twinkle {
          0% { opacity: .2; }
          50% { opacity: .4; }
          100% { opacity: .2; }
        }

        .animate-twinkle {
          animation: twinkle 5s infinite;
        }
      `}</style>
    </main>
  );
}
