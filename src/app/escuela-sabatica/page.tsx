"use client";
import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker.entry";

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
  const [dia, setDia] = useState<string>("");
  const [pdfError, setPdfError] = useState<string>("");

  useEffect(() => {
    async function extractDayFromPDF() {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        let textoCompleto = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          textoCompleto += textContent.items.map((item: any) => item.str).join(" ") + " ";
        }
        // Buscar todos los días en el texto
        const regex = /(Domingo|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado)\s+\d{1,2}\s+de\s+[a-zA-Z]+/gi;
        const diasEncontrados = textoCompleto.match(regex) || [];
        // Buscar el día que coincide con hoy
        const encontrado = Array.isArray(diasEncontrados)
          ? diasEncontrados.find(d => typeof d === 'string' && typeof texto === 'string' && d.toLowerCase() === texto.toLowerCase())
          : undefined;
        setDia(encontrado || `No se encontró el día de hoy (${texto}) en el PDF`);
        setPdfError("");
      } catch {
        setDia("");
        setPdfError(`No se encontró el archivo PDF para hoy (${nombre})`);
      }
    }
    extractDayFromPDF();
  }, [pdfUrl, nombre, texto]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex">
      <aside className="w-full max-w-xs bg-neutral-900 p-8 border-r border-neutral-800 flex flex-col gap-6 items-start">
        <h1 className="text-3xl font-bold mb-2 text-cyan-400">Escuela Sabática</h1>
        <div className="mb-6">
          <span className="block text-xl font-bold text-cyan-300 mb-1">Lección de hoy</span>
          <span className="text-lg text-white font-bold">{dia || pdfError}</span>
          <span className="block text-neutral-400 mt-1">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </aside>
      <section className="flex-1 flex items-center justify-center bg-neutral-950 gap-6">
        <iframe
          src={pdfUrl}
          title="PDF Viewer"
          style={{ width: 'auto', height: 'auto', minWidth: '600px', minHeight: '90vh', maxWidth: '100%', maxHeight: '100%', background: 'white', boxShadow: '0 0 24px #0004', borderRadius: '1rem' }}
          className="border-0"
        />
        <div className="w-[300px]">
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
