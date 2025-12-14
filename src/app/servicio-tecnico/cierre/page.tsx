"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CierreServicioPage() {
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [equipo, setEquipo] = useState<any>(null);
  const [resultado, setResultado] = useState("Solucionado");
  const [detalle, setDetalle] = useState("");
  const [pagoCierre, setPagoCierre] = useState(0);
  const [cargando, setCargando] = useState(false);

  /* 🔍 BUSCAR EQUIPO */
  const buscarEquipo = async () => {
    if (!codigo) return;

    setCargando(true);
    const ref = doc(db, "servicio_tecnico", codigo);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("❌ Equipo no encontrado");
      setEquipo(null);
      setCargando(false);
      return;
    }

    const data = snap.data();
    setEquipo({
      ...data,
      total: Number(data.total || 0),
      abono: Number(data.abono || 0),
      saldo: Number(data.saldo || 0),
    });

    setPagoCierre(0);
    setCargando(false);
  };

  /* 💾 GUARDAR CIERRE + DINERO */
  const guardarCierre = async () => {
    if (!equipo) return;

    if (pagoCierre < 0 || pagoCierre > equipo.saldo) {
      alert("❌ Pago inválido");
      return;
    }

    const nuevoAbono = equipo.abono + pagoCierre;
    const nuevoSaldo = equipo.saldo - pagoCierre;

    await updateDoc(doc(db, "servicio_tecnico", codigo), {
      abono: nuevoAbono,
      saldo: nuevoSaldo,
      estado:
        resultado === "Solucionado" && nuevoSaldo === 0
          ? "Entregado"
          : "Reparado",
      cierre: {
        resultado,
        detalle,
        pagoCierre,
        fecha: Timestamp.now(),
      },
    });

    alert("✅ Cierre y pago registrados");
    buscarEquipo();
  };

  /* 📲 WHATSAPP */
  const enviarWhatsApp = () => {
    if (!equipo) return;

    const mensaje = `
🔧 *Cierre de servicio técnico*

📄 Código: ${codigo}
👤 Cliente: ${equipo.cliente}

🛠 Resultado: ${resultado}
📝 Detalle: ${detalle || "Sin observaciones"}

💰 Total: $${equipo.total}
💵 Abono anterior: $${equipo.abono}
💳 Pago en cierre: $${pagoCierre}
⚠️ Saldo pendiente: $${equipo.saldo - pagoCierre}

Gracias por su preferencia 🙌
`;

    const telefono = equipo.celular.replace(/\D/g, "");
    const url = `https://wa.me/593${telefono}?text=${encodeURIComponent(
      mensaje
    )}`;

    window.open(url, "_blank");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-10 max-w-xl mx-auto">
      <button
        onClick={() => router.push("/servicio-tecnico")}
        className="text-sky-400 mb-4"
      >
        ← Volver a Servicio Técnico
      </button>

      <h1 className="text-2xl font-bold mb-6">✅ Cierre de servicio</h1>

      {/* BUSCAR */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3"
          placeholder="Código del equipo (ST-...)"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <button
          onClick={buscarEquipo}
          className="bg-sky-600 px-4 rounded-xl"
        >
          Buscar
        </button>
      </div>

      {cargando && <p>Cargando...</p>}

      {/* INFO EQUIPO */}
      {equipo && (
        <>
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 mb-4">
            <p><b>Cliente:</b> {equipo.cliente}</p>
            <p><b>Total:</b> ${equipo.total}</p>
            <p><b>Abono:</b> ${equipo.abono}</p>
            <p className="text-red-400 font-bold">
              Saldo pendiente: ${equipo.saldo}
            </p>

            {/* PAGO */}
            <input
              type="number"
              min={0}
              max={equipo.saldo}
              value={pagoCierre}
              onChange={(e) => setPagoCierre(Number(e.target.value))}
              placeholder="Pago recibido en el cierre"
              className="w-full mt-3 bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-3"
            />

            <p className="mt-2 text-green-400">
              Saldo después del pago: ${equipo.saldo - pagoCierre}
            </p>
          </div>

          {/* RESULTADO */}
          <select
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 mb-3"
          >
            <option>Solucionado</option>
            <option>No solucionado</option>
          </select>

          <textarea
            placeholder="Detalle del cierre / trabajo realizado"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 mb-4"
          />

          <button
            onClick={guardarCierre}
            className="w-full bg-orange-600 rounded-xl py-3 font-semibold mb-3"
          >
            Guardar cierre
          </button>

          <button
            onClick={enviarWhatsApp}
            className="w-full bg-green-600 rounded-xl py-3 font-semibold"
          >
            Enviar por WhatsApp
          </button>
        </>
      )}
    </main>
  );
}
