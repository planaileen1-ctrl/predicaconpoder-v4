"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

type Subtema = {
  titulo: string;
  contenido: string;
};

export default function CrearSermonPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [pasaje, setPasaje] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [contenido, setContenido] = useState("");

  const [subtemas, setSubtemas] = useState<Subtema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addSubtema = () => {
    setSubtemas([...subtemas, { titulo: "", contenido: "" }]);
  };

  const updateSubtema = (index: number, field: "titulo" | "contenido", value: string) => {
    const updated = [...subtemas];
    updated[index][field] = value;
    setSubtemas(updated);
  };

  const deleteSubtema = (index: number) => {
    setSubtemas(subtemas.filter((_, i) => i !== index));
  };

  const saveSermon = async () => {
    if (!titulo || !pasaje || !contenido) {
      setError("Debes completar todos los campos obligatorios");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Debes iniciar sesión");
        return;
      }

      // 🔥 GUARDAR CON ARCHIVADO: FALSE
      const ref = await addDoc(collection(db, "sermones"), {
        uid: user.uid,
        titulo,
        pasaje,
        objetivo,
        contenido,
        subtemas,
        creadoEn: Timestamp.now(),
        archivado: false,
      });

      // 🔥 REDIRIGIR A LA VISTA DEL SERMON
      router.push(`/mis-sermones/${ref.id}`);

    } catch (e) {
      setError("Error al guardar el sermón.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Crear Sermón</h1>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="text-sm">Título del sermón</label>
          <input
            type="text"
            className="w-full mt-1 px-3 py-2 bg-neutral-800 rounded-lg"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Pasaje bíblico</label>
          <input
            type="text"
            placeholder="Ejemplo: Juan 3:16"
            className="w-full mt-1 px-3 py-2 bg-neutral-800 rounded-lg"
            value={pasaje}
            onChange={(e) => setPasaje(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Objetivo del tema</label>
          <textarea
            className="w-full mt-1 px-3 py-2 bg-neutral-800 rounded-lg"
            rows={3}
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Contenido del sermón</label>
          <textarea
            className="w-full mt-1 px-3 py-2 bg-neutral-800 rounded-lg"
            rows={6}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Subtemas</label>

          <button
            onClick={addSubtema}
            className="mt-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500"
          >
            ➕ Agregar subtema
          </button>

          <div className="mt-4 space-y-6">
            {subtemas.map((sub, i) => (
              <div key={i} className="bg-neutral-900 p-4 rounded-xl border border-neutral-700">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">Subtema {i + 1}</h3>
                  <button
                    onClick={() => deleteSubtema(i)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Título del subtema"
                  className="w-full mb-3 px-3 py-2 bg-neutral-800 rounded-lg"
                  value={sub.titulo}
                  onChange={(e) => updateSubtema(i, "titulo", e.target.value)}
                />

                <textarea
                  placeholder="Contenido del subtema"
                  className="w-full px-3 py-2 bg-neutral-800 rounded-lg"
                  rows={4}
                  value={sub.contenido}
                  onChange={(e) => updateSubtema(i, "contenido", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400">{error}</p>}

        <button
          onClick={saveSermon}
          disabled={loading}
          className="w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-500 mt-6 font-semibold"
        >
          {loading ? "Guardando..." : "Guardar Sermón"}
        </button>
      </div>
    </main>
  );
}
