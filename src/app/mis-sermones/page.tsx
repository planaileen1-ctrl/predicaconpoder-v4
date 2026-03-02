"use client";

import { useEffect, useState } from "react";
import app from "@/lib/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
const auth = getAuth(app);
const db = getFirestore(app);
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MisSermonesPage() {
  const [sermones, setSermones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "sermones"),
        where("uid", "==", user.uid),
        where("archivado", "==", false)
      );

      const snaps = await getDocs(q);
      const data = snaps.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSermones(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        Cargando sermones…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      {/* 🔙 BOTÓN DASHBOARD */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition"
      >
        ← Volver al Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">Mis Sermones</h1>

      {sermones.length === 0 && (
        <p className="text-neutral-400">
          Aún no has creado sermones.
        </p>
      )}

      <div className="space-y-4">
        {sermones.map((s) => (
          <div
            key={s.id}
            className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl"
          >
            <h2 className="text-lg font-semibold">
              {s.titulo}
            </h2>

            <p className="text-neutral-400 text-sm mb-4">
              {s.pasaje || "Sin pasaje"}
            </p>

            <div className="flex gap-3">
              <Link
                href={`/mis-sermones/${s.id}`}
                className="px-4 py-2 bg-blue-600 rounded-lg text-sm"
              >
                📖 Ver
              </Link>

              <Link
                href={`/mis-sermones/${s.id}/presentar`}
                className="px-4 py-2 bg-indigo-600 rounded-lg text-sm"
              >
                🎤 Predicar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
