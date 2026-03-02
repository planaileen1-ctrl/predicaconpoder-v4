"use client";
import { useState } from "react";

export default function EscuelaSabaticaPDFPage() {
  const [pdfUrl, setPdfUrl] = useState("");

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex">
      {/* Espacio izquierdo para controles */}
      <aside className="w-full max-w-xs bg-neutral-900 p-8 border-r border-neutral-800 flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">Subir Hoja PDF</h2>
        <input
          type="file"
          accept="application/pdf"
          className="mb-4"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              setPdfUrl(url);
            }
          }}
        />
        <p className="text-neutral-400 text-sm">Selecciona una hoja PDF para visualizarla al lado derecho.</p>
      </aside>
      {/* Espacio derecho para PDF */}
      <section className="flex-1 flex items-center justify-center bg-neutral-950">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="PDF Viewer"
            className="w-full h-[90vh] border-0 rounded-xl shadow-lg bg-white"
          />
        ) : (
          <div className="text-neutral-400 text-lg">No hay PDF cargado.</div>
        )}
      </section>
    </main>
  );
}
