"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️ NUEVO
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (e: any) {
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center text-white px-4">
      <div className="w-full max-w-sm bg-neutral-900 p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Iniciar Sesión</h1>

        {error && <p className="text-red-400 mb-3">{error}</p>}

        <input
          type="email"
          placeholder="Correo"
          className="w-full mb-3 px-3 py-2 bg-neutral-800 rounded-lg"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* 🔥 INPUT DE CONTRASEÑA CON OJO */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            className="w-full px-3 py-2 bg-neutral-800 rounded-lg"
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* BOTÓN DE OJO */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500"
        >
          Entrar
        </button>

        <p className="mt-4 text-sm text-neutral-400">
          ¿No tienes cuenta?
          <Link href="/register" className="text-indigo-400 ml-1">
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}
