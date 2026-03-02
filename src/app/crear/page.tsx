"use client";

import { useState } from "react";
import app from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const auth = getAuth(app);
const db = getFirestore(app);
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import EditorSimple from "@/components/EditorSimple";

import bibleRVR from "@/data/bible.json";

type Subtema = {
  titulo: string;
  contenido: string;
};

export default function CrearSermonPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [pasaje, setPasaje] = useState("");

  /* ================= BIBLIA ================= */
  const [showBiblia, setShowBiblia] = useState(false);
  const [versionBiblia, setVersionBiblia] =
    useState<"RVR1960" | "NTV">("RVR1960");

  const [libro, setLibro] = useState("");
  const [capitulo, setCapitulo] = useState("");
  const [versiculo, setVersiculo] = useState("");
  const [versiculoTexto, setVersiculoTexto] = useState("");

  const bible =
    versionBiblia === "RVR1960" ? bibleRVR : bibleRVR;

  const libros = Object.keys(bible as any);

  /* ================= SUBTEMAS ================= */
  const [subtemas, setSubtemas] = useState<Subtema[]>([
    { titulo: "", contenido: "" },
  ]);

  const agregarSubtema = () => {
    setSubtemas([...subtemas, { titulo: "", contenido: "" }]);
  };

  const updateSubtema = (
    index: number,
    campo: "titulo" | "contenido",
    valor: string
  ) => {
    const copia = [...subtemas];
    copia[index][campo] = valor;
    setSubtemas(copia);
  };

  /* ================= CONCLUSIÓN ================= */
  const [conclusion, setConclusion] = useState("");

  /* ================= GUARDAR ================= */
  const guardarSermon = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Debes iniciar sesión");

    await addDoc(collection(db, "sermones"), {
      uid: user.uid,
      titulo,
      pasaje,
      versiculoTexto,
      versionBiblia,
      subtemas,
      conclusion, // 👈 NUEVO
      archivado: false,
      createdAt: Timestamp.now(),
    });

    router.push("/mis-sermones");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-indigo-400 text-sm hover:underline"
        >
          ← Volver al Dashboard
        </button>
        <h1 className="text-3xl font-bold mt-2">
          Crear Sermón
        </h1>
      </div>

      {/* TÍTULO */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">
          Título del sermón
        </label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full bg-neutral-800 p-4 rounded-xl"
        />
      </div>

      {/* PASAJE */}
      <div className="mb-10 relative">
        <label className="block mb-2 font-semibold">
          Pasaje bíblico
        </label>

        <div className="flex gap-2">
          <input
            value={pasaje}
            readOnly
            className="flex-1 bg-neutral-800 p-4 rounded-xl"
            placeholder="Selecciona un pasaje"
          />

          <button
            onClick={() => setShowBiblia(!showBiblia)}
            className="bg-purple-600 px-4 py-3 rounded-xl hover:bg-purple-500"
          >
            📖
          </button>
        </div>

        {/* PANEL BIBLIA */}
        {showBiblia && (
          <div className="absolute right-0 top-20 w-[380px] bg-neutral-900 border border-neutral-700 rounded-2xl p-4 z-50">
            <h3 className="font-bold mb-3">
              Seleccionar pasaje
            </h3>

            <select
              value={versionBiblia}
              onChange={(e) =>
                setVersionBiblia(e.target.value as any)
              }
              className="w-full bg-neutral-800 p-2 rounded mb-3"
            >
              <option value="RVR1960">
                Reina Valera 1960
              </option>
              <option value="NTV">
                Nueva Traducción Viviente
              </option>
            </select>

            <select
              className="w-full bg-neutral-800 p-2 rounded mb-2"
              value={libro}
              onChange={(e) => {
                setLibro(e.target.value);
                setCapitulo("");
                setVersiculo("");
              }}
            >
              <option value="">Libro</option>
              {libros.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            {libro && (
              <input
                type="number"
                placeholder="Capítulo"
                value={capitulo}
                onChange={(e) =>
                  setCapitulo(e.target.value)
                }
                className="w-full bg-neutral-800 p-2 rounded mb-2"
              />
            )}

            {capitulo && (
              <input
                type="number"
                placeholder="Versículo"
                value={versiculo}
                onChange={(e) => {
                  setVersiculo(e.target.value);
                  setVersiculoTexto(
                    (bible as any)?.[libro]?.[
                      capitulo
                    ]?.[e.target.value] || ""
                  );
                }}
                className="w-full bg-neutral-800 p-2 rounded mb-3"
              />
            )}

            {versiculoTexto && (
              <div className="bg-black/40 p-3 rounded text-sm mb-3">
                {versiculoTexto}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setShowBiblia(false)}
                className="text-neutral-400 text-sm"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  setPasaje(
                    `${libro} ${capitulo}:${versiculo}`
                  );
                  setShowBiblia(false);
                }}
                className="bg-green-600 px-4 py-2 rounded text-sm"
              >
                Usar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SUBTEMAS */}
      <h2 className="text-2xl font-bold mb-4">
        Estructura del Sermón
      </h2>

      <div className="space-y-8">
        {subtemas.map((sub, i) => (
          <div
            key={i}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
          >
            <h3 className="font-bold mb-3">
              {i === 0
                ? "Tema / Punto principal"
                : `Subtema ${i + 1}`}
            </h3>

            <input
              placeholder="Título del subtema"
              value={sub.titulo}
              onChange={(e) =>
                updateSubtema(i, "titulo", e.target.value)
              }
              className="w-full bg-neutral-800 p-3 rounded-xl mb-4"
            />

            <EditorSimple
              value={sub.contenido}
              onChange={(v) =>
                updateSubtema(i, "contenido", v)
              }
            />
          </div>
        ))}
      </div>

      <button
        onClick={agregarSubtema}
        className="mt-6 px-4 py-2 bg-green-600 rounded-xl"
      >
        + Agregar subtema
      </button>

      {/* ================= CONCLUSIÓN ================= */}
      <div className="mt-14 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          Conclusiones / Llamado final
        </h2>

        <EditorSimple
          value={conclusion}
          onChange={(v) => setConclusion(v)}
        />
      </div>

      <button
        onClick={guardarSermon}
        className="mt-12 w-full py-4 bg-indigo-600 rounded-xl text-lg font-bold"
      >
        Guardar Sermón
      </button>
    </main>
  );
}
