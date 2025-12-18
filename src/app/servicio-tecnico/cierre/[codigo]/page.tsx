"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

export default function CierreServicioPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [estadoFinal, setEstadoFinal] = useState("Solucionado");
  const [detalle, setDetalle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const ref = doc(db, "servicio_tecnico", codigo);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setData(snap.data());
        setEstadoFinal(snap.data().estadoFinal ?? "Solucionado");
        setDetalle(snap.data().detalleCierre ?? "");
      }

      setLoading(false);
    };

    cargar();
  }, [codigo]);

  const guardar = async () => {
    await updateDoc(doc(db, "servicio_tecnico", codigo), {
      estadoFinal,
      detalleCierre: detalle,
      fechaCierre: Timestamp.now(),
      estado: estadoFinal,
    });

    alert("Cierre guardado correctamente");
  };

  const enviarWhatsApp = () => {
    const mensaje = `
🛠️ *CIERRE DE SERVICIO TÉCNICO*

Código: ${codigo}
Cliente: ${data.cliente}
Equipo: ${data.equipo}

Resultado: ${estadoFinal}

Detalle:
${detalle}

Gracias por confiar en nosotros.
    `;

    const url = `https://wa.me/593${data.celular}?text=${encodeURIComponent(
      mensaje
    )}`;

    window.open(url, "_blank");
  };

  if (loading) return <p className="p-4 text-white">Cargando...</p>;

  return (
    <main className="min-h-screen bg-black text-white flex justify-center p-4">
      <div className="w-full max-w-md space-y-4 bg-neutral-900 p-4 rounded-xl">

        <h1 className="text-xl font-bold">🔒 Cierre de servicio</h1>

        <div className="text-sm space-y-1">
          <p><b>Código:</b> {codigo}</p>
          <p><b>Cliente:</b> {data.cliente}</p>
          <p><b>Equipo:</b> {data.equipo}</p>
        </div>

        <hr className="border-neutral-700" />

        <label className="text-sm">Estado final</label>
        <select
          className="w-full bg-black p-2 rounded border border-neutral-700"
          value={estadoFinal}
          onChange={(e) => setEstadoFinal(e.target.value)}
        >
          <option>Solucionado</option>
          <option>No solucionado</option>
          <option>En espera</option>
        </select>

        <label className="text-sm">Detalle del cierre</label>
        <textarea
          className="w-full bg-black p-2 rounded border border-neutral-700"
          rows={4}
          placeholder="Qué se hizo / por qué no se solucionó..."
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
        />

        <button
          onClick={guardar}
          className="w-full bg-blue-600 py-2 rounded"
        >
          Guardar cierre
        </button>

        <button
          onClick={enviarWhatsApp}
          className="w-full bg-green-600 py-2 rounded"
        >
          Enviar por WhatsApp
        </button>

        <button
          onClick={() => router.back()}
          className="w-full bg-neutral-700 py-2 rounded"
        >
          Volver
        </button>

      </div>
    </main>
  );
}
