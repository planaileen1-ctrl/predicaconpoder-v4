"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ContenidoAdminDia({ day }: { day: string }) {
  const [titulo, setTitulo] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [nota, setNota] = useState("");
  const [comentario, setComentario] = useState("");
  const [userIdSeleccionado, setUserIdSeleccionado] = useState("");

  // 📝 Preguntas dinámicas (4 por día)
  const [preguntas, setPreguntas] = useState<string[]>(["", "", "", ""]);

  // ==================================================
  // 📄 Cargar PDF + título + preguntas + respuestas
  // ==================================================
  useEffect(() => {
    const cargarDatos = async () => {
      // PDF + título
      const refDia = doc(db, "planAileen_pdfs", `dia-${day}`);
      const snap = await getDoc(refDia);

      if (snap.exists()) {
        const data = snap.data();
        setTitulo(data.titulo || "");
        setPdfUrl(data.url || null);
      }

      // Preguntas del día (si existen)
      const refPreg = doc(db, "planAileen_preguntas", `dia-${day}`);
      const snapPreg = await getDoc(refPreg);

      if (snapPreg.exists()) {
        const dataPreg = snapPreg.data();
        if (Array.isArray(dataPreg.preguntas)) {
          const arr = dataPreg.preguntas as string[];
          setPreguntas([
            arr[0] || "",
            arr[1] || "",
            arr[2] || "",
            arr[3] || "",
          ]);
        }
      }

      // Respuestas del día
      const q = query(
        collection(db, "aileen_respuestas"),
        where("day", "==", Number(day))
      );
      const querySnap = await getDocs(q);

      const lista: any[] = [];
      querySnap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
      setRespuestas(lista);
    };

    cargarDatos();
  }, [day]);

  // ==================================================
  // 📝 Subir PDF y guardar título (automático)
  // ==================================================
  const subirPdf = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `planAileen/pdfs/dia-${day}.pdf`);
      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);
      setPdfUrl(url);

      await setDoc(
        doc(db, "planAileen_pdfs", `dia-${day}`),
        {
          titulo,
          url,
        },
        { merge: true }
      );

      alert("PDF actualizado correctamente ✔");
    } catch (err) {
      console.error(err);
      alert("Error al subir el PDF.");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // 🧾 Guardar preguntas dinámicas
  // ==================================================
  const guardarPreguntas = async () => {
    try {
      await setDoc(
        doc(db, "planAileen_preguntas", `dia-${day}`),
        { preguntas },
        { merge: true }
      );

      alert("Preguntas guardadas correctamente ✔");
    } catch (err) {
      console.error(err);
      alert("Error al guardar preguntas.");
    }
  };

  // ==================================================
  // ⭐ Guardar calificación
  // ==================================================
  const guardarNota = async () => {
    if (!userIdSeleccionado) return alert("Selecciona un usuario.");
    if (Number(nota) < 0 || Number(nota) > 10)
      return alert("La nota debe ser entre 0 y 10.");

    try {
      await setDoc(
        doc(db, "aileen_calificaciones", `${userIdSeleccionado}_dia_${day}`),
        {
          nota: Number(nota),
          comentario,
          userId: userIdSeleccionado,
          day: Number(day),
        },
        { merge: true }
      );

      alert("Calificación guardada ✔");
    } catch (err) {
      console.error(err);
      alert("Error al guardar la calificación.");
    }
  };

  // ==================================================
  // ❌ Eliminar respuesta
  // ==================================================
  const eliminarRespuesta = async (id: string) => {
    const si = confirm("¿Seguro que deseas eliminar esta respuesta?");
    if (!si) return;

    try {
      await deleteDoc(doc(db, "aileen_respuestas", id));

      setRespuestas((prev) => prev.filter((r) => r.id !== id));

      alert("Respuesta eliminada ✔");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar la respuesta.");
    }
  };

  return (
    <main className="min-h-screen text-white px-4 py-6">
      {/* BOTONES */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="px-4 py-2 bg-neutral-800 rounded-xl border border-neutral-700"
        >
          ← Regresar al Dashboard
        </button>

        <button
          onClick={() => (window.location.href = "/plan-aileen-admin")}
          className="px-4 py-2 bg-neutral-800 rounded-xl border border-neutral-700"
        >
          ← Regresar al Calendario
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Administrar Día {day}</h1>

      {/* TÍTULO DEL PDF */}
      <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700 mb-6">
        <h2 className="font-semibold mb-2">Título del PDF</h2>
        <input
          type="text"
          className="w-full p-2 bg-neutral-800 rounded-lg border border-neutral-700"
          placeholder="Escribe el título para este PDF"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <p className="text-neutral-400 text-sm mt-1">
          *El título se guarda automáticamente al subir el PDF.
        </p>
      </div>

      {/* SUBIR PDF */}
      <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700 mb-6">
        <h2 className="font-semibold mb-3">Subir/Actualizar PDF</h2>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-3"
        />

        <button
          onClick={subirPdf}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
        >
          {loading ? "Subiendo..." : "Subir PDF"}
        </button>
      </div>

      {/* 📌 MOSTRAR EL PDF ACTUAL */}
      {pdfUrl && (
        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700 mb-10">
          <h2 className="font-semibold mb-3">PDF Actual</h2>

          <p className="mb-3 text-neutral-300">
            <strong>Título:</strong> {titulo}
          </p>

          <a
            href={pdfUrl}
            target="_blank"
            className="px-4 py-2 bg-green-600 rounded-lg mr-3"
          >
            Ver PDF
          </a>

          <a
            href={pdfUrl}
            download
            className="px-4 py-2 bg-blue-600 rounded-lg"
          >
            Descargar PDF
          </a>
        </div>
      )}

      {/* 📝 PREGUNTAS DEL DÍA (ADMIN) */}
      <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700 mb-6">
        <h2 className="font-semibold mb-3">Preguntas del día</h2>

        {preguntas.map((p, idx) => (
          <div key={idx} className="mb-4">
            <label className="block mb-1">Pregunta {idx + 1}</label>
            <input
              type="text"
              className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg"
              value={preguntas[idx]}
              onChange={(e) => {
                const arr = [...preguntas];
                arr[idx] = e.target.value;
                setPreguntas(arr);
              }}
            />
          </div>
        ))}

        <button
          onClick={guardarPreguntas}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg mt-2"
        >
          Guardar preguntas
        </button>
      </div>

      {/* RESPUESTAS */}
      <h2 className="text-xl font-bold mb-4">Respuestas del día</h2>

      {respuestas.length === 0 ? (
        <p className="text-neutral-400">Aún no hay respuestas.</p>
      ) : (
        respuestas.map((r) => (
          <div
            key={r.id}
            className="p-4 bg-neutral-900 border border-neutral-700 rounded-xl mb-6"
          >
            <p className="font-semibold mb-2">Usuario: {r.userId}</p>

            {r.respuestas?.map((texto: string, idx: number) => (
              <p key={idx} className="text-neutral-300 mb-1">
                <strong>Pregunta {idx + 1}:</strong> {texto}
              </p>
            ))}

            <button
              onClick={() => eliminarRespuesta(r.id)}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
            >
              Eliminar respuesta
            </button>

            <button
              onClick={() => setUserIdSeleccionado(r.userId)}
              className="ml-3 px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg"
            >
              Calificar
            </button>
          </div>
        ))
      )}

      {/* CALIFICAR */}
      {userIdSeleccionado && (
        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700 mt-10">
          <h2 className="font-semibold mb-3">
            Calificar usuario: {userIdSeleccionado}
          </h2>

          <label>Nota (0 - 10)</label>
          <input
            type="number"
            className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg mb-3"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />

          <label>Comentario</label>
          <textarea
            className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg mb-3"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />

          <button
            onClick={guardarNota}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"
          >
            Guardar calificación
          </button>
        </div>
      )}
    </main>
  );
}
