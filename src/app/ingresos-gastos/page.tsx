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

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [fechaGasto, setFechaGasto] = useState(today); // fecha propia del gasto

  // Categorías dinámicas
  const [categorias, setCategorias] = useState<string[]>([]);
  const [subcategorias, setSubcategorias] = useState<string[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState("");

  // Totales globales
  const [totalGlobalIngresos, setTotalGlobalIngresos] = useState(0);
  const [totalGlobalGastos, setTotalGlobalGastos] = useState(0);

  // WhatsApp
  const [numeroWhatsApp, setNumeroWhatsApp] = useState("");

  // Helper para normalizar arrays
  const toArray = (data: any) =>
    data ? (Array.isArray(data) ? data : Object.values(data)) : [];

  // ============================
  // Cargar Categorías
  // ============================
  const cargarCategorias = async () => {
    const ref = collection(db, "categorias");
    const snap = await getDocs(ref);
    const lista = snap.docs.map((d) => d.id);
    setCategorias(lista);
  };

  const cargarSubcategorias = async (cat: string) => {
    if (!cat) return setSubcategorias([]);

    const ref = doc(db, "subcategorias", cat);
    const snap = await getDoc(ref);

    setSubcategorias(snap.exists() ? snap.data().lista || [] : []);
  };

  // ============================
  // Guardar Categoría / Subcategoría
  // ============================
  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;

    await setDoc(doc(db, "categorias", nuevaCategoria), {
      nombre: nuevaCategoria,
    });

    setNuevaCategoria("");
    cargarCategorias();
  };

  const agregarSubcategoria = async () => {
    if (!nuevaSubcategoria.trim() || !categoriaGasto) return;

    const ref = doc(db, "subcategorias", categoriaGasto);
    const snap = await getDoc(ref);
    const lista = snap.exists() ? snap.data().lista || [] : [];

    lista.push(nuevaSubcategoria);

    await setDoc(ref, { lista });
    setNuevaSubcategoria("");

    cargarSubcategorias(categoriaGasto);
  };

  // ============================
  // Cargar Inicio
  // ============================
  useEffect(() => {
    const cargarInicio = async () => {
      await cargarCategorias();

      const ref = collection(db, "finanzas");
      const snap = await getDocs(ref);

      let sumaIng = 0;
      let sumaGas = 0;

      snap.docs.forEach((d) => {
        const data = d.data();
        sumaIng += toArray(data.ingresos).reduce(
          (acc: number, v: any) => acc + (v.monto || 0),
          0
        );
        sumaGas += toArray(data.gastos).reduce(
          (acc: number, v: any) => acc + (v.monto || 0),
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
      const d = snap.data();
      setIngresos(toArray(d.ingresos));
      setGastos(toArray(d.gastos));
    } else {
      setIngresos([]);
      setGastos([]);
    }
  };

  // ============================
  // Agregar INGRESO
  // ============================
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
    setTotalGlobalIngresos((p) => p + nuevo.monto);

    setMontoIngreso("");
    setDescripcionIngreso("");
  };

  // ============================
  // Agregar GASTO
  // ============================
  const agregarGasto = async () => {
    if (!montoGasto || !categoriaGasto) return;

    const nuevo = {
      fecha: fechaGasto,
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
    setTotalGlobalGastos((p) => p + nuevo.monto);

    setMontoGasto("");
    setSubcategoriaGasto("");
    setFechaGasto(today);
  };

  // ============================
  // Totales
  // ============================
  const totalIngresos = ingresos.reduce(
    (acc, i) => acc + (i.monto || 0),
    0
  );
  const totalGastos = gastos.reduce(
    (acc, g) => acc + (g.monto || 0),
    0
  );
  const saldo = totalIngresos - totalGastos;
  const saldoGlobal = totalGlobalIngresos - totalGlobalGastos;

  // ============================
  // WhatsApp — SOLO DÍA
  // ============================
  const enviarDiaWhatsApp = () => {
    if (!numeroWhatsApp.trim()) {
      alert("Ingresa un número válido.");
      return;
    }

    let msg = `📅 *Finanzas del día ${fecha}*\n\n`;

    msg += "➕ *INGRESOS:*\n";
    if (ingresos.length === 0) {
      msg += " (Sin ingresos registrados)\n";
    } else {
      ingresos.forEach((i) => {
        msg += `+ $${i.monto} — ${i.descripcion}\n`;
      });
    }
    msg += `*TOTAL INGRESOS:* $${totalIngresos.toFixed(2)}\n\n`;

    msg += "➖ *GASTOS:*\n";
    if (gastos.length === 0) {
      msg += " (Sin gastos registrados)\n";
    } else {
      gastos.forEach((g) => {
        msg += `- $${g.monto} — ${g.categoria} → ${g.subcategoria}\n`;
      });
    }
    msg += `*TOTAL GASTOS:* $${totalGastos.toFixed(2)}\n\n`;

    msg += `💰 *Saldo del día:* $${saldo.toFixed(2)}`;

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
      msg
    )}`;
    window.open(url, "_blank");
  };

  // ============================
  // WhatsApp — TODO EL HISTORIAL
  // ============================
  const enviarTodoWhatsApp = async () => {
    if (!numeroWhatsApp.trim()) {
      alert("Ingresa un número válido.");
      return;
    }

    const ref = collection(db, "finanzas");
    const snap = await getDocs(ref);

    if (snap.empty) {
      alert("No hay registros.");
      return;
    }

    let msg = "📘 *RESUMEN COMPLETO DE FINANZAS*\n\n";

    let totalIng = 0;
    let totalGas = 0;

    const fechas = snap.docs.map((d) => d.id).sort();

    for (const f of fechas) {
      const d = snap.docs.find((x) => x.id === f)!.data();

      const ing = toArray(d.ingresos);
      const gas = toArray(d.gastos);

      const sumIng = ing.reduce(
        (acc: number, i: any) => acc + (i.monto || 0),
        0
      );
      const sumGas = gas.reduce(
        (acc: number, i: any) => acc + (i.monto || 0),
        0
      );

      totalIng += sumIng;
      totalGas += sumGas;

      msg += `📅 *${f}*\n`;
      msg += "➕ INGRESOS:\n";
      if (ing.length === 0) {
        msg += "  (Sin ingresos)\n";
      } else {
        ing.forEach((i: any) => {
          msg += `  + $${i.monto} — ${i.descripcion}\n`;
        });
      }
      msg += `Subtotal ingresos: *$${sumIng.toFixed(2)}*\n`;

      msg += "➖ GASTOS:\n";
      if (gas.length === 0) {
        msg += "  (Sin gastos)\n";
      } else {
        gas.forEach((g: any) => {
          msg += `  - $${g.monto} — ${g.categoria} → ${g.subcategoria}\n`;
        });
      }
      msg += `Subtotal gastos: *$${sumGas.toFixed(2)}*\n`;

      msg += `🧮 Saldo del día: *$${(sumIng - sumGas).toFixed(2)}*\n\n`;
    }

    msg += "=====================\n";
    msg += `📊 *TOTAL INGRESOS:* $${totalIng.toFixed(2)}\n`;
    msg += `📉 *TOTAL GASTOS:* $${totalGas.toFixed(2)}\n`;
    msg += `💰 *SALDO GLOBAL:* $${(totalIng - totalGas).toFixed(2)}\n`;

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
      msg
    )}`;
    window.open(url, "_blank");
  };

  // ============================
  // GENERAR PDF DEL DÍA
  // ============================
  const generarPDF = () => {
    const docPDF = new jsPDF();

    docPDF.text(`Finanzas del día ${fecha}`, 14, 15);

    // Tabla de ingresos
    autoTable(docPDF, {
      startY: 25,
      head: [["Descripción", "Monto"]],
      body: ingresos.map((i) => [i.descripcion, `$${i.monto}`]),
      theme: "grid",
      headStyles: { fillColor: [40, 150, 40] },
    });

    const finalY = (docPDF as any).lastAutoTable
      ? (docPDF as any).lastAutoTable.finalY + 10
      : 40;

    // Tabla de gastos
    autoTable(docPDF, {
      startY: finalY,
      head: [["Categoría", "Subcategoría", "Monto"]],
      body: gastos.map((g) => [g.categoria, g.subcategoria, `$${g.monto}`]),
      theme: "grid",
      headStyles: { fillColor: [200, 40, 40] },
    });

    docPDF.save(`finanzas-${fecha}.pdf`);
  };

  // ============================
  // RENDER
  // ============================
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4 text-center">
        Finanzas – Ingresos y Gastos
      </h1>

      {/* VOLVER AL DASHBOARD */}
      <div className="mb-4">
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg hover:bg-neutral-700 transition text-sm"
        >
          ← Regresar al Dashboard
        </button>
      </div>

      {/* FECHA PRINCIPAL */}
      <label className="font-semibold">Fecha:</label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full p-2 mb-6 bg-neutral-900 border border-neutral-700 rounded"
      />

      {/* CATEGORÍAS DINÁMICAS */}
      <div className="bg-neutral-900 p-4 mb-6 rounded border border-neutral-800">
        <h2 className="text-lg text-blue-300 font-bold mb-2">
          Categorías dinámicas
        </h2>

        {/* Nueva categoría */}
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

        {/* Nueva subcategoría */}
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

      {/* GRID INGRESOS / GASTOS */}
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
                <p className="text-neutral-500 text-xs mt-1">
                  Fecha: {i.fecha}
                </p>
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

          {/* FECHA DEL GASTO */}
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

      {/* EXPORTAR: WHATSAPP + PDF */}
      <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-xl text-center mt-6 mb-10">
        <h2 className="text-xl font-bold text-green-300 mb-3">
          Exportar / Compartir
        </h2>

        <input
          type="text"
          placeholder="Número WhatsApp (ej: 593987654321)"
          value={numeroWhatsApp}
          onChange={(e) => setNumeroWhatsApp(e.target.value)}
          className="w-full p-2 bg-neutral-800 border border-neutral-700 mb-4 rounded"
        />

        <button
          onClick={enviarDiaWhatsApp}
          className="w-full bg-green-600 hover:bg-green-700 p-2 rounded-xl font-bold mb-2"
        >
          📤 Enviar SOLO este día
        </button>

        <button
          onClick={enviarTodoWhatsApp}
          className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded-xl font-bold mb-2"
        >
          📘 Enviar TODO el historial
        </button>

        <button
          onClick={generarPDF}
          className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded-xl font-bold"
        >
          📄 Descargar PDF del día
        </button>
      </div>
    </main>
  );
}
