"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import Link from "next/link";

type Section = {
  title: string;
  desc: string;
  icon: string;
  href: string;
  gradient: string;
  adminOnly?: boolean;
};

const sections: Section[] = [
  {
    title: "Inscribirse",
    desc: "Regístrate para participar. Presupuesto máximo: $5.",
    icon: "✍️",
    href: "/intercambio-regalos/inscribirse",
    gradient: "from-pink-500 to-fuchsia-600",
  },
  {
    title: "Ver a quién me tocó",
    desc: "Ingresa tu código secreto (5 dígitos) y mira tu asignación.",
    icon: "🎁",
    href: "/intercambio-regalos/ver",
    gradient: "from-emerald-500 to-lime-600",
  },
  {
    title: "Realizar sorteo",
    desc: "Solo para el administrador (cuando todos estén inscritos).",
    icon: "🎲",
    href: "/intercambio-regalos/sorteo",
    gradient: "from-indigo-500 to-purple-600",
    adminOnly: true,
  },

  // ✅ NUEVA TARJETA (SOLO ADMIN): PARTICIPANTES + BOTÓN WHATSAPP
  {
    title: "Admin Participantes",
    desc: "Ver WhatsApp + deseo + código y enviar mensaje por WhatsApp.",
    icon: "👑",
    href: "/intercambio-regalos/admin-participantes",
    gradient: "from-slate-600 to-zinc-800",
    adminOnly: true,
  },
];

export default function IntercambioRegalosMenuPage() {
  const router = useRouter();
  const adminEmail = useMemo(() => "planaileen@gmail.com", []);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Si no hay login, igual dejamos usar "Inscribirse" y "Ver a quién me tocó"
      // pero las opciones admin solo se muestran si está logueado y es admin.
      if (user?.email === adminEmail) setIsAdmin(true);
      else setIsAdmin(false);

      setLoading(false);
    });

    return () => unsub();
  }, [adminEmail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  const visibles = sections.filter((s) => !s.adminOnly || isAdmin);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-6xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-indigo-400 hover:text-indigo-300 mb-6"
        >
          ← Volver al dashboard
        </button>

        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          🎁 Intercambio de Regalos
        </h1>
        <p className="text-neutral-400 mb-8">
          Menú de opciones. Presupuesto máximo por regalo:{" "}
          <span className="text-pink-400 font-semibold">$5</span>.
        </p>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-lg hover:shadow-pink-500/10 transition transform hover:-translate-y-1"
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

                {s.adminOnly && !isAdmin && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Solo administrador.
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>

        {!isAdmin && (
          <p className="text-xs text-neutral-500 mt-8">
            Nota: Las opciones de administrador solo aparecen cuando inicias sesión con{" "}
            <span className="text-neutral-300 font-semibold">{adminEmail}</span>.
          </p>
        )}
      </div>
    </main>
  );
}
