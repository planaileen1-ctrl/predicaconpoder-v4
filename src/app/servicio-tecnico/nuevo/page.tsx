"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

/* ================= UTILIDADES ================= */

function generarCodigo() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ST-${y}${m}${d}-${rand}`;
}

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ================= PAGE ================= */

export default function NuevoServicioPage() {
  const router = useRouter();

  // 🔑 Código y fecha automáticos
  const [codigo] = useState(generarCodigo());
  const [fechaIngreso] = useState(hoyISO());

  // ✅ NUEVO: estado de guardado
  const [guardado, setGuardado] = useState(false);

  // 👤 Cliente
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  // 🖥️ Equipo
  const [equipoTipo, setEquipoTipo] = useState("Laptop");
  const [equipoMarca, setEquipoMarca] = useState("");
  const [equipoModelo, setEquipoModelo] = useState("");
  const [equipoSerie, setEquipoSerie] = useState("");
  const [accesorios, setAccesorios] = useState("");

  // 🧾 Problema
  const [problemaReportado, setProblemaReportado] = useState("");

  // 💰 Costos
  const [presupuesto, setPresupuesto] = useState("");
  const [anticipo, setAnticipo] = useState("");

  const total = useMemo(() => {
    return Math.max(0, toNumber(presupuesto) - toNumber(anticipo));
  }, [presupuesto, anticipo]);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= GUARDAR ================= */

  const guardar = async () => {
    setError(null);

    if (!clienteNombre.trim()) return setError("Falta el nombre del cliente");
    if (!clienteTelefono.trim()) return setError("Falta el teléfono");
    if (!equipoMarca.trim()) return setError("Falta la marca del equipo");
    if (!equipoModelo.trim()) return setError("Falta el modelo del equipo");
    if (!problemaReportado.trim())
      return setError("Falta el problema reportado");

    setGuardando(true);

    try {
      await addDoc(collection(db, "servicio_tecnico"), {
        // 🔑 Sistema
        codigo,
        estado: "RECIBIDO",
        fechaIngreso: Timestamp.fromDate(
          new Date(fechaIngreso + "T00:00:00")
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        // 👤 Cliente
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim(),
        clienteEmail: clienteEmail.trim() || "",

        // 🖥️ Equipo
        equipoTipo,
        equipoMarca: equipoMarca.trim(),
        equipoModelo: equipoModelo.trim(),
        equipoSerie: equipoSerie.trim() || "",
        accesorios: accesorios.trim() || "",

        // 🧾 Problema
        problemaReportado: problemaReportado.trim(),

        // 💰 Costos
        presupuesto: toNumber(presupuesto),
        anticipo: toNumber(anticipo),
        total,
      });

      // ❌ NO redirige
      // ✅ Se queda aquí
      setGuardado(true);
    } catch (e: any) {
      setError("Error al guardar el servicio");
    } finally {
      setGuardando(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Nuevo ingreso
            </h1>
            <p className="text-sm opacity-80">
              Registro de equipo para reparación
            </p>
          </div>

          <button
            onClick={() => router.push("/servicio-tecnico/menu")}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/10"
          >
            ← Volver
          </button>
        </div>

        {/* INFO DEL SISTEMA */}
        <div className="rounded-2xl border border-white/10 p-4 text-sm">
          <div><strong>Código:</strong> {codigo}</div>
          <div><strong>Fecha de ingreso:</strong> {fechaIngreso}</div>
        </div>

        {guardado && (
          <div className="p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-sm">
            ✅ Servicio guardado correctamente
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm">
            {error}
          </div>
        )}

        {/* CLIENTE */}
        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <h2 className="font-semibold">Cliente</h2>
          <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Nombre" className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10" />
          <input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} placeholder="Teléfono" className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10" />
          <input value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} placeholder="Email (opcional)" className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10" />
        </div>

        {/* EQUIPO */}
        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <h2 className="font-semibold">Equipo</h2>
          <select value={equipoTipo} onChange={(e) => setEquipoTipo(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10">
            <option>Laptop</option>
            <option>PC</option>
            <option>All-in-One</option>
            <option>Impresora</option>
            <option>Otro</option>
          </select>
          <input value={equipoMarca} onChange={(e) => setEquipoMarca(e.target.value)} placeholder="Marca" className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10" />
          <input value={equipoModelo} onChange={(e) => setEquipoModelo(e.target.value)} placeholder="Modelo" className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10" />
        </div>

        {/* PROBLEMA */}
        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <h2 className="font-semibold">Problema reportado</h2>
          <textarea value={problemaReportado} onChange={(e) => setProblemaReportado(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 min-h-[100px]" />
        </div>

        {/* COSTOS */}
        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <h2 className="font-semibold">Costos</h2>
          <input value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} placeholder="Costo total" className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10" />
          <input value={anticipo} onChange={(e) => setAnticipo(e.target.value)} placeholder="Abono" className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10" />
          <div><strong>Saldo pendiente:</strong> {total}</div>
        </div>

        {/* ACCIONES */}
        <button
          onClick={guardar}
          disabled={guardando || guardado}
          className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
        >
          {guardando ? "Guardando..." : guardado ? "Guardado" : "Guardar servicio"}
        </button>

        <div className="grid md:grid-cols-2 gap-3">
          <button type="button" onClick={() => window.print()} className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10">
            🖨️ Imprimir
          </button>

          <button
            type="button"
            onClick={() => {
              const texto = `
Servicio Técnico
Código: ${codigo}
Fecha: ${fechaIngreso}

Cliente: ${clienteNombre}
Equipo: ${equipoMarca} ${equipoModelo}

Problema:
${problemaReportado}

Costo: ${presupuesto}
Abono: ${anticipo}
Saldo: ${total}
              `.trim();

              const url = `https://wa.me/593${clienteTelefono}?text=${encodeURIComponent(texto)}`;
              window.open(url, "_blank");
            }}
            className="px-4 py-3 rounded-2xl bg-green-600/80 hover:bg-green-600 border border-green-600"
          >
            📲 Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
