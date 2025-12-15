"use client";

import Link from "next/link";

const opciones = [
  {
    title: "Ingreso de equipo",
    desc: "Registrar un nuevo equipo para reparación",
    icon: "➕",
    href: "/servicio-tecnico/nuevo",
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    title: "Buscar servicio",
    desc: "Consultar, editar y dar seguimiento",
    icon: "🔍",
    href: "/servicio-tecnico",
    gradient: "from-emerald-600 to-teal-700",
  },
  {
    title: "Cierre",
    desc: "Servicios entregados y finalizados",
    icon: "✅",
    href: "/servicio-tecnico/cierre",
    gradient: "from-rose-600 to-red-700",
  },
];

export default function ServicioTecnicoMenu() {
  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Servicio Técnico</h1>
          <p className="text-sm opacity-80">
            Selecciona una opción para continuar
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {opciones.map((o) => (
            <Link
              key={o.title}
              href={o.href}
              className={`relative rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br ${o.gradient}
                hover:scale-[1.02] transition-transform`}
            >
              <div className="text-4xl mb-3">{o.icon}</div>
              <h2 className="text-xl font-semibold">{o.title}</h2>
              <p className="text-sm opacity-90">{o.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
