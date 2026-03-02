"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import app from "@/lib/firebase";
import { getAuth } from "firebase/auth";
const auth = getAuth(app);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // 🔥 SI NO HAY USUARIO, LLEVAR A LOGIN
        router.push("/login");
        return;
      }

      // 🔥 Usuario válido → permitir acceso
      setChecking(false);
    });

    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <div className="text-white p-10">
        Verificando sesión...
      </div>
    );
  }

  return <>{children}</>;
}
