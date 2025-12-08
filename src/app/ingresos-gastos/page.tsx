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

  // Datos principales
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);

  // Ingreso
  const [montoIngreso, setMontoIngreso] = useState("");
  const [descripcionIngreso, setDescripcionIngreso] = useState("");

  // Gasto
  const [montoGasto, setMontoGasto] = useState("");
  const [categoriaGasto, setCategoriaGasto] = useState("");
  const [subcategoriaGasto, setSubcategoriaGasto] = useState("");
  const [fechaGasto, setFechaGasto] = useState(today); // <<< NUEVA FECHA PARA GASTO

  // Categorías dinámicas
  const [categorias, setCategorias] = useState<string[]>([]);
  const [subcategorias, setSubcategorias] = useState<string[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState("");

  // Totales
  const [totalGlobalIngresos, setTotalGlobalIngresos] = useState(0);
  const [totalGlobalGastos, setTotalGlobalGastos] = useState(0);

  // Helpers
  const toArray = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Object.values(data);
  };

  // -----------------------------
  // Cargar categorías dinámicas
  // -----------------------------
  const cargarCategorias = async () => {
    const ref = collection(db, "categorias");
    const snap = await getDocs(ref);
    const lista = snap.docs.map((d) => d.id);
    setCategorias(lista);
  };

  const cargarSubcategorias = async (categoria: string) => {
    if (!categoria) return setSubcategorias([]);
    const ref = doc(db, "subcategorias", categoria);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setSubcategorias(snap.data().lista || []);
    } else {
      setSubcategorias([]);
    }
  };

  // Guardar nueva categoría
  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;

    await setDoc(doc(db, "categorias", nuevaCategoria), {
      nombre: nuevaCategoria,
    });

    setNuevaCategoria("");
    cargarCategorias();
  };

  // Guardar nueva subcategoría
  const agregarSubcategoria = async () => {
    if (!nuevaSubcategoria.trim() || !categoriaGasto) return;

    const ref = doc(db, "subcategorias", categoriaGasto);
    const snap = await getDoc(ref);

    let lista = snap.exists() ? snap.data().lista || [] : [];
    lista.push(nuevaSubcategoria);

    await setDoc(ref, { lista });
    setNuevaSubcategoria("");

    cargarSubcategorias(categoriaGasto);
  };

  // -----------------------------
  // Cargar inicio
  // -----------------------------
  useEffect(() => {
    const cargarInicio = async () => {
      await cargarCategorias();

      const ref = collection(db, "finanzas");
      const snap = await getDocs(ref);

      let sumaIng = 0;
      let sumaGas = 0;

      snap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        sumaIng += toArray(d.ingresos).reduce(
          (acc, i) => acc + (i.monto || 0),
          0
        );
        sumaGas += toArray(d.gastos).reduce(
          (acc, g) => acc + (g.monto || 0),
          0
        );
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
  // Agregar INGRESO
  // -----------------------------
  const agregarIngreso = async () => {
    if (!montoIngreso || !descripcionIngreso.trim()) return;

    const nuevo = {
      descripcion: descripcionIngreso,
      fecha,
      monto: Number(montoIngreso),
    };

    const nuevos = [...ingresos, nuevo];

    await setDoc(
      doc(db, "finanzas", fecha),
      { ingresos: nuevos },
      { merge: true }
    );

    setIngresos(nuevos);
    setTotalGlobalIngresos((prev) => prev + nuevo.monto);

    setMontoIngreso("");
    setDescripcionIngreso("");
  };

  // -----------------------------
  // Agregar GASTO (con fecha propia)
  // -----------------------------
  const agregarGasto = async () => {
    if (!montoGasto || !categoriaGasto) return;

    const nuevo = {
      fecha: fechaGasto, // <<< FECHA PERSONALIZADA
      monto: Number(montoGasto),
      categoria: categoriaGasto,
      subcategoria: subcategoriaGasto || "General",
    };

    const nuevos = [...gastos, nuevo];

    await setDoc(
      doc(db, "finanzas", fecha),
      { gastos: nuevos },
      { merge: true }
    );

    setGastos(nuevos);
    setTotalGlobalGastos((prev) => prev + nuevo.monto);

    setMontoGasto("");
    setSubcategoriaGasto("");
    setFechaGasto(today); // reinicia fecha
  };

  // Totales
  const totalIngresos = ingresos.reduce((acc, i) => acc + i.monto, 0);
  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
  const saldo = totalIngresos - totalGastos;
  const saldoGlobal = totalGlobalIngresos - totalGlobalGastos;

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4 text-center">
        Finanzas – Ingresos y Gastos
      </h1>

      {/* FECHA PRINCIPAL */}
      <label className="font-semibold">Fecha:</label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full p-2 mb-6 bg-neutral-900 border border-neutral-700 rounded"
      />

      {/* GESTIÓN DE CATEGORÍAS */}
      <div className="bg-neutral-900 p-4 mb-6 rounded border border-neutral-800">
        <h2 className="text-lg text-blue-300 font-bold mb-2">
          Categorías dinámicas
        </h2>

        {/* AGREGAR CATEGORÍA */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            placeholder="Nueva categoría"
            className="flex-1 p-2 bg-neutral-800 border border-neutral-700 rounded"
          />
          <button
            onClick={agregarCategoria}
            className="px-4 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Añadir
          </button>
        </div>

        {/* AGREGAR SUBCATEGORÍA */}
        <div className="flex gap-2">
          <select
            value={categoriaGasto}
            onChange={(e) => {
              setCategoriaGasto(e.target.value);
              cargarSubcategorias(e.target.value);
            }}
            className="flex-1 p-2 bg-neutral-800 border border-neutral-700 rounded"
          >
            <option value="">Seleccione categoría</option>
            {categorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            type="text"
            value={nuevaSubcategoria}
            onChange={(e) => setNuevaSubcategoria(e.target.value)}
            placeholder="Nueva subcategoría"
            className="flex-1 p-2 bg-neutral-800 border border-neutral-700 rounded"
          />

          <button
            onClick={agregarSubcategoria}
            className="px-4 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Añadir
          </button>
        </div>
      </div>

      {/* GRID INGRESOS/GASTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* INGRESOS */}
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
                <p className="text-neutral-500 text-xs mt-1">Fecha: {i.fecha}</p>
              </div>
            ))}
          </div>
        </div>

        {/* GASTOS */}
        <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-xl">
          <h2 className="text-xl text-red-400 mb-2">Registrar gasto</h2>

          <input
            type="number"
            placeholder="Monto"
            value={montoGasto}
            onChange={(e) => setMontoGasto(e.target.value)}
            className="w-full p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded"
          />

          {/* FECHA PARA EL GASTO */}
          <input
            type="date"
            value={fechaGasto}
            onChange={(e) => setFechaGasto(e.target.value)}
            className="w-full p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded"
          />

          {/* CATEGORÍA */}
          <select
            value={categoriaGasto}
            onChange={(e) => {
              setCategoriaGasto(e.target.value);
              cargarSubcategorias(e.target.value);
            }}
            className="w-full p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded"
          >
            <option value="">Seleccione categoría</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* SUBCATEGORÍA */}
          <select
            value={subcategoriaGasto}
            onChange={(e) => setSubcategoriaGasto(e.target.value)}
            className="w-full p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded"
          >
            <option value="">Seleccione subcategoría</option>
            {subcategorias.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

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
                <p className="text-yellow-300 text-sm">
                  {g.categoria} → {g.subcategoria}
                </p>
                <p className="text-neutral-500 text-xs mt-1">
                  Fecha: {g.fecha}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SALDO DEL DÍA */}
      <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-xl text-center mt-8">
        <h2 className="text-xl font-bold mb-2 text-yellow-300">
          Saldo del día
        </h2>

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

      {/* SALDO GLOBAL */}
      <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-xl text-center mt-6">
        <h2 className="text-xl font-bold mb-2 text-blue-300">
          Resumen global
        </h2>

        <p className="text-green-400 text-lg">
          Ingresos totales:{" "}
          <strong>${totalGlobalIngresos.toFixed(2)}</strong>
        </p>

        <p className="text-red-400 text-lg">
          Gastos totales:{" "}
          <strong>${totalGlobalGastos.toFixed(2)}</strong>
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
