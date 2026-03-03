"use client";
import { useEffect, useState } from "react";

function getDiaHoy() {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const hoy = new Date();
  const diaSemana = dias[hoy.getDay()];
  const diaMes = hoy.getDate().toString().padStart(2, '0');
  const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
  const anio = hoy.getFullYear();
  return { nombre: `${diaSemana}-${diaMes}-${mes}-${anio}.pdf`, texto: `${diaSemana} ${hoy.getDate()} de ${meses[hoy.getMonth()]}` };
}

export default function EscuelaSabaticaPage() {
  const { nombre, texto } = getDiaHoy();
  const pdfUrl = `/escuela-sabatica/${nombre}`;
  const [diaExtraido, setDiaExtraido] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");

  useEffect(() => {
    async function fetchDia() {
      try {
        const res = await fetch(`/api/dia-escuela-sabatica?nombre=${encodeURIComponent(nombre)}`);
        const data = await res.json();
        if (data.dias && Array.isArray(data.dias) && data.dias.length > 0) {
          // Buscar el día que coincide con hoy
          const encontrado = data.dias.find((d: string) => d.toLowerCase() === texto.toLowerCase());
          setDiaExtraido(encontrado || `No se encontró el día de hoy (${texto}) en el PDF`);
          setApiError("");
        } else {
          setDiaExtraido("");
          setApiError(`No se encontró el día de hoy (${texto}) en el PDF`);
        }
      } catch {
        setDiaExtraido("");
        setApiError(`No se encontró el archivo PDF para hoy (${nombre})`);
      }
    }
    fetchDia();
  }, [nombre, texto]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row">
      <aside className="w-full md:max-w-xs bg-neutral-900 p-4 md:p-8 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col gap-6 items-start">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-cyan-400">Escuela Sabática</h1>
        <div className="mb-4 md:mb-6">
          <span className="block text-lg md:text-xl font-bold text-cyan-300 mb-1">Lección de hoy</span>
          <span className="text-base md:text-lg text-white font-bold">{diaExtraido || apiError || texto}</span>
          <span className="block text-neutral-400 mt-1">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </aside>
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center bg-neutral-950 gap-4 md:gap-6 p-2 md:p-0">
        <iframe
          src={pdfUrl}
          title="PDF Viewer"
          style={{ width: '100%', maxWidth: '700px', height: '70vh', minHeight: '400px', background: 'white', boxShadow: '0 0 24px #0004', borderRadius: '1rem' }}
          className="border-0 mb-4 md:mb-0"
        />
        <div className="w-full max-w-xs md:w-[300px]">
          <span className="block text-base font-semibold text-cyan-400 mb-2">Preguntas del Sábado</span>
          <iframe
            src="/escuela-sabatica/preguntas-sabado-07-2026.pdf"
            title="Preguntas Sábado"
            style={{ width: '100%', height: '350px', background: 'white', borderRadius: '0.5rem', boxShadow: '0 0 12px #0002' }}
            className="border-0"
          />
        </div>
      </section>
    </main>
  );
}
