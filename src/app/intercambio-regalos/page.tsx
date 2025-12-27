"use client";

import { useRouter } from "next/navigation";

type Card = {
  title: string;
  desc: string;
  icon: string;
  href: string;
  gradient: string;
};

const cards: Card[] = [
  {
    title: "Inscribirse",
    desc: "Regístrate para participar. Presupuesto máximo: $5.",
    icon: "✍️",
    href: "/intercambio-regalos/inscribirse",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    title: "Realizar sorteo",
    desc: "Solo para el administrador (cuando todos estén inscritos).",
    icon: "🎲",
    href: "/intercambio-regalos/sorteo",
    gradient: "from-indigo-500 to-violet-600",
  },
  {
    title: "Ver a quién me tocó",
    desc: "Consulta tu asignación (cuando ya exista el sorteo).",
    icon: "🎁",
    href: "/intercambio-regalos/ver",
    gradient: "from-emerald-500 to-lime-600",
  },
];

export default function IntercambioRegalosMenuPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="w-full max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-indigo-400 hover:text-indigo-300 mb-6"
        >
          ← Volver al dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            🎁 Intercambio de Regalos
          </h1>
          <p className="text-neutral-400 mt-2">
            Menú de opciones. Presupuesto máximo por regalo:{" "}
            <span className="text-pink-300 font-semibold">$5</span>.
          </p>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <button
              key={c.title}
              onClick={() => router.push(c.href)}
              className="text-left group rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-lg hover:shadow-pink-500/10 transition transform hover:-translate-y-1"
            >
              <div
                className={`bg-gradient-to-r ${c.gradient} p-4 h-28 flex items-center justify-between`}
              >
                <div>
                  <div className="text-3xl mb-1">{c.icon}</div>
                  <h2 className="text-lg font-semibold">{c.title}</h2>
                </div>
                <div className="opacity-80 text-5xl group-hover:scale-110 transition-transform">
                  ✨
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-neutral-300 mb-3">{c.desc}</p>
                <span className="text-xs font-medium text-indigo-300 group-hover:text-indigo-200">
                  Entrar →
                </span>
              </div>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
