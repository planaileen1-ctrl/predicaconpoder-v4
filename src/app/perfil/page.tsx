"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [sexo, setSexo] = useState<"hombre" | "mujer" | null>(null);

  // 🔍 Verificar estado del usuario
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Si es ADMIN → lo mandamos al dashboard
      if (user.email === "planaileen@gmail.com") {
        router.push("/dashboard");
        return;
      }

      // Revisar si tiene documento existente en Firestore
      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        // Si YA TIENE nombre y sexo → directo al calendario
        if (data.nombre && data.sexo) {
          router.push("/aileen");
          return;
        }
      }

      setLoading(false); // Mostrar formulario
    });

    return () => unsub();
  }, [router]);

  const guardarPerfil = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!nombre.trim()) {
      alert("Por favor escribe tu nombre.");
      return;
    }

    if (!sexo) {
      alert("Selecciona si eres hombre o mujer.");
      return;
    }

    // Guardar en Firestore
    await setDoc(doc(db, "usuarios", user.uid), {
      nombre,
      sexo,
      email: user.email,
      createdAt: Timestamp.now(),
    });

    router.push("/aileen");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        Verificando información...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex justify-center items-center px-4">
      <div className="bg-neutral-900 p-7 rounded-2xl w-full max-w-md border border-neutral-800 shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Completa tu Perfil
        </h1>

        {/* Nombre */}
        <div className="mb-6">
          <label className="text-sm mb-1 block">Nombre completo</label>
          <input
            type="text"
            placeholder="Ej: Aileen"
            className="w-full bg-neutral-800 p-3 rounded-xl border border-neutral-700 text-white"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        {/* Sexo */}
        <div className="mb-6">
          <label className="text-sm mb-2 block">Sexo</label>

          <div className="flex gap-4">
            <button
              onClick={() => setSexo("hombre")}
              className={`flex-1 py-3 rounded-xl text-center font-semibold border ${
                sexo === "hombre"
                  ? "bg-blue-600 border-blue-400"
                  : "bg-neutral-800 border-neutral-700"
              }`}
            >
              Hombre
            </button>

            <button
              onClick={() => setSexo("mujer")}
              className={`flex-1 py-3 rounded-xl text-center font-semibold border ${
                sexo === "mujer"
                  ? "bg-pink-600 border-pink-400"
                  : "bg-neutral-800 border-neutral-700"
              }`}
            >
              Mujer
            </button>
          </div>
        </div>

        {/* Guardar */}
        <button
          onClick={guardarPerfil}
          className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold transition"
        >
          Guardar y continuar →
        </button>
      </div>
    </main>
  );
}
