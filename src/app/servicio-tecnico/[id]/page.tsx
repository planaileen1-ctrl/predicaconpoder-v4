"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

type Estado =
  | "RECIBIDO"
  | "EN_REVISION"
  | "EN_REPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

const ESTADOS: { value: Estado; label: string }[] = [
  { value: "RECIBIDO", label: "Recibido" },
  { value: "EN_REVISION", label: "En revisión" },
  { value: "EN_REPARACION", label: "En reparación" },
  { value: "LISTO", label: "Listo" },
  { value: "ENTREGADO", label: "Entregado" },
  { value: "CANCELADO", label: "Cancelado" },
];

function fmtTs(ts?: Timestamp | null) {
  if (!ts) return "";
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toNumberOrUndefined(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function ServicioDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [codigo, setCodigo] = useState("");

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  const [equipoTipo, setEquipoTipo] = useState("Laptop");
  const [equipoMarca, setEquipoMarca] = useState("");
  const [equipoModelo, setEquipoModelo] = useState("");
  const [equipoSerie, setEquipoSerie] = useState("");
  const [accesorios, setAccesorios] = useState("");

  const [problemaReportado, setProblemaReportado] = useState("");

  const [diagnostico, setDiagnostico] = useState("");
  const [trabajoRealizado, setTrabajoRealizado] = useState("");

  const [presupuesto, setPresupuesto] = useState("");
  const [anticipo, setAnticipo] = useState("");
  const totalCalc = useMemo(() => {
    const p = toNumberOrUndefined(presupuesto) ?? 0;
    const a = toNumberOrUndefined(anticipo) ?? 0;
    return Math.max(0, p - a);
  }, [presupuesto, anticipo]);

  const [estado, setEstado] = useState<Estado>("RECIBIDO");

  const [fechaIngreso, setFechaIngreso] = useState<string>("");
  const [fechaEntrega, setFechaEntrega] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setCargando(true);
      setError(null);

      try {
        const ref = doc(db, "servicio_tecnico", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("No existe este servicio.");
          setCargando(false);
          return;
        }

        const data = snap.data() as any;

        setCodigo(data.codigo ?? snap.id.slice(0, 8).toUpperCase());

        setClienteNombre(data.clienteNombre ?? "");
        setClienteTelefono(data.clienteTelefono ?? "");
        setClienteEmail(data.clienteEmail ?? "");

        setEquipoTipo(data.equipoTipo ?? "Laptop");
        setEquipoMarca(data.equipoMarca ?? "");
        setEquipoModelo(data.equipoModelo ?? "");
        setEquipoSerie(data.equipoSerie ?? "");
        setAccesorios(data.accesorios ?? "");

        setProblemaReportado(data.problemaReportado ?? "");

        setDiagnostico(data.diagnostico ?? "");
        setTrabajoRealizado(data.trabajoRealizado ?? "");

        setPresupuesto(
          typeof data.presupuesto === "number" ? String(data.presupuesto) : ""
        );
        setAnticipo(typeof data.anticipo === "number" ? String(data.anticipo) : "");

        setEstado((data.estado ?? "RECIBIDO") as Estado);

        const fi: Timestamp | undefined = data.fechaIngreso;
        const fe: Timestamp | null | undefined = data.fechaEntrega;

        setFechaIngreso(fi ? fmtTs(fi) : "");
        setFechaEntrega(fe ? fmtTs(fe) : "");
      } catch (e: any) {
        setError(e?.message ?? "Error al cargar.");
      } finally {
        setCargando(false);
      }
    };

    if (id) load();
  }, [id]);

  const guardar = async () => {
    setError(null);

    if (!clienteNombre.trim()) return setError("Falta nombre del cliente.");
    if (!clienteTelefono.trim()) return setError("Falta teléfono del cliente.");
    if (!equipoMarca.trim()) return setError("Falta marca.");
    if (!equipoModelo.trim()) return setError("Falta modelo.");
    if (!problemaReportado.trim()) return setError("Falta problema reportado.");

    try {
      const ref = doc(db, "servicio_tecnico", id);

      const fi = fechaIngreso ? Timestamp.fromDate(new Date(fechaIngreso + "T00:00:00")) : null;
      const fe = fechaEntrega ? Timestamp.fromDate(new Date(fechaEntrega + "T00:00:00")) : null;

      await updateDoc(ref, {
        codigo: codigo.trim() || id.slice(0, 8).toUpperCase(),

        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim(),
        clienteEmail: clienteEmail.trim() || "",

        equipoTipo,
        equipoMarca: equipoMarca.trim(),
        equipoModelo: equipoModelo.trim(),
        equipoSerie: equipoSerie.trim() || "",
        accesorios: accesorios.trim() || "",

        problemaReportado: problemaReportado.trim(),

        diagnostico: diagnostico.trim() || "",
        trabajoRealizado: trabajoRealizado.trim() || "",

        presupuesto: toNumberOrUndefined(presupuesto),
        anticipo: toNumberOrUndefined(anticipo),
        total: totalCalc,

        estado,

        fechaIngreso: fi ?? Timestamp.now(),
        fechaEntrega: estado === "ENTREGADO" ? (fe ?? Timestamp.now()) : fe,

        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar.");
    }
  };

  const marcarEntregadoHoy = async () => {
    setError(null);
    try {
      const ref = doc(db, "servicio_tecnico", id);
      await updateDoc(ref, {
        estado: "ENTREGADO" as Estado,
        fechaEntrega: Timestamp.now(),
        updatedAt: serverTimestamp(),
      });
      setEstado("ENTREGADO");
      setFechaEntrega(fmtTs(Timestamp.now()));
    } catch (e: any) {
      setError(e?.message ?? "No se pudo marcar entregado.");
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto opacity-80">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Servicio: <span className="opacity-90">{codigo || id.slice(0, 8).toUpperCase()}</span>
            </h1>
            <p className="text-sm opacity-80">
              Edita, actualiza estado y registra diagnóstico.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/servicio-tecnico")}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              ← Volver
            </button>
            <button
              onClick={guardar}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              Guardar
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código (ej: ST-0001)"
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            />
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            >
              {ESTADOS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>

            <button
              onClick={marcarEntregadoHoy}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              Marcar ENTREGADO (hoy)
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs opacity-70 mb-1">Fecha ingreso</div>
              <input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
              />
            </div>
            <div>
              <div className="text-xs opacity-70 mb-1">Fecha entrega</div>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <h2 className="font-semibold">Cliente</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              placeholder="Nombre"
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            />
            <input
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              placeholder="Teléfono"
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            />
          </div>
          <input
            value={clienteEmail}
            onChange={(e) => setClienteEmail(e.target.value)}
            placeholder="Email (opcional)"
            className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
          />
        </div>

        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <h2 className="font-semibold">Equipo</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <select
              value={equipoTipo}
              onChange={(e) => setEquipoTipo(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            >
              <option value="Laptop">Laptop</option>
              <option value="PC">PC</option>
              <option value="All-in-One">All-in-One</option>
              <option value="Impresora">Impresora</option>
              <option value="Otro">Otro</option>
            </select>
            <input
              value={equipoMarca}
              onChange={(e) => setEquipoMarca(e.target.value)}
              placeholder="Marca"
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={equipoModelo}
              onChange={(e) => setEquipoModelo(e.target.value)}
              placeholder="Modelo"
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            />
            <input
              value={equipoSerie}
              onChange={(e) => setEquipoSerie(e.target.value)}
              placeholder="Serie (opcional)"
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            />
          </div>

          <textarea
            value={accesorios}
            onChange={(e) => setAccesorios(e.target.value)}
            placeholder="Accesorios entregados (opcional)"
            className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none min-h-[80px]"
          />
        </div>

        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <h2 className="font-semibold">Problema / Diagnóstico / Trabajo</h2>
          <textarea
            value={problemaReportado}
            onChange={(e) => setProblemaReportado(e.target.value)}
            placeholder="Problema reportado"
            className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none min-h-[90px]"
          />
          <textarea
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            placeholder="Diagnóstico (opcional)"
            className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none min-h-[90px]"
          />
          <textarea
            value={trabajoRealizado}
            onChange={(e) => setTrabajoRealizado(e.target.value)}
            placeholder="Trabajo realizado (opcional)"
            className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none min-h-[90px]"
          />
        </div>

        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <h2 className="font-semibold">Costos</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
              placeholder="Presupuesto"
              inputMode="decimal"
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            />
            <input
              value={anticipo}
              onChange={(e) => setAnticipo(e.target.value)}
              placeholder="Anticipo"
              inputMode="decimal"
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 outline-none"
            />
          </div>
          <div className="text-sm opacity-80">
            Total pendiente (auto): <span className="font-semibold">{totalCalc}</span>
          </div>
        </div>

        <button
          onClick={guardar}
          className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
