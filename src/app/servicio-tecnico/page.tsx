"use client";

import { useRouter } from "next/navigation";

export default function ServicioTecnicoPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-8 py-10">
      <h1 className="text-3xl font-bold mb-10 flex items-center gap-2">
        🖥️ Servicio Técnico
      </h1>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl">

        {/* REGISTRAR */}
        <div
          onClick={() => router.push("/servicio-tecnico/registrar")}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold mb-2">➕ Registrar dispositivo</h2>
          <p className="text-sm opacity-90">
            Ingresar computadora o laptop
          </p>
        </div>

        {/* BUSCAR */}
        <div
          onClick={() => router.push("/servicio-tecnico/buscar")}
          className="cursor-pointer bg-green-600 hover:bg-green-700 transition rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold mb-2">🔍 Buscar dispositivo</h2>
          <p className="text-sm opacity-90">
            Buscar por código único
          </p>
        </div>

        {/* 🔴 CIERRE DE SERVICIO (NUEVA TARJETA) */}
        <div
          onClick={() => router.push("/servicio-tecnico/cierre")}
          className="cursor-pointer bg-orange-600 hover:bg-orange-700 transition rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold mb-2">✅ Cierre de servicio</h2>
          <p className="text-sm opacity-90">
            Finalizar trabajos y notificar al cliente
          </p>
        </div>

      </div>
    </main>
  );
}
