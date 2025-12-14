"use client";

import { useState, useEffect } from "react";
import { db, storage, auth } from "@/lib/firebase";
import { doc, setDoc, Timestamp, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

type EstadoDia = "bloqueado" | "activo" | "soloLectura";

export default function AileenDiaPage({ params }: { params: { day: string } }) {
  const { day } = params;
  const router = useRouter();
  const dayNum = Number(day);

  const [titulo, setTitulo] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [answers, setAnswers] = useState({
    p1: "",
    p2: "",
    p3: "",
    p4: "",
  });

  const [error, setError] = useState("");
  const [tema, setTema] = useState<"mujer" | "hombre">("hombre");

  const [nota, setNota] = useState<number | null>(null);
  const [comentarioPadre, setComentarioPadre] = useState("");

  const [estadoDia, setEstadoDia] = useState<EstadoDia>("bloqueado");

  // 📝 Preguntas dinámicas (si existen en Firestore)
  const [preguntasDinamicas, setPreguntasDinamicas] = useState<string[] | null>(
    null
  );

  // ==================================================
  // 🔒 Validar login y obtener sexo del usuario
  // ==================================================
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const refUser = doc(db, "usuarios", user.uid);
      const snap = await getDoc(refUser);

      if (snap.exists()) {
        const data = snap.data();
        setTema(data.sexo === "mujer" ? "mujer" : "hombre");
      } else {
        router.push("/perfil");
      }
    });

    return unsubscribe;
  }, [router]);

  // ==================================================
  // 🕒 CALCULAR ESTADO DEL DÍA SEGÚN FECHA DEL USUARIO
  // ==================================================
  useEffect(() => {
  const calcular = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const refUser = doc(db, "usuarios", user.uid);
    const snapUser = await getDoc(refUser);

    if (!snapUser.exists()) {
      setEstadoDia("bloqueado");
      return;
    }

    let data = snapUser.data();

    // Si NO tiene fechaInicioPlan → se registra hoy
    if (!data.fechaInicioPlan) {
      await setDoc(
        refUser,
        { fechaInicioPlan: Timestamp.now() },
        { merge: true }
      );
      data.fechaInicioPlan = Timestamp.now();
    }

    const inicio = data.fechaInicioPlan.toDate();
    const hoy = new Date();

    const diffMs = hoy.getTime() - inicio.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    // diffDias = el día que debería estar viviendo Aileen hoy

    // ================================
    // BLOQUEAR FUTUROS
    // ================================
    if (dayNum > diffDias) {
      setEstadoDia("bloqueado");
      return;
    }

    // ================================
    // VERIFICAR SI YA RESPONDIÓ ESTE DÍA
    // ================================
    const refResp = doc(db, "aileen_respuestas", `${user.uid}_dia_${dayNum}`);
    const snapResp = await getDoc(refResp);
    const yaRespondido = snapResp.exists();

    // ================================
    // DÍAS PASADOS
    // ================================
    if (dayNum < diffDias) {
      if (yaRespondido) {
        setEstadoDia("soloLectura"); // ya lo hizo
      } else {
        setEstadoDia("activo"); // puede completarlo
      }
      return;
    }

    // ================================
    // DÍA ACTUAL
    // ================================
    if (dayNum === diffDias) {
      if (yaRespondido) {
        setEstadoDia("soloLectura");
      } else {
        setEstadoDia("activo");
      }
      return;
    }
  };

  calcular();
}, [dayNum]);


  // ==================================================
  // 📄 Cargar PDF + respuestas + calificación + preguntas
  // ==================================================
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // PDF
        const refDia = doc(db, "planAileen_pdfs", `dia-${day}`);
        const snapDia = await getDoc(refDia);

        if (snapDia.exists()) {
          const data = snapDia.data();
          setTitulo(data.titulo || "");

          if (data.url) setPdfUrl(data.url);
          else {
            try {
              const storageRef = ref(storage, `planAileen/pdfs/dia-${day}.pdf`);
              const url = await getDownloadURL(storageRef);
              setPdfUrl(url);
            } catch {
              setPdfUrl(null);
            }
          }
        }

        // Preguntas dinámicas del día (si existen)
        const refPreg = doc(db, "planAileen_preguntas", `dia-${day}`);
        const snapPreg = await getDoc(refPreg);

        if (snapPreg.exists()) {
          const dataPreg = snapPreg.data();
          if (Array.isArray(dataPreg.preguntas)) {
            const arr = dataPreg.preguntas as string[];
            setPreguntasDinamicas([
              arr[0] || "",
              arr[1] || "",
              arr[2] || "",
              arr[3] || "",
            ]);
          }
        }

        const user = auth.currentUser;
        if (user) {
          // RESPUESTAS
          const refResp = doc(
            db,
            "aileen_respuestas",
            `${user.uid}_dia_${day}`
          );
          const snapResp = await getDoc(refResp);

          if (snapResp.exists()) {
            const d = snapResp.data();

            if (Array.isArray(d.respuestas)) {
              setAnswers({
                p1: d.respuestas[0] || "",
                p2: d.respuestas[1] || "",
                p3: d.respuestas[2] || "",
                p4: d.respuestas[3] || "",
              });
            }
          }

          // CALIFICACIÓN
          const refCal = doc(
            db,
            "aileen_calificaciones",
            `${user.uid}_dia_${day}`
          );
          const snapCal = await getDoc(refCal);

          if (snapCal.exists()) {
            const c = snapCal.data();
            setNota(c.nota ?? null);
            setComentarioPadre(c.comentario ?? "");
          }
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    cargarDatos();
  }, [day]);

  // ==================================================
  // 🚫 Bloquear copiar/pegar
  // ==================================================
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    alert("No puedes copiar y pegar. Debes escribir con tus propias palabras 😊");
  };

  // ==================================================
  // 📨 Guardar respuestas
  // ==================================================
  const submitAnswers = async () => {
    if (estadoDia !== "activo") {
      setError("Ya no puedes enviar respuestas para este día.");
      return;
    }

    setError("");

    const minWords = 50;
    for (const key in answers) {
      const words = answers[key as keyof typeof answers]
        .trim()
        .split(/\s+/);
      if (words.length < minWords) {
        setError("Cada respuesta debe tener al menos 50 palabras.");
        return;
      }
    }

    try {
      setSending(true);

      const user = auth.currentUser;
      if (!user) return;

      await setDoc(
        doc(db, "aileen_respuestas", `${user.uid}_dia_${day}`),
        {
          userId: user.uid,
          day: dayNum,
          respuestas: [answers.p1, answers.p2, answers.p3, answers.p4],
          createdAt: Timestamp.now(),
        },
        { merge: true }
      );

      alert("Respuestas enviadas correctamente ❤️");
      router.push("/aileen");
    } catch (err) {
      console.error(err);
      setError("Hubo un error al enviar tus respuestas.");
    } finally {
      setSending(false);
    }
  };

  // ==================================================
  // 🎨 Estilos según sexo
  // ==================================================
  const color = tema === "mujer" ? "pink" : "blue";
  const borde = `border-${color}-400`;
  const bgh = `hover:bg-${color}-600`;
  const titleColor = `text-${color}-300`;
  const btnBg = `bg-${color}-600 hover:bg-${color}-500`;

  const soloLectura = estadoDia === "soloLectura";

  // ==================================================
  // VISTA BLOQUEADA
  // ==================================================
  if (estadoDia === "bloqueado") {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold mb-4 text-yellow-400">Día {day}</h1>
        <p className="text-neutral-200 text-lg text-center mb-2">
          No te afanes… es día por día.
        </p>
        <button
          onClick={() => router.push("/aileen")}
          className="mt-6 px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg hover:bg-neutral-700"
        >
          ← Regresar al calendario
        </button>
      </main>
    );
  }

  // ==================================================
  // VISTA NORMAL (ACTIVO O SOLO LECTURA)
  // ==================================================
  const preguntasParaMostrar =
    preguntasDinamicas && preguntasDinamicas.some((p) => p && p.trim() !== "")
      ? preguntasDinamicas
      : [
          "¿Qué aprendiste de este capítulo?",
          "¿Por qué piensas que Dios permitió que se escriba este capítulo?",
          "¿Por qué crees que no es bueno a esta edad tener novio o novia?",
          "¿Qué consejo le darías a un amigo/a si te dice que ya quiere tener enamorado/a?",
        ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-6 flex justify-center">
      <div className="w-full max-w-3xl">
        <button
          onClick={() => router.push("/aileen")}
          className={`mb-4 px-4 py-2 bg-neutral-800 rounded-xl border ${borde} ${bgh} transition`}
        >
          ← Regresar al calendario
        </button>

        <h1 className={`text-2xl font-bold mb-4 ${titleColor}`}>
          Día {day} {soloLectura && "(solo lectura)"}
        </h1>

        {/* ⭐ MOSTRAR CALIFICACIÓN SI EXISTE */}
        {nota !== null && (
          <div className="mb-6 p-4 bg-neutral-900 border border-green-500 rounded-xl">
            <p className="text-green-400 text-lg font-bold">
              ✔ Nota: {nota}/10
            </p>

            {comentarioPadre && (
              <p className="text-neutral-300 mt-2">
                <strong>Comentario:</strong> {comentarioPadre}
              </p>
            )}
          </div>
        )}

        {/* PDF */}
        <div className={`bg-neutral-900 border ${borde} rounded-xl p-4 mb-6`}>
          <h2 className="text-lg font-semibold mb-3">Capítulo del día</h2>

          {loading ? (
            <p className="text-sm text-neutral-400">Cargando PDF...</p>
          ) : pdfUrl ? (
            <>
              <p className="text-green-400 font-semibold mb-3">{titulo}</p>
              <iframe
                src={pdfUrl}
                className={`w-full h-96 rounded-xl border ${borde}`}
              />
            </>
          ) : (
            <p className="text-red-400 text-sm">No hay PDF para este día.</p>
          )}
        </div>

        {/* Preguntas */}
        <div
          className={`bg-neutral-900 border ${borde} rounded-xl p-4 space-y-6`}
        >
          {preguntasParaMostrar.map((pregunta, idx) => {
            const key = `p${idx + 1}` as keyof typeof answers;
            return (
              <Pregunta
                key={idx}
                label={`${idx + 1}. ${pregunta}`}
                value={answers[key]}
                onChange={(v) =>
                  setAnswers({
                    ...answers,
                    [key]: v,
                  })
                }
                onPaste={handlePaste}
                borde={borde}
                disabled={soloLectura}
              />
            );
          })}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={submitAnswers}
            disabled={sending || soloLectura}
            className={`w-full py-3 mt-2 rounded-xl font-semibold text-white ${
              soloLectura ? "bg-neutral-700 cursor-not-allowed" : btnBg
            } transition`}
          >
            {soloLectura
              ? "Tiempo terminado (solo lectura)"
              : sending
              ? "Enviando..."
              : "Enviar respuestas"}
          </button>
        </div>
      </div>
    </main>
  );
}

// ==================================================
// 🧩 Componente Pregunta
// ==================================================
function Pregunta({
  label,
  value,
  onChange,
  onPaste,
  borde,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  borde: string;
  disabled: boolean;
}) {
  const wordCount =
    value.trim() === "" ? 0 : value.trim().split(/\s+/).length;

  return (
    <div>
      <label className="block mb-2 text-sm font-semibold">{label}</label>
      <textarea
        className={`w-full h-28 p-3 rounded-xl bg-neutral-800 border ${borde} resize-none ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
        value={value}
        onChange={(e) => !disabled && onChange(e.target.value)}
        onPaste={(e) => !disabled && onPaste(e)}
        disabled={disabled}
      />
      <p className="text-xs text-neutral-400 mt-1">
        Palabras:{" "}
        <span className={wordCount >= 50 ? "text-green-400" : "text-red-400"}>
          {wordCount}
        </span>{" "}
        / 50
      </p>
    </div>
  );
}
