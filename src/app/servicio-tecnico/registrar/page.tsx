"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

function generarCodigo() {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `ST-${fecha}-${random}`;
}

export default function RegistrarDispositivoPage() {
  const router = useRouter();
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);

  const [form, setForm] = useState({
    cliente: "",
    celular: "",
    correo: "",
    categoria: "Laptop",
    subcategoria: "",
    marca: "",
    modelo: "",
    ram: "",
    almacenamiento: "",
    diagnostico: "",
    observaciones: "",
  });

  const guardar = async () => {
    const codigo = generarCodigo();

    await setDoc(doc(db, "servicio_tecnico", codigo), {
      ...form,
      codigo,
      estado: "Recibido",
      fechaIngreso: Timestamp.now(),
    });

    setCodigoGenerado(codigo);

    // 👉 vas directo al ticket imprimible
    router.push(`/servicio-tecnico/imprimir/${codigo}`);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-10 max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/servicio-tecnico")}
        className="mb-4 text-sky-400"
      >
        ← Volver a Servicio Técnico
      </button>

      <h1 className="text-2xl font-bold mb-6">➕ Registrar dispositivo</h1>

      <div className="grid gap-4">
        <input className="input" placeholder="Nombre del cliente"
          onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
        <input className="input" placeholder="Celular (WhatsApp)"
          onChange={(e) => setForm({ ...form, celular: e.target.value })} />
        <input className="input" placeholder="Correo electrónico"
          onChange={(e) => setForm({ ...form, correo: e.target.value })} />

        <select className="input"
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
          <option>Laptop</option>
          <option>PC</option>
          <option>Tablet</option>
          <option>Otro</option>
        </select>

        <input className="input" placeholder="Marca"
          onChange={(e) => setForm({ ...form, marca: e.target.value })} />
        <input className="input" placeholder="Modelo"
          onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
        <input className="input" placeholder="RAM (8GB)"
          onChange={(e) => setForm({ ...form, ram: e.target.value })} />
        <input className="input" placeholder="Almacenamiento (SSD 256GB)"
          onChange={(e) => setForm({ ...form, almacenamiento: e.target.value })} />

        <textarea className="input" placeholder="Diagnóstico"
          onChange={(e) => setForm({ ...form, diagnostico: e.target.value })} />
        <textarea className="input" placeholder="Observaciones"
          onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />

        <button
          onClick={guardar}
          className="bg-sky-600 hover:bg-sky-700 rounded-xl py-3 font-semibold"
        >
          Guardar y generar ticket
        </button>
      </div>
    </main>
  );
}
