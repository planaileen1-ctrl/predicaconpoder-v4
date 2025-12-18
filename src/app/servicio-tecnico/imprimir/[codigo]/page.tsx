"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ImprimirServicioTecnico() {
  const { codigo } = useParams<{ codigo: string }>();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [total, setTotal] = useState<number>(0);
  const [abono, setAbono] = useState<number>(0);
  const [estado, setEstado] = useState<string>("Recibido");
  const [cargando, setCargando] = useState(true);

  const saldo = Math.max(total - abono, 0);

  useEffect(() => {
    const cargar = async () => {
      const ref = doc(db, "servicio_tecnico", codigo);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const d = snap.data();
        setData(d);
        setTotal(d.total ?? 0);
        setAbono(d.abono ?? 0);
        setEstado(d.estado ?? "Recibido");
      }

      setCargando(false);
    };

    cargar();
  }, [codigo]);

  const guardarCambios = async () => {
    const ref = doc(db, "servicio_tecnico", codigo);
    await updateDoc(ref, {
      total,
      abono,
      saldo,
      estado,
    });
    alert("Cambios guardados");
  };

  const enviarWhatsApp = () => {
    const mensaje = `
🛠️ *SERVICIO TÉCNICO*
Código: ${codigo}

Cliente: ${data.cliente}
Equipo: ${data.equipo}
Diagnóstico: ${data.diagnostico}

💰 Total: $${total}
💵 Abono: $${abono}
📌 Saldo: $${saldo}
Estado: ${estado}
`;
    const url = `https://wa.me/593${data.celular}?text=${encodeURIComponent(
      mensaje
    )}`;
    window.open(url, "_blank");
  };

  if (cargando) return <div className="p-4">Cargando...</div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">
      {/* ===== TICKET (IMPRIMIBLE) ===== */}
      <div id="ticket" className="bg-white text-black w-[280px] p-3 text-sm">
        <h2 className="text-center font-bold">SERVICIO TÉCNICO</h2>
        <p className="text-center">{codigo}</p>
        <hr />

        <p><b>Cliente:</b> {data.cliente}</p>
        <p><b>Celular:</b> {data.celular}</p>
        <p><b>Email:</b> {data.email}</p>

        <hr />

        <p><b>Equipo:</b> {data.equipo}</p>
        <p><b>Marca:</b> {data.marca}</p>
        <p><b>Modelo:</b> {data.modelo}</p>
        <p><b>RAM:</b> {data.ram}</p>
        <p><b>Almacenamiento:</b> {data.almacenamiento}</p>

        <hr />

        <p><b>Diagnóstico:</b></p>
        <p>{data.diagnostico}</p>

        <hr />

        <p><b>Estado:</b> {estado}</p>
        <p><b>Total:</b> ${total.toFixed(2)}</p>
        <p><b>Abono:</b> ${abono.toFixed(2)}</p>
        <p><b>Saldo:</b> ${saldo.toFixed(2)}</p>

        <p className="text-center mt-2">Gracias por su preferencia</p>
      </div>

      {/* ===== CONTROLES (NO SE IMPRIMEN) ===== */}
      <div className="w-[280px] mt-4 space-y-3 print:hidden">
        <label className="text-sm text-neutral-400">Presupuesto ($)</label>
        <input
          type="number"
          placeholder="Ej: 50"
          className="w-full p-2 rounded bg-neutral-900"
          value={total === 0 ? "" : total}
          onChange={(e) => setTotal(Number(e.target.value))}
        />

        <label className="text-sm text-neutral-400">Abono ($)</label>
        <input
          type="number"
          placeholder="Ej: 20"
          className="w-full p-2 rounded bg-neutral-900"
          value={abono === 0 ? "" : abono}
          onChange={(e) => setAbono(Number(e.target.value))}
        />

        <input
          disabled
          className="w-full p-2 rounded bg-neutral-800"
          value={`Saldo: $${saldo}`}
        />

        <select
          className="w-full p-2 rounded bg-neutral-900"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option>Recibido</option>
          <option>En espera</option>
          <option>Reparando</option>
          <option>Listo</option>
          <option>Entregado</option>
        </select>

        <button
          onClick={guardarCambios}
          className="w-full bg-blue-600 py-2 rounded"
        >
          Guardar cambios
        </button>

        <button
          onClick={() => window.print()}
          className="w-full bg-neutral-700 py-2 rounded"
        >
          Imprimir
        </button>

        <button
          onClick={enviarWhatsApp}
          className="w-full bg-green-600 py-2 rounded"
        >
          Enviar por WhatsApp
        </button>

        <button
          onClick={() => router.push("/servicio-tecnico")}
          className="w-full bg-neutral-600 py-2 rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
