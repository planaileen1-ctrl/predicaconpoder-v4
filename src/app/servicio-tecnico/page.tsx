"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
} from "firebase/firestore";

type Estado = "RECIBIDO" | "ENTREGADO";

type Servicio = {
  id: string;
  codigo: string;

  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;

  equipoTipo: string;
  equipoMarca: string;
  equipoModelo: string;

  problemaReportado: string;

  presupuesto?: number;
  anticipo?: number;
  total?: number;

  estado: Estado;

  fechaIngreso?: Timestamp;
  fechaEntrega?: Timestamp;
};

const ESTADOS: { value: Estado; label: string }[] = [
  { value: "RECIBIDO", label: "Recibido" },
  { value: "ENTREGADO", label: "Entregado" },
];

function fmtTs(ts?: Timestamp) {
  if (!ts) return "";
  return ts.toDate().toISOString().split("T")[0];
}

export default function ServicioTecnicoPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [qText, setQText] = useState("");
  const [fEstado, setFEstado] = useState<Estado | "TODOS">("TODOS");

  useEffect(() => {
    const ref = collection(db, "servicio_tecnico");
    const q = query(ref); // ⬅️ SIN orderBy (clave)

    const unsub = onSnapshot(q, (snap) => {
      const rows: Servicio[] = snap.docs.map((d) => {
        const data = d.data() as any;

        const presupuesto =
          Number(data.abono || 0) + Number(data.pagoCierre || 0);
        const anticipo = Number(data.abono || 0);
        const total = Number(data.pagoCierre || 0);

        return {
          id: d.id,
          codigo: data.codigo ?? d.id.slice(0, 8).toUpperCase(),

          // 👤 Cliente (modelo viejo)
          clienteNombre: data.cliente ?? "",
          clienteTelefono: data.celular ?? "",
          clienteEmail: data.correo ?? "",

          // 🖥️ Equipo (modelo viejo)
          equipoTipo: "PC",
          equipoMarca: data.categoria ?? "Equipo",
          equipoModelo: data.almacenamiento ?? "",

          // 🧾 Resultado / problema
          problemaReportado: data.resultado ?? "",

          // 💰 Costos
          presupuesto,
          anticipo,
          total,

          // 📌 Estado
          estado: data.cierre ? "ENTREGADO" : "RECIBIDO",

          // 📅 Fechas
          fechaIngreso: data.cierre?.fecha ?? undefined,
          fechaEntrega: data.cierre?.fecha ?? undefined,
        };
      });

      setServicios(rows);
    });

    return () => unsub();
  }, []);

  const filtrados = useMemo(() => {
    const t = qText.trim().toLowerCase();

    return servicios.filter((s) => {
      const okEstado = fEstado === "TODOS" ? true : s.estado === fEstado;
      if (!okEstado) return false;
      if (!t) return true;

      return (
        s.codigo.toLowerCase().includes(t) ||
        s.clienteNombre.toLowerCase().includes(t) ||
        s.clienteTelefono.toLowerCase().includes(t) ||
        s.equipoMarca.toLowerCase().includes(t) ||
        s.equipoModelo.toLowerCase().includes(t) ||
        s.problemaReportado.toLowerCase().includes(t)
      );
    });
  }, [servicios, qText, fEstado]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Servicio Técnico
            </h1>
            <p className="text-sm opacity-80">
              Registro y seguimiento de reparaciones
            </p>
          </div>

          <Link
            href="/servicio-tecnico/menu"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
          >
            Menú
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Buscar por código, cliente, teléfono, equipo..."
            className="md:col-span-2 w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
          />
          <select
            value={fEstado}
            onChange={(e) => setFEstado(e.target.value as any)}
            className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
          >
            <option value="TODOS">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 px-4 py-3 bg-white/5 text-xs uppercase opacity-80">
            <div className="col-span-2">Código</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-3">Equipo</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Estado</div>
          </div>

          <div className="divide-y divide-white/10">
            {filtrados.length === 0 ? (
              <div className="p-6 text-sm opacity-80">
                No hay registros.
              </div>
            ) : (
              filtrados.map((s) => (
                <Link
                  key={s.id}
                  href={`/servicio-tecnico/${s.id}`}
                  className="block hover:bg-white/5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 px-4 py-4 gap-2">
                    <div className="md:col-span-2 font-semibold">
                      {s.codigo}
                    </div>

                    <div className="md:col-span-3">
                      <div>{s.clienteNombre}</div>
                      <div className="text-xs opacity-70">
                        {s.clienteTelefono}
                      </div>
                    </div>

                    <div className="md:col-span-3 text-sm">
                      {s.equipoMarca} {s.equipoModelo}
                    </div>

                    <div className="md:col-span-2 text-sm">
                      {fmtTs(s.fechaIngreso)}
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-xs px-2 py-1 rounded-full border border-white/15">
                        {s.estado}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
