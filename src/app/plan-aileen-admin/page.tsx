"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminPlanAileen() {
  const router = useRouter();
  const totalDias = 30;

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">

      {/* BOTONES SUPERIORES */}
      <div className="flex justify-between mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg hover:bg-neutral-700 transition"
        >
          ← Regresar al Dashboard
        </button>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
        >
          Cerrar sesión
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Administrador – Plan Aileen</h1>
      <p className="text-neutral-400 mb-6">Selecciona un día para administrar:</p>

      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: totalDias }).map((_, i) => (
          <Link
            key={i}
            href={`/plan-aileen-admin/${i + 1}`}
            className="p-4 text-center rounded-xl bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 transition"
          >
            Día {i + 1}
          </Link>
        ))}
      </div>
    </main>
  );
}
