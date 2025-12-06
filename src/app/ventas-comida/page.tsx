"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  collection,
  getDocs,
} from "firebase/firestore";

type Cliente = {
  id: number;
  nombre: string;
  cantidad: number;
  total: number;
  entregado: boolean;
  telefono: string;
  producto: string;
};

type Contacto = {
  nombre: string;
  telefono: string;
};

type Filtro = "todos" | "entregados" | "pendientes";

const PRODUCTOS_BASE = [
  "Morocho",
  "Bollo",
  "Encebollado",
  "Arroz con pollo",
  "Seco de pollo",
  "Seco de carne",
  "Tortillas",
  "Bebidas",
  "Otro",
];

export default function VentasComidaPage() {
  const router = useRouter();

  const [fecha, setFecha] = useState(new Date().toISOString().substring(0, 10));
  const [inversion, setInversion] = useState<number | string>("");
  const [costoUnitario, setCostoUnitario] = useState<number | string>("");

  // 🟩 Stock manual del día
  const [stockTotal, setStockTotal] = useState<number | string>("");

  const [producto, setProducto] = useState<string>("Morocho");
  const [productoOtro, setProductoOtro] = useState<string>("");

  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState<number | string>("");
  const [telefono, setTelefono] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [modoEntrega, setModoEntrega] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const [cargando, setCargando] = useState(false);

  // CONTACTOS
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState("");

  // ======================
  // HELPERS
  // ======================
  const normalizarTelefono = (raw: string): string => {
    const digits = (raw || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("593")) return digits;
    if (digits.startsWith("0") && digits.length === 10)
      return "593" + digits.slice(1);
    if (digits.length === 9) return "593" + digits;
    return digits;
  };

  const getProductoTexto = () => {
    if (producto === "Otro") return productoOtro.trim() || "tu pedido";
    return producto;
  };

  // ======================
  // CARGAR CONTACTOS
  // ======================
  const cargarContactos = async () => {
    try {
      const ref = collection(db, "contactos_clientes");
      const snap = await getDocs(ref);
      setContactos(snap.docs.map((d) => d.data() as Contacto));
    } catch (err) {
      console.error("Error cargando contactos:", err);
    }
  };

  useEffect(() => {
    cargarContactos();
  }, []);

  // ======================
  // IMPORTAR CSV
  // ======================
  const handleCSVUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async ({ target }) => {
      try {
        const text = (target?.result as string) || "";

        const separador = text.includes(";") ? ";" : ",";
        const lineas = text.trim().split(/\r?\n/);

        if (lineas.length <= 1) {
          alert("El CSV no tiene datos suficientes.");
          return;
        }

        const header = lineas[0]
          .split(separador)
          .map((h) =>
            h
              .trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
          );

        const posiblesNombre = ["nombre", "nombres", "cliente", "contacto"];
        const posiblesTelefono = [
          "telefono",
          "telefono1",
          "celular",
          "cel",
          "whatsapp",
          "numero",
          "phone",
        ];

        const idxNombre = header.findIndex((h) =>
          posiblesNombre.includes(h)
        );
        const idxTelefono = header.findIndex((h) =>
          posiblesTelefono.includes(h)
        );

        if (idxNombre === -1 || idxTelefono === -1) {
          alert(
            "No se encontraron columnas adecuadas para nombre y teléfono.\nAsegúrate de incluir al menos una columna de nombre y teléfono."
          );
          return;
        }

        const contactosAGuardar: Contacto[] = [];

        for (let i = 1; i < lineas.length; i++) {
          const row = lineas[i];
          if (!row.trim()) continue;

          const cols = row.split(separador);

          const nombre = (cols[idxNombre] || "").trim();
          const telefonoRaw = (cols[idxTelefono] || "").trim();

          if (!nombre || !telefonoRaw) continue;

          const telNorm = normalizarTelefono(telefonoRaw);

          contactosAGuardar.push({
            nombre,
            telefono: telNorm,
          });
        }

        for (const c of contactosAGuardar) {
          await setDoc(
            doc(db, "contactos_clientes", c.telefono),
            c,
            { merge: true }
          );
        }

        alert("Contactos importados correctamente.");
        await cargarContactos();
      } catch (err) {
        console.error("Error importando CSV:", err);
        alert("Error al importar el CSV.");
      }
    };

    reader.readAsText(file);
  };

  // ======================
  // CARGAR DATOS DEL DÍA
  // ======================
  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const ref = doc(db, "ventas_comida", fecha);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() as any;

          setInversion(data.inversion ?? "");
          setCostoUnitario(data.costoUnitario ?? "");
          setProducto(data.producto ?? "Morocho");
          setProductoOtro(data.productoOtro ?? "");
          setStockTotal(data.stockTotal ?? "");

          const rawClientes: any[] = data.clientes ?? [];

          // 🔥 Mapeo corregido para total
          const mapeados: Cliente[] = rawClientes.map((c: any) => {
            const cantidad = Number(c.cantidad) || 0;

            const total =
              c.total !== undefined && c.total !== null && c.total !== ""
                ? Number(c.total)
                : cantidad * Number(costoUnitario || 0);

            return {
              id: c.id,
              nombre: c.nombre,
              cantidad,
              total,
              entregado: !!c.entregado,
              telefono: c.telefono ?? "",
              producto: c.producto ?? getProductoTexto(),
            };
          });

          setClientes(mapeados);
        } else {
          setInversion("");
          setCostoUnitario("");
          setProducto("Morocho");
          setProductoOtro("");
          setStockTotal("");
          setClientes([]);
        }
      } catch (err) {
        console.error("Error al cargar:", err);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [fecha]);

  // ======================
  // CÁLCULOS
  // ======================
  const totalVendido = clientes.reduce((acc, c) => acc + Number(c.total), 0);
  const ganancia = totalVendido - (Number(inversion) || 0);

  const comidasVendidas = clientes.reduce((acc, c) => acc + c.cantidad, 0);
  const comidasRestantesStock =
    (Number(stockTotal) || 0) - comidasVendidas;

  const entregados = clientes.filter((c) => c.entregado).length;
  const pendientes = clientes.length - entregados;

  const clientesFiltrados = clientes.filter((c) => {
    if (filtro === "entregados") return c.entregado;
    if (filtro === "pendientes") return !c.entregado;
    return true;
  });

  // ======================
  // SELECCIONAR CONTACTO
  // ======================
  const seleccionarContacto = (telefonoValue: string) => {
    setContactoSeleccionado(telefonoValue);

    if (telefonoValue === "nuevo") {
      setNombre("");
      setTelefono("");
      return;
    }

    const contacto = contactos.find((c) => c.telefono === telefonoValue);
    if (contacto) {
      setNombre(contacto.nombre);
      setTelefono(contacto.telefono);
    }
  };

  // ======================
  // AGREGAR / EDITAR CLIENTE
  // ======================
  const guardarCliente = async () => {
    if (!nombre.trim()) return alert("Ingrese un nombre válido");
    if (!cantidad || Number(cantidad) <= 0)
      return alert("Ingrese una cantidad válida");
    if (!costoUnitario || Number(costoUnitario) <= 0)
      return alert("Debe ingresar el costo unitario");
    if (!telefono.trim())
      return alert("Ingrese un número válido");

    const cant = Number(cantidad);
    const total = cant * Number(costoUnitario);
    const telNorm = normalizarTelefono(telefono);
    const prodTexto = getProductoTexto();

    let nuevos: Cliente[];

    if (editId !== null) {
      nuevos = clientes.map((c) =>
        c.id === editId
          ? {
              ...c,
              nombre,
              cantidad: cant,
              total,
              telefono: telNorm,
              producto: prodTexto,
            }
          : c
      );
      setEditId(null);
    } else {
      nuevos = [
        ...clientes,
        {
          id: Date.now(),
          nombre,
          cantidad: cant,
          total,
          entregado: false,
          telefono: telNorm,
          producto: prodTexto,
        },
      ];
    }

    setClientes(nuevos);

    await setDoc(
      doc(db, "ventas_comida", fecha),
      {
        stockTotal: Number(stockTotal) || 0,
        inversion: Number(inversion) || 0,
        costoUnitario: Number(costoUnitario) || 0,
        producto,
        productoOtro,
        clientes: nuevos,
        actualizadoEn: Timestamp.now(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, "contactos_clientes", telNorm),
      { nombre, telefono: telNorm },
      { merge: true }
    );

    setNombre("");
    setCantidad("");
    setTelefono("");
    setContactoSeleccionado("");
  };

  // ======================
  // EDITAR CLIENTE
  // ======================
  const editarCliente = (cliente: Cliente) => {
    setEditId(cliente.id);
    setNombre(cliente.nombre);
    setCantidad(cliente.cantidad.toString());
    setTelefono(cliente.telefono);
    setContactoSeleccionado("");
  };

  // ======================
  // ELIMINAR CLIENTE
  // ======================
  const eliminarCliente = async (id: number) => {
    const nuevos = clientes.filter((c) => c.id !== id);
    setClientes(nuevos);

    await setDoc(
      doc(db, "ventas_comida", fecha),
      { clientes: nuevos },
      { merge: true }
    );
  };

  // ======================
  // MARCAR ENTREGADO
  // ======================
  const toggleEntrega = async (id: number) => {
    const nuevos = clientes.map((c) =>
      c.id === id ? { ...c, entregado: !c.entregado } : c
    );

    setClientes(nuevos);

    await setDoc(
      doc(db, "ventas_comida", fecha),
      { clientes: nuevos },
      { merge: true }
    );
  };

  // ======================
  // WHATSAPP
  // ======================
  const enviarWhatsApp = (cliente: Cliente) => {
    const tel = normalizarTelefono(cliente.telefono);
    if (!tel) return alert("Teléfono inválido");

    const fechaBonita = fecha.split("-").reverse().join("/");
    const mensaje = encodeURIComponent(
      `Hola ${cliente.nombre}, 👋\n\n` +
        `Te confirmo tu pedido de ${cliente.cantidad} ${cliente.producto} para el día ${fechaBonita}.\n\n` +
        `¡Gracias por tu compra! 🙌`
    );

    window.open(`https://wa.me/${tel}?text=${mensaje}`, "_blank");
  };

  // ======================
  // PDF
  // ======================
  const generarReportePDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <h1>Reporte de Ventas - ${fecha}</h1>
      <p><strong>Producto:</strong> ${getProductoTexto()}</p>
      <p><strong>Unidades disponibles:</strong> ${stockTotal || 0}</p>
      <p><strong>Unidades vendidas:</strong> ${comidasVendidas}</p>
      <p><strong>Unidades restantes:</strong> ${comidasRestantesStock}</p>
      <p><strong>Total vendido:</strong> $${totalVendido.toFixed(2)}</p>
      <p><strong>Ganancia:</strong> $${ganancia.toFixed(2)}</p>
      <hr>
    `);

    win.document.close();
    win.print();
  };

  const imprimirHoja = () => window.print();

  // ======================
  // UI
  // ======================
  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10 flex justify-center">
      <div className="w-full max-w-6xl">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg"
          >
            ← Volver al dashboard
          </button>

          <div className="text-right">
            <p className="text-sm text-neutral-400">Fecha de ventas</p>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg"
            />
          </div>
        </div>

        {/* IMPORTAR CSV */}
        <div className="mb-4 text-sm">
          <p className="text-neutral-300 mb-1">Importar contactos CSV</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="text-xs"
          />
        </div>

        {/* BOTONES SUPERIORES */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <button
            onClick={() => setModoEntrega(!modoEntrega)}
            className="px-4 py-2 bg-teal-600 rounded-lg"
          >
            {modoEntrega ? "Volver a Ventas" : "Ver Entregas"}
          </button>

          <button
            onClick={generarReportePDF}
            className="px-4 py-2 bg-indigo-600 rounded-lg"
          >
            Informe PDF
          </button>

          <button
            onClick={imprimirHoja}
            className="px-4 py-2 bg-emerald-600 rounded-lg"
          >
            Imprimir hoja
          </button>

          <span className="text-sm text-neutral-300">
            Producto del día:{" "}
            <span className="text-teal-300 font-semibold">
              {getProductoTexto()}
            </span>
          </span>
        </div>

        {cargando && (
          <p className="text-neutral-400 text-sm mb-4">
            Cargando datos de la fecha...
          </p>
        )}

        {/* ==================== MODO ENTREGA ==================== */}
        {modoEntrega ? (
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Entregas</h2>
              <div className="text-sm text-neutral-400 text-right">
                <p>Clientes: {clientes.length}</p>
                <p>Entregados: {entregados}</p>
                <p>Pendientes: {pendientes}</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["todos", "entregados", "pendientes"] as Filtro[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1 rounded-lg border ${
                    filtro === f ? "bg-teal-600" : "bg-neutral-800"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Lista de entregas */}
            <div className="space-y-3">
              {clientesFiltrados.length === 0 ? (
                <p className="text-neutral-500">
                  Aún no hay clientes para este filtro.
                </p>
              ) : (
                clientesFiltrados.map((c) => (
                  <div
                    key={c.id}
                    className={`flex justify-between items-center gap-3 p-4 rounded-xl border ${
                      c.entregado
                        ? "bg-green-900 border-green-700"
                        : "bg-neutral-800 border-neutral-700"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">
                        {c.nombre} {c.entregado && "✔"}
                      </p>
                      <p className="text-sm text-neutral-300">
                        {c.cantidad} {c.producto} – ${c.total.toFixed(2)}
                      </p>
                      {c.telefono && (
                        <p className="text-xs text-neutral-400">
                          📱 {c.telefono}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => enviarWhatsApp(c)}
                        className="px-3 py-1 bg-green-600 rounded-lg text-sm"
                      >
                        WhatsApp 📲
                      </button>

                      <button
                        onClick={() => editarCliente(c)}
                        className="px-3 py-1 bg-blue-600 rounded-lg text-sm"
                      >
                        Editar ✏️
                      </button>

                      <input
                        type="checkbox"
                        checked={c.entregado}
                        onChange={() => toggleEntrega(c.id)}
                        className="w-5 h-5 accent-teal-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* ==================== MODO VENTAS ==================== */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* COLUMNA IZQUIERDA */}
            <div>
              {/* COSTOS Y PRODUCTO */}
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Datos de Costos y Producto
                </h2>

                <label className="text-sm">Inversión Total</label>
                <input
                  type="number"
                  value={inversion}
                  onChange={(e) => setInversion(e.target.value)}
                  className="w-full p-2 mb-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                  placeholder="Ej. 50"
                />

                <label className="text-sm">Costo por comida</label>
                <input
                  type="number"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  className="w-full p-2 mb-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                  placeholder="Ej. 2.50"
                />

                <label className="text-sm">Unidades disponibles hoy</label>
                <input
                  type="number"
                  value={stockTotal}
                  onChange={(e) => setStockTotal(e.target.value)}
                  className="w-full p-2 mb-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                  placeholder="Ej. 30"
                />

                <label className="text-sm">Producto del día</label>
                <select
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  className="w-full p-2 mb-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                >
                  {PRODUCTOS_BASE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {producto === "Otro" && (
                  <>
                    <label className="text-sm">Especificar producto</label>
                    <input
                      type="text"
                      value={productoOtro}
                      onChange={(e) => setProductoOtro(e.target.value)}
                      className="w-full p-2 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg"
                      placeholder="Ej. Tamal de pollo"
                    />
                  </>
                )}
              </div>

              {/* FORMULARIO CLIENTE */}
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editId ? "Editar Cliente" : "Registrar Cliente"}
                </h2>

                {/* Selector de contacto */}
                <label className="text-sm">Seleccionar contacto</label>
                <select
                  value={contactoSeleccionado}
                  onChange={(e) => seleccionarContacto(e.target.value)}
                  className="w-full p-2 mb-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                >
                  <option value="">Seleccionar contacto...</option>
                  {contactos.map((c) => (
                    <option key={c.telefono} value={c.telefono}>
                      {c.nombre} — {c.telefono}
                    </option>
                  ))}
                  <option value="nuevo">+ Agregar nuevo contacto</option>
                </select>

                <label className="text-sm">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-2 mb-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                  placeholder="Ej. María"
                />

                <label className="text-sm">WhatsApp del cliente</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full p-2 mb-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                  placeholder="Ej. 0961079919 o +593961079919"
                />

                <label className="text-sm">Cantidad</label>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full p-2 mb-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                  placeholder="Ej. 3"
                />

                <button
                  onClick={guardarCliente}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold"
                >
                  {editId ? "Guardar Cambios" : "Agregar Cliente"}
                </button>
              </div>

              {/* RESUMEN */}
              <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                <h2 className="text-xl font-semibold mb-4">Resumen Final</h2>

                <p>
                  <strong>Producto del día:</strong>{" "}
                  <span className="text-teal-300">{getProductoTexto()}</span>
                </p>

                <p>
                  <strong>Unidades disponibles:</strong>{" "}
                  <span className="text-indigo-400">{stockTotal || 0}</span>
                </p>

                <p>
                  <strong>Unidades vendidas:</strong>{" "}
                  <span className="text-teal-400">{comidasVendidas}</span>
                </p>

                <p>
                  <strong>Unidades restantes:</strong>{" "}
                  <span
                    className={
                      comidasRestantesStock >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {comidasRestantesStock}
                  </span>
                </p>

                <hr className="my-4 border-neutral-700" />

                <p>
                  <strong>Total vendido:</strong>{" "}
                  <span className="text-teal-400">
                    ${totalVendido.toFixed(2)}
                  </span>
                </p>

                <p>
                  <strong>Ganancia:</strong>{" "}
                  <span
                    className={
                      ganancia >= 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    ${ganancia.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>

            {/* COLUMNA DERECHA – CLIENTES AÑADIDOS */}
            <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">Clientes añadidos</h2>

                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setFiltro("todos")}
                    className={`px-2 py-1 rounded-lg border ${
                      filtro === "todos" ? "bg-teal-600" : "bg-neutral-800"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltro("entregados")}
                    className={`px-2 py-1 rounded-lg border ${
                      filtro === "entregados" ? "bg-teal-600" : "bg-neutral-800"
                    }`}
                  >
                    Entregados
                  </button>
                  <button
                    onClick={() => setFiltro("pendientes")}
                    className={`px-2 py-1 rounded-lg border ${
                      filtro === "pendientes"
                        ? "bg-teal-600"
                        : "bg-neutral-800"
                    }`}
                  >
                    Pendientes
                  </button>
                </div>
              </div>

              {clientesFiltrados.length === 0 ? (
                <p className="text-neutral-500">No hay clientes.</p>
              ) : (
                <div className="space-y-3">
                  {clientesFiltrados.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center p-4 bg-neutral-800 border border-neutral-700 rounded-xl gap-3"
                    >
                      <div>
                        <p className="font-semibold text-teal-300">
                          {c.nombre}
                        </p>
                        <p className="text-sm text-neutral-400">
                          {c.cantidad} {c.producto} – ${c.total.toFixed(2)}
                        </p>
                        {c.telefono && (
                          <p className="text-xs text-neutral-400">
                            📱 {c.telefono}
                          </p>
                        )}
                        {c.entregado && (
                          <p className="text-xs text-green-400">
                            ✔ Entregado
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 text-lg">
                        <div className="flex gap-2">
                          <button
                            onClick={() => enviarWhatsApp(c)}
                            className="px-3 py-1 bg-green-600 rounded-lg text-sm"
                          >
                            WhatsApp 📲
                          </button>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => editarCliente(c)}>✏️</button>
                          <button onClick={() => eliminarCliente(c.id)}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
