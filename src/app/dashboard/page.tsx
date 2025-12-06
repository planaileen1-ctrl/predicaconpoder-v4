"use client";

import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Section = {
  title: string;
  desc: string;
  icon: string;
  href: string;
  gradient: string;
};

const sections: Section[] = [
  {
    title: "Crear Sermón",
    desc: "Empieza un nuevo mensaje con estructura clara.",
    icon: "📝",
    href: "/crear",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    title: "Mis Sermones",
    desc: "Revisa, edita y organiza tus mensajes.",
    icon: "📚",
    href: "/mis-sermones",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    title: "Ideas Bíblicas",
    desc: "Guarda pensamientos, bosquejos y textos clave.",
    icon: "💡",
    href: "/ideas",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    title: "Archivo",
    desc: "Consulta tus sermones antiguos cuando quieras.",
    icon: "🗂️",
    href: "/archivo",
    gradient: "from-purple-500 to-fuchsia-600",
  },
     {
    title: "Mis Lecturas",
    desc: "Devocionales y estudios bíblicos guardados.",
    icon: "📖",
    href: "/lecturas",
    gradient: "from-yellow-500 to-amber-600",
  },

  // ✅ NUEVA TARJETA: BIBLIA
  {
    title: "Biblia",
    desc: "Lee la Biblia completa por libros y capítulos.",
    icon: "📜",
    href: "/biblia",
    gradient: "from-red-500 to-orange-600",
  },
  {
  title: "Ventas de Comida",
  desc: "Registra clientes, ventas y calcula ganancias.",
  icon: "🍽️",
  href: "/ventas-comida",
  gradient: "from-teal-500 to-cyan-600",
},
{
  title: "Ingresos y Gastos",
  desc: "Control financiero: registra entradas y salidas.",
  icon: "💰",
  href: "/ingresos-gastos",
  gradient: "from-emerald-500 to-lime-600",
},
   {
    title: "Ajustes",
    desc: "Configura tu cuenta y preferencias.",
    icon: "⚙️",
    href: "/ajustes",
    gradient: "from-slate-600 to-slate-800",
  },
  {
    title: "Plan Aileen",
    desc: "El plan de 30 días para tu hija",
    icon: "🌸",
    href: "/plan-aileen-admin",
    gradient: "from-pink-500 to-rose-600",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const adminEmail = "planaileen@gmail.com";

      if (user.email !== adminEmail) {
        router.push("/aileen");
        return;
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    router.push("/login");
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        Verificando acceso...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-6xl">

        <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-400">Bienvenido a</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Predica <span className="text-indigo-400">Con Poder</span>
            </h1>
            <p className="text-neutral-400 mt-2 max-w-xl text-sm sm:text-base">
              Crea, organiza y guarda tus sermones, ideas y devocionales desde cualquier dispositivo — optimizado para iPad.
            </p>
          </div>

          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            Cerrar sesión
          </button>
        </header>

        {/* Tarjetas */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-lg hover:shadow-indigo-500/20 transition transform hover:-translate-y-1"
            >
              <div
                className={`bg-gradient-to-r ${s.gradient} p-4 h-28 flex items-center justify-between`}
              >
                <div>
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <h2 className="text-lg font-semibold">{s.title}</h2>
                </div>
                <div className="opacity-80 text-5xl group-hover:scale-110 transition-transform">
                  ✨
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-neutral-300 mb-3">{s.desc}</p>
                <span className="text-xs font-medium text-indigo-300 group-hover:text-indigo-200">
                  Entrar →
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
