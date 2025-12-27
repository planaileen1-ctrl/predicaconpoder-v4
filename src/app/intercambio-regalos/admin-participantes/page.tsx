"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

type P = {
  id: string;
  nombreCompleto: string;
  deseo: string;
  whatsapp: string;
  codigo: string;
  creadoEn: any;
};

function waLink(numero: string, texto: string) {
  const phone = (numero || "").replace(/\D/g, "");
  const msg = encodeURIComponent(texto);
  return `https://wa.me/${phone}?text=${msg}`;
}

export default function AdminParticipantesPage() {
  const router = useRouter();
  const adminEmail = useMemo(() => "planaileen@gmail.com", []);
  const [loading, setLoading] = useState(true);
  const [userOk, setUserOk] = useState(false);
  const [items, setItems] = useState<P[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.email !== adminEmail) {
        router.push("/intercambio-regalos");
        return;
      }
      setUserOk(true);

      try {
        const q = query(
          collection(db, "intercambio_regalos_participantes"),
          orderBy("creadoEn", "asc")
        );
        const snap = await getDocs(q);
        const data: P[] = snap.docs.map((d) => ({
          id: d.id,
          nombreCompleto: d.data().nombreCompleto || "",
          deseo: d.data().deseo || "",
          whatsapp: d.data().whatsapp || "",
          codigo: d.data().codigo || "",
          creadoEn: d.data().creadoEn || null,
        }));
        setItems(data);
      } catch (e) {
        console.error(e);
        alert("Error cargando participantes (admin).");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router, adminEmail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Cargando...
      </div>
    );
  }
  if (!userOk) return null;

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/intercambio-regalos")}
          className="text-sm text-indigo-400 hover:text-indigo-300 mb-6"
        >
          ← Volver al menú
        </button>

        <h1 className="text-3xl font-bold mb-2">👑 Admin: Participantes</h1>
        <p className="text-neutral-400 mb-6">
          Aquí ves WhatsApp + deseo + código (solo admin).
        </p>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <p className="text-sm text-neutral-300">
            Total: <span className="font-semibold">{items.length}</span>
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {items.map((p, idx) => {
            const mensaje = `Hola ${p.nombreCompleto} 👋
Te confirmo tu inscripción al intercambio 🎁

✅ Tu código secreto: ${p.codigo}
🎯 Lo que pediste: ${p.deseo}
💵 Presupuesto máximo: $5

Guarda este código. Con él verás a quién te toca regalar.`;

            return (
              <div
                key={p.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {idx + 1}. {p.nombreCompleto}
                    </p>
                    <p className="text-xs text-neutral-400">
                      WhatsApp: {p.whatsapp || "—"} | Código: {p.codigo || "—"}
                    </p>
                    <p className="text-sm text-neutral-300 mt-2">
                      Pedido: <span className="text-white font-semibold">{p.deseo}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(mensaje);
                        alert("Mensaje copiado ✅");
                      }}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm"
                    >
                      Copiar
                    </button>

                    <a
                      href={waLink(p.whatsapp, mensaje)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
                    >
                      Enviar WA
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <p className="text-neutral-500 text-sm mt-6">Aún no hay participantes.</p>
          )}
        </div>
      </div>
    </main>
  );
}
