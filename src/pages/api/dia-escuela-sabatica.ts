import { NextApiRequest, NextApiResponse } from "next";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function extractDayFromPDF(buffer: Buffer) {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  let textoCompleto = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    textoCompleto += textContent.items.map((item: any) => item.str).join(" ") + " ";
  }
  const regex = /(Domingo|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado)\s+\d{1,2}\s+de\s+[a-zA-Z]+/gi;
  const diasEncontrados = textoCompleto.match(regex) || [];
  return diasEncontrados;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { nombre } = req.query;
  if (!nombre || typeof nombre !== "string") {
    return res.status(400).json({ error: "Falta el nombre del PDF" });
  }
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const pdfPath = path.join(process.cwd(), "public", "escuela-sabatica", nombre);
    const buffer = await fs.readFile(pdfPath);
    const dias = await extractDayFromPDF(buffer);
    res.status(200).json({ dias });
  } catch (err) {
    res.status(404).json({ error: "No se pudo leer el PDF" });
  }
}
