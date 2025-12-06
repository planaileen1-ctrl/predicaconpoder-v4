"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function FinanzasPage() {
  const today = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(today);

  const [ingresoMonto, setIngresoMonto] = useState("");
  const [ingresoDesc, setIngresoDesc] = useState("");

  const [gastoMonto, setGastoMonto] = useState("");
  const [gastoDesc, setGastoDesc] = useState("");

  const [ingresos, setIngresos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);

  // TOTALES DIARIOS
  const totalIngresos = ingresos.reduce((acc, i) => acc + i.monto, 0);
  const totalGastos = gastos.reduce((acc, i) => acc + i.monto, 0);
  const saldo = totalIngresos - totalGastos;

  // TOTALES GLOBALES
  const [ingresoTotal, setIngresoTotal] = useState(0);
  const [gastoTotal, setGastoTotal] = useState(0);
  const [saldoTotal, setSaldoTotal] = useState(0);

  // CARGAR DATOS POR FECHA
  useEffect(() => {
    cargarDatos();
    cargarTotalesGlobales();
  }, [fecha]);

  const cargarDatos = async () => {
    const ref = doc(db, "finanzas", fecha);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      setIngresos(Array.isArray(data.ingresos) ? data.ingresos : []);
      setGastos(Array.isArray(data.gastos) ? data.gastos : []);
    } else {
      setIngresos([]);
      setGastos([]);
    }
  };

  // CARGAR TOTALES DE TODAS LAS FECHAS
  const cargarTotalesGlobales = async () => {
    const ref = collection(db, "finanzas");
    const snap = await getDocs(ref);

    let totalIng = 0;
    let totalGas = 0;

    snap.forEach((doc) => {
      const data = doc.data();

      if (Array.isArray(data.ingresos)) {
        totalIng += data.ingresos.reduce((acc, i) => acc + i.monto, 0);
      }

      if (Array.isArray(data.gastos)) {
        totalGas += data.gastos.reduce((acc, g) => acc + g.monto, 0);
      }
    });

    setIngresoTotal(totalIng);
    setGastoTotal(totalGas);
    setSaldoTotal(totalIng - totalGas);
  };

  // AGREGAR INGRESO
  const agregarIngreso = async () => {
    if (!ingresoMonto) return;

    const ref = doc(db, "finanzas", fecha);
    const snap = await getDoc(ref);

    let ingresosActuales = [];
    let gastosActuales = [];

    if (snap.exists()) {
      const data = snap.data();
      ingresosActuales = Array.isArray(data.ingresos) ? data.ingresos : [];
      gastosActuales = Array.isArray(data.gastos) ? data.gastos : [];
    }

    const nuevo = {
      monto: Number(ingresoMonto),
      descripcion: ingresoDesc || "Ingreso",
      fecha,
    };

    const newIngresos = [...ingresosActuales, nuevo];

    await setDoc(
      ref,
      { ingresos: newIngresos, gastos: gastosActuales },
      { merge: true }
    );

    setIngresos(newIngresos);
    setIngresoMonto("");
    setIngresoDesc("");

    cargarTotalesGlobales();
  };

  // AGREGAR GASTO
  const agregarGasto = async () => {
    if (!gastoMonto) return;

    const ref = doc(db, "finanzas", fecha);
    const snap = await getDoc(ref);

    let ingresosActuales = [];
    let gastosActuales = [];

    if (snap.exists()) {
      const data = snap.data();
      ingresosActuales = Array.isArray(data.ingresos) ? data.ingresos : [];
      gastosActuales = Array.isArray(data.gastos) ? data.gastos : [];
    }

    const nuevo = {
      monto: Number(gastoMonto),
      descripcion: gastoDesc || "Gasto",
      fecha,
    };

    const newGastos = [...gastosActuales, nuevo];

    await setDoc(
      ref,
      { ingresos: ingresosActuales, gastos: newGastos },
      { merge: true }
    );

    setGastos(newGastos);
    setGastoMonto("");
    setGastoDesc("");

    cargarTotalesGlobales();
  };

  // GRAFICA
  const dataGrafico = [
    { name: "Ingresos", valor: totalIngresos },
    { name: "Gastos", valor: totalGastos },
    { name: "Saldo", valor: saldo },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-indigo-400">Ingresos y Gastos</h1>

      {/* FECHA */}
      <div className="mb-6">
        <label className="text-sm">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full mt-1 p-2 rounded bg-neutral-900 border border-neutral-700"
        />
      </div>

      {/* INGRESOS */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl mb-6">
        <h2 className="text-lg font-semibold mb-2 text-green-400">Agregar Ingreso</h2>

        <input
          type="number"
          placeholder="Monto"
          value={ingresoMonto}
          onChange={(e) => setIngresoMonto(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-neutral-800 border border-neutral-700"
        />

        <input
          type="text"
          placeholder="Descripción"
          value={ingresoDesc}
          onChange={(e) => setIngresoDesc(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-neutral-800 border border-neutral-700"
        />

        <button
          onClick={agregarIngreso}
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold"
        >
          + Agregar Ingreso
        </button>
      </div>

      {/* GASTOS */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl mb-6">
        <h2 className="text-lg font-semibold mb-2 text-red-400">Agregar Gasto</h2>

        <input
          type="number"
          placeholder="Monto"
          value={gastoMonto}
          onChange={(e) => setGastoMonto(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-neutral-800 border border-neutral-700"
        />

        <input
          type="text"
          placeholder="Descripción"
          value={gastoDesc}
          onChange={(e) => setGastoDesc(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-neutral-800 border border-neutral-700"
        />

        <button
          onClick={agregarGasto}
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold"
        >
          - Agregar Gasto
        </button>
      </div>

      {/* RESUMEN DIARIO */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl mb-6">
        <h2 className="text-lg font-semibold mb-4 text-indigo-400">Resumen Diario</h2>

        <p>Ingresos: <span className="text-green-400 font-bold">${totalIngresos.toFixed(2)}</span></p>
        <p>Gastos: <span className="text-red-400 font-bold">${totalGastos.toFixed(2)}</span></p>
        <p>Saldo: <span className="text-yellow-400 font-bold">${saldo.toFixed(2)}</span></p>
      </div>

      {/* RESUMEN TOTAL */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl mb-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-400">Resumen Total General</h2>

        <p>Ingresos Totales: <span className="text-green-400 font-bold">${ingresoTotal.toFixed(2)}</span></p>
        <p>Gastos Totales: <span className="text-red-400 font-bold">${gastoTotal.toFixed(2)}</span></p>
        <p>Saldo Total: <span className="text-yellow-400 font-bold">${saldoTotal.toFixed(2)}</span></p>
      </div>

      {/* GRAFICA */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-4 text-indigo-400">Gráfica</h2>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dataGrafico}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Line type="monotone" dataKey="valor" stroke="#7dd3fc" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
