"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️ NUEVO
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const uid = res.user.uid;

      await setDoc(doc(db, "usuarios", uid), {
        email,
        nombre: "",
        sexo: "",
        createdAt: Timestamp.now(),
      });

      router.push("/perfil");
    } catch (error) {
      console.error(error);
      alert("Error registrando usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-6">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-center">Registrarse</h1>

        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Correo"
            className="w-full p-3 bg-neutral-800 rounded-lg mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* 🔥 INPUT DE CONTRASEÑA CON OJO */}
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              className="w-full p-3 bg-neutral-800 rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            disabled={loading}
            className="w-full py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500 font-semibold"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>
      </div>
    </main>
  );
}
