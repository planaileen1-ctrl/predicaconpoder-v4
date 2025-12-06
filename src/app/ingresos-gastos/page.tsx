"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

type Cliente = {
  id: string;
  nombre: string;
  cantidad: number;
  total: number;
  entregado: boolean;
  telefono?: string;
  producto: string;
};

export default function VentasComidaPage() {
  const today = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(today);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productoDelDia, setProductoDelDia] = useState<"Bollo" | "Morocho">("Bollo");

  // FORM CLIENTE
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [telefono, setTelefono] = useState("");

  // PRECIOS (pueden editarse si quieres)
  const [precioBollo, setPrecioBollo] = useState(2.25);
  const [precioCombo, setPrecioCombo] = useState(3.0);
  const [precioMorocho, setPrecioMorocho] = useState(2.25);

  // TIPO SELECCIONADO EN EL FORMULARIO
  const [productoTipo, setProductoTipo] = useState("solo");

  // CARGAR DATOS DE FIRESTORE
  useEffect(() => {
    cargar();
  }, [fecha]);

  const cargar = async () => {
    const ref = doc(db, "ventas_comida", fecha);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      setClientes(data.clientes ?? []);

      // LEE PRODUCTO DEL DÍA DESDE FIRESTORE
      if (data.productoDelDia) {
        setProductoDelDia(data.productoDelDia);
      }
    } else {
      setClientes([]);
      setProductoDelDia("Bollo");
    }
  };

  // AGREGAR CLIENTE
  const agregarCliente = async () => {
    if (!nombre.trim()) return;

    let precioFinal = 0;
    let nombreProducto = "";

    if (productoDelDia === "Bollo") {
      if (productoTipo === "solo") {
        precioFinal = precioBollo;
        nombreProducto = "Bollo";
      } else {
        precioFinal = precioCombo;
        nombreProducto = "Bollo + arroz + cola";
      }
    }

    if (productoDelDia === "Morocho") {
      precioFinal = precioMorocho;
      nombreProducto = "Morocho";
    }

    const nuevo: Cliente = {
      id: crypto.randomUUID(),
      nombre,
      cantidad,
      total: cantidad * precioFinal,
      entregado: false,
      telefono,
      producto: nombreProducto,
    };

    const nuevos = [...clientes, nuevo];

    await setDoc(
      doc(db, "ventas_comida", fecha),
      {
        clientes: nuevos,
        productoDelDia, // aseguramos que quede guardado
      },
      { merge: true }
    );

    setClientes(nuevos);

    // LIMPIAR FORM
    setNombre("");
    setCantidad(1);
    setTelefono("");
    setProductoTipo("solo");
  };

  // CAMBIAR ESTADO ENTREGADO
  const marcarEntregado = async (id: string) => {
    const nuevos = clientes.map((c) =>
      c.id === id ? { ...c, entregado: !c.entregado } : c
    );

    await setDoc(
      doc(db, "ventas_comida", fecha),
      { clientes: nuevos },
      { merge: true }
    );

    setClientes(nuevos);
  };

  // ELIMINAR CLIENTE
  const eliminarCliente = async (id: string) => {
    const nuevos = clientes.filter((c) => c.id !== id);

    await setDoc(
      doc(db, "ventas_comida", fecha),
      { clientes: nuevos },
      { merge: true }
    );

    setClientes(nuevos);
  };

  const totalIngresos = clientes.reduce((acc, c) => acc + c.total, 0);

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-5">
      <h1 className="text-3xl font-bold mb-4 text-yellow-400">Ventas de Comida</h1>

      {/* FECHA */}
      <div className="mb-4">
        <label>Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full mt-1 p-2 rounded bg-neutral-900 border border-neutral-700"
        />
      </div>

      {/* PRODUCTO DEL DÍA */}
      <div className="mb-6 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
        <label className="text-sm">Producto del día</label>
        <select
          value={productoDelDia}
          onChange={(e) => setProductoDelDia(e.target.value as any)}
          className="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700"
        >
          <option value="Bollo">Bollo</option>
          <option value="Morocho">Morocho</option>
        </select>
      </div>

      {/* FORMULARIO CLIENTE */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl mb-6">
        <h2 className="text-lg font-semibold mb-2 text-green-400">Registrar Cliente</h2>

        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          className="w-full mb-2 p-2 rounded bg-neutral-800 border border-neutral-700"
        />

        <input
          type="number"
          value={cantidad}
          min={1}
          onChange={(e) => setCantidad(Number(e.target.value))}
          placeholder="Cantidad"
          className="w-full mb-2 p-2 rounded bg-neutral-800 border border-neutral-700"
        />

        <input
          type="text"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Teléfono"
          className="w-full mb-2 p-2 rounded bg-neutral-800 border border-neutral-700"
        />

        {/* OPCIONES DINÁMICAS SEGÚN PRODUCTO DEL DÍA */}
        {productoDelDia === "Bollo" && (
          <>
            <label className="text-sm mt-2 block">Tipo de producto</label>
            <select
              value={productoTipo}
              onChange={(e) => setProductoTipo(e.target.value)}
              className="w-full p-2 mt-1 rounded bg-neutral-800 border border-neutral-700"
            >
              <option value="solo">Solo Bollo – ${precioBollo}</option>
              <option value="combo">Bollo + arroz + cola – ${precioCombo}</option>
            </select>

            {/* PRECIOS EDITABLES */}
            <div className="flex gap-2 mt-3">
              <input
                type="number"
                step="0.01"
                value={precioBollo}
                onChange={(e) => setPrecioBollo(Number(e.target.value))}
                placeholder="Precio bollo"
                className="w-1/2 p-2 rounded bg-neutral-800 border border-neutral-700"
              />

              <input
                type="number"
                step="0.01"
                value={precioCombo}
                onChange={(e) => setPrecioCombo(Number(e.target.value))}
                placeholder="Precio combo"
                className="w-1/2 p-2 rounded bg-neutral-800 border border-neutral-700"
              />
            </div>
          </>
        )}

        {productoDelDia === "Morocho" && (
          <>
            <label className="text-sm mt-2 block">Precio Morocho</label>
            <input
              type="number"
              step="0.01"
              value={precioMorocho}
              onChange={(e) => setPrecioMorocho(Number(e.target.value))}
              className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
            />
          </>
        )}

        <button
          onClick={agregarCliente}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold"
        >
          + Agregar Cliente
        </button>
      </div>

      {/* LISTA DE CLIENTES */}
      <h2 className="text-xl font-bold mb-3">Clientes añadidos</h2>

      {clientes.map((c) => (
        <div
          key={c.id}
          className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl mb-3 flex justify-between items-center"
        >
          <div>
            <p className="font-bold">{c.nombre}</p>
            <p className="text-sm text-neutral-400">
              {c.cantidad} {c.producto} – ${c.total.toFixed(2)}
            </p>
            <p className="text-xs text-neutral-500">{c.telefono}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => marcarEntregado(c.id)}
              className={`px-3 py-1 rounded ${
                c.entregado ? "bg-green-700" : "bg-neutral-700"
              }`}
            >
              ✔
            </button>

            <button
              onClick={() => eliminarCliente(c.id)}
              className="px-3 py-1 rounded bg-red-600"
            >
              🗑
            </button>
          </div>
        </div>
      ))}

      {/* TOTAL */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl mt-6">
        <h2 className="text-lg font-semibold mb-2 text-yellow-300">
          Total del Día: ${totalIngresos.toFixed(2)}
        </h2>
      </div>
    </main>
  );
}
