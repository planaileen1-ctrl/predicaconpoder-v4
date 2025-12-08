"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AileenLayout({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<"mujer" | "hombre" | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        setTema(data.sexo === "mujer" ? "mujer" : "hombre");
      } else {
        router.push("/perfil");
      }
    });

    return () => unsub();
  }, [router]);

  if (!tema) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Cargando estilo...
      </main>
    );
  }

  const estilos =
    tema === "mujer"
      ? "from-pink-600 to-rose-500"
      : "from-blue-600 to-indigo-500";

  return (
    <div className={`min-h-screen bg-neutral-950 text-white`}>
      <div className={`w-full h-2 bg-gradient-to-r ${estilos}`} />
      {children}
    </div>
  );
}
