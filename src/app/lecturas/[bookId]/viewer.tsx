"use client";

import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export default function PdfViewer({ pdfUrl }: { pdfUrl: string }) {
  const layoutPlugin = defaultLayoutPlugin();

  return (
    <div
      style={{
        height: "calc(100vh - 200px)",
        overflow: "auto",
        backgroundColor: "#111",
      }}
    >
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer
          fileUrl={pdfUrl}
          defaultScale={SpecialZoomLevel.PageFit}
          plugins={[layoutPlugin]}
        />
      </Worker>
    </div>
  );
}
