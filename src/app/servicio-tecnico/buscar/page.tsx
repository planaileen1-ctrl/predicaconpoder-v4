"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

type Equipo = {
  codigo: string;
  estado: string;
  fechaIngreso?: any;
};

export default function BuscarEquipoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(false);

  // 🔥 CARGAR TODOS LOS EQUIPOS REGISTRADOS
  useEffect(() => {
    const cargar = async () => {
      const snap = await getDocs(collection(db, "servicio_tecnico"));
      const lista: Equipo[] = [];

      snap.forEach((docu) => {
        const data = docu.data();
        lista.push({
          codigo: docu.id,
          estado: data.estado ?? "Recibido",
          fechaIngreso: data.fechaIngreso,
        });
      });

      // ordenar por fecha más reciente
      lista.sort((a, b) => {
        if (!a.fechaIngreso || !b.fechaIngreso) return 0;
        return b.fechaIngreso.seconds - a.fechaIngreso.seconds;
      });

      setEquipos(lista);
    };

    cargar();
  }, []);

  // 🔍 BUSCAR POR CÓDIGO (PISTOLA O MANUAL)
  const buscar = async () => {
    if (!codigo) return;

    setCargando(true);
    const ref = doc(db, "servicio_tecnico", codigo);
    const snap = await getDoc(ref);
    setCargando(false);

    if (snap.exists()) {
      router.push(`/servicio-tecnico/imprimir/${codigo}`);
    } else {
      alert("Equipo no encontrado");
    }
  };

  // 🕒 FORMATEAR FECHA Y HORA
  const formatFechaHora = (fecha: any) => {
    if (!fecha) return "--";
    const d = fecha.toDate();
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-10 max-w-4xl mx-auto">
      <button
        onClick={() => router.push("/servicio-tecnico")}
        className="text-sky-400 mb-4"
      >
        ← Volver
      </button>

      <h1 className="text-2xl font-bold mb-4">🔍 Buscar equipo</h1>

      <div className="flex gap-3 mb-6">
        <input
          className="input flex-1"
          placeholder="Código (ST-...)"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          autoFocus
        />
        <button
          onClick={buscar}
          className="bg-emerald-600 px-6 rounded-lg"
        >
          Buscar
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-3">
        📋 Equipos registrados
      </h2>

      <div className="grid gap-2">
        {equipos.map((e) => (
          <button
            key={e.codigo}
            onClick={() =>
              router.push(`/servicio-tecnico/imprimir/${e.codigo}`)
            }
            className="flex justify-between items-center bg-neutral-900 hover:bg-neutral-800 rounded-lg px-4 py-3 text-left"
          >
            <div>
              <div className="font-semibold">{e.codigo}</div>
              <div className="text-sm text-neutral-400">
                {formatFechaHora(e.fechaIngreso)}
              </div>
            </div>

            <span className="text-sm bg-neutral-700 px-3 py-1 rounded-full">
              {e.estado}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
