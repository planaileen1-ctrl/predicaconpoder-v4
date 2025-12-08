"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function MisSermonesPage() {
  const [sermones, setSermones] = useState<any[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const cargarSermones = async () => {
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
    };

    cargarSermones();
  }, [user]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Mis Sermones</h1>

      {sermones.length === 0 && (
        <p className="text-neutral-400">Aún no has creado sermones.</p>
      )}

      <div className="space-y-3">
        {sermones.map((s) => (
          <Link
            key={s.id}
            href={`/mis-sermones/${s.id}`}
            className="block p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition"
          >
            <h2 className="text-lg font-semibold">{s.titulo}</h2>
            <p className="text-neutral-400 text-sm">
              {s.pasaje || "Sin pasaje"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
