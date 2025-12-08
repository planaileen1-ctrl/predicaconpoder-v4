"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";

export default function FinanzasPage() {
  const today = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState("");

  const [ingresos, setIngresos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);

  const [montoIngreso, setMontoIngreso] = useState("");
  const [descripcionIngreso, setDescripcionIngreso] = useState("");

  const [montoGasto, setMontoGasto] = useState("");
  const [descripcionGasto, setDescripcionGasto] = useState("");

  const [totalGlobalIngresos, setTotalGlobalIngresos] = useState(0);
  const [totalGlobalGastos, setTotalGlobalGastos] = useState(0);

  // -----------------------------
  // Convertir objetos → arrays
  // -----------------------------
  const toArray = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Object.values(data);
  };

  // -----------------------------
  // Cargar inicio (totales globales + última fecha)
  // -----------------------------
  useEffect(() => {
    const cargarInicio = async () => {
      const ref = collection(db, "finanzas");
      const snap = await getDocs(ref);

      let sumaIng = 0;
      let sumaGas = 0;

      snap.docs.forEach((docSnap) => {
        const d = docSnap.data();

        const ing = toArray(d.ingresos);
        const gas = toArray(d.gastos);

        sumaIng += ing.reduce((acc, i) => acc + (i.monto || 0), 0);
        sumaGas += gas.reduce((acc, g) => acc + (g.monto || 0), 0);
      });

      setTotalGlobalIngresos(sumaIng);
      setTotalGlobalGastos(sumaGas);

      if (!snap.empty) {
        const fechas = snap.docs.map((d) => d.id).sort().reverse();
        setFecha(fechas[0]);
        await cargarPorFecha(fechas[0]);
      } else {
        setFecha(today);
      }
    };

    cargarInicio();
  }, []);

  // -----------------------------
  // Cargar datos por fecha
  // -----------------------------
  useEffect(() => {
    if (fecha) cargarPorFecha(fecha);
  }, [fecha]);

  const cargarPorFecha = async (f: string) => {
    const ref = doc(db, "finanzas", f);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      setIngresos(toArray(data.ingresos));
      setGastos(toArray(data.gastos));
    } else {
      setIngresos([]);
      setGastos([]);
    }
  };

  // -----------------------------
  // Agregar ingreso
  // -----------------------------
  const agregarIngreso = async () => {
    if (!montoIngreso || !descripcionIngreso.trim()) return;

    const nuevo = {
      descripcion: descripcionIngreso,
      fecha,
      monto: Number(montoIngreso),
    };

    const nuevos = [...ingresos, nuevo];

    await setDoc(doc(db, "finanzas", fecha), { ingresos: nuevos }, { merge: true });

    setIngresos(nuevos);
    setTotalGlobalIngresos((prev) => prev + nuevo.monto);

    setMontoIngreso("");
    setDescripcionIngreso("");
  };

  // -----------------------------
  // Agregar gasto
  // -----------------------------
  const agregarGasto = async () => {
    if (!montoGasto || !descripcionGasto.trim()) return;

    const nuevo = {
      descripcion: descripcionGasto,
      fecha,
      monto: Number(montoGasto),
    };

    const nuevos = [...gastos, nuevo];

    await setDoc(doc(db, "finanzas", fecha), { gastos: nuevos }, { merge: true });

    setGastos(nuevos);
    setTotalGlobalGastos((prev) => prev + nuevo.monto);

    setMontoGasto("");
    setDescripcionGasto("");
  };

  // -----------------------------
  // Totales del día
  // -----------------------------
  const totalIngresos = ingresos.reduce((acc, i) => acc + (i.monto || 0), 0);
  const totalGastos = gastos.reduce((acc, g) => acc + (g.monto || 0), 0);
  const saldo = totalIngresos - totalGastos;

  const saldoGlobal = totalGlobalIngresos - totalGlobalGastos;

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">

      <h1 className="text-3xl font-bold text-yellow-400 mb-4 text-center">
        Finanzas – Ingresos y Gastos
      </h1>

      {/* FECHA */}
      <label className="font-semibold">Fecha:</label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full p-2 mb-6 bg-neutral-900 border border-neutral-700 rounded"
      />

      {/* GRID DOS COLUMNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* COLUMNA INGRESOS */}
        <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-xl">
          <h2 className="text-xl text-green-400 mb-2">Registrar ingreso</h2>

          <input
            type="number"
            placeholder="Monto"
            value={montoIngreso}
            onChange={(e) => setMontoIngreso(e.target.value)}
            className="w-full p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded"
          />

          <input
            type="text"
            placeholder="Descripción"
            value={descripcionIngreso}
            onChange={(e) => setDescripcionIngreso(e.target.value)}
            className="w-full p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded"
          />

          <button
            onClick={agregarIngreso}
            className="w-full bg-green-600 hover:bg-green-700 p-2 rounded-lg font-semibold"
          >
            + Agregar ingreso
          </button>

          <div className="mt-4 max-h-80 overflow-y-auto pr-2">
            {ingresos.map((i, idx) => (
              <div
                key={idx}
                className="bg-neutral-800 p-3 mb-2 rounded border border-neutral-700"
              >
                <p className="font-bold text-green-300">+ ${i.monto}</p>
                <p className="text-neutral-400 text-sm">{i.descripcion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA GASTOS */}
        <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-xl">
          <h2 className="text-xl text-red-400 mb-2">Registrar gasto</h2>

          <input
            type="number"
            placeholder="Monto"
            value={montoGasto}
            onChange={(e) => setMontoGasto(e.target.value)}
            className="w-full p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded"
          />

          <input
            type="text"
            placeholder="Motivo"
            value={descripcionGasto}
            onChange={(e) => setDescripcionGasto(e.target.value)}
            className="w-full p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded"
          />

          <button
            onClick={agregarGasto}
            className="w-full bg-red-600 hover:bg-red-700 p-2 rounded-lg font-semibold"
          >
            – Agregar gasto
          </button>

          <div className="mt-4 max-h-80 overflow-y-auto pr-2">
            {gastos.map((g, idx) => (
              <div
                key={idx}
                className="bg-neutral-800 p-3 mb-2 rounded border border-neutral-700"
              >
                <p className="font-bold text-red-300">– ${g.monto}</p>
                <p className="text-neutral-400 text-sm">{g.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SALDO DEL DÍA */}
      <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-xl text-center mt-8">
        <h2 className="text-xl font-bold mb-2 text-yellow-300">Saldo del día</h2>

        <p className="text-green-400 text-lg">
          Ingresos: <strong>${totalIngresos.toFixed(2)}</strong>
        </p>

        <p className="text-red-400 text-lg">
          Gastos: <strong>${totalGastos.toFixed(2)}</strong>
        </p>

        <h3
          className={`mt-3 text-2xl font-bold ${
            saldo >= 0 ? "text-green-300" : "text-red-300"
          }`}
        >
          Saldo: ${saldo.toFixed(2)}
        </h3>
      </div>

      {/* RESUMEN GLOBAL */}
      <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-xl text-center mt-6">
        <h2 className="text-xl font-bold mb-2 text-blue-300">Resumen global</h2>

        <p className="text-green-400 text-lg">
          Ingresos totales: <strong>${totalGlobalIngresos.toFixed(2)}</strong>
        </p>

        <p className="text-red-400 text-lg">
          Gastos totales: <strong>${totalGlobalGastos.toFixed(2)}</strong>
        </p>

        <h3
          className={`mt-3 text-2xl font-bold ${
            saldoGlobal >= 0 ? "text-green-300" : "text-red-300"
          }`}
        >
          Saldo General: ${saldoGlobal.toFixed(2)}
        </h3>
      </div>
    </main>
  );
}
