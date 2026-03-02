"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import app from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const auth = getAuth(app);
const db = getFirestore(app);
import {
  collection,
  getDocs,
  query,
  orderBy,
  writeBatch,
  doc,
} from "firebase/firestore";

type Participante = {
  id: string;
  nombreCompleto: string;
  deseo: string;
  whatsapp: string;
  codigo: string;
};

type Asignacion = {
  id: string; // docId = deCodigo
  deCodigo: string;
  deNombre: string;
  paraCodigo?: string;
  paraNombre?: string;
  paraDeseo?: string;
  presupuesto?: number;
  noRegala?: boolean;
};

function normalizeName(v: string) {
  return (v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export default function AdminAsignacionesPage() {
  const router = useRouter();
  const adminEmail = useMemo(() => "planaileen@gmail.com", []);

  const [loading, setLoading] = useState(true);
  const [userOk, setUserOk] = useState(false);

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editAsign, setEditAsign] = useState<Asignacion | null>(null);
  const [nuevoParaCodigo, setNuevoParaCodigo] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const participantesByCodigo = useMemo(() => {
    const m: Record<string, Participante> = {};
    for (const p of participantes) m[String(p.codigo)] = p;
    return m;
  }, [participantes]);

  const yudithKey = useMemo(() => normalizeName("yudith"), []);

  const destinatariosElegibles = useMemo(() => {
    // Nadie debe regalar a Yudith → la quitamos de posibles "para"
    return participantes.filter((p) => normalizeName(p.nombreCompleto) !== yudithKey);
  }, [participantes, yudithKey]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.push("/login");
          return;
        }
        if (user.email !== adminEmail) {
          router.push("/intercambio-regalos");
          return;
        }
        setUserOk(true);

        // Participantes (privado)
        const qp = query(
          collection(db, "intercambio_regalos_participantes"),
          orderBy("creadoEn", "asc")
        );
        const sp = await getDocs(qp);
        const ps: Participante[] = sp.docs.map((d) => ({
          id: d.id,
          nombreCompleto: d.data().nombreCompleto || "",
          deseo: d.data().deseo || "",
          whatsapp: d.data().whatsapp || "",
          codigo: d.data().codigo || "",
        }));
        setParticipantes(ps);

        // Asignaciones (solo admin puede listar por rules)
        const qa = query(
          collection(db, "intercambio_regalos_asignaciones"),
          orderBy("creadoEn", "asc")
        );
        const sa = await getDocs(qa);
        const asigs: Asignacion[] = sa.docs.map((d) => ({
          id: d.id,
          deCodigo: d.data().deCodigo || d.id,
          deNombre: d.data().deNombre || "",
          paraCodigo: d.data().paraCodigo || "",
          paraNombre: d.data().paraNombre || "",
          paraDeseo: d.data().paraDeseo || "",
          presupuesto: d.data().presupuesto || 5,
          noRegala: d.data().noRegala === true,
        }));
        setAsignaciones(asigs);
      } catch (e) {
        console.error(e);
        alert("Error cargando asignaciones (admin). Revisa Rules.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router, adminEmail]);

  const abrirEditar = (a: Asignacion) => {
    if (a.noRegala) {
      alert("Este registro es 'no regala' (RAUL LEON). No se edita.");
      return;
    }
    setEditAsign(a);
    setNuevoParaCodigo(String(a.paraCodigo || ""));
    setEditOpen(true);
  };

  const guardarCambio = async () => {
    if (!editAsign) return;

    const deCodigo = String(editAsign.id); // docId = deCodigo
    const nuevoCodigo = String(nuevoParaCodigo || "");

    if (!nuevoCodigo) {
      alert("Selecciona un destinatario.");
      return;
    }

    // Evitar auto-asignación
    if (nuevoCodigo === String(editAsign.deCodigo || editAsign.id)) {
      alert("No se puede asignar a sí mismo.");
      return;
    }

    // Nadie regala a Yudith (ya filtrado, pero por seguridad)
    const candidato = participantesByCodigo[nuevoCodigo];
    if (candidato && normalizeName(candidato.nombreCompleto) === yudithKey) {
      alert("No se puede asignar a Yudith.");
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);

      // Buscar quién actualmente tiene a ese "nuevoParaCodigo" para hacer SWAP
      const otro = asignaciones.find(
        (x) => !x.noRegala && String(x.paraCodigo || "") === nuevoCodigo
      );

      const refActual = doc(db, "intercambio_regalos_asignaciones", deCodigo);

      const nuevoPara = participantesByCodigo[nuevoCodigo];
      if (!nuevoPara) {
        alert("No encontré el participante por ese código.");
        setSaving(false);
        return;
      }

      // Datos previos del actual (para swap)
      const prevParaNombre = editAsign.paraNombre || "";
      const prevParaDeseo = editAsign.paraDeseo || "";
      const prevParaCodigo = String(editAsign.paraCodigo || "");

      // 1) Actual -> nuevo destinatario
      batch.update(refActual, {
        paraCodigo: String(nuevoPara.codigo),
        paraNombre: nuevoPara.nombreCompleto,
        paraDeseo: nuevoPara.deseo,
      });

      // 2) Si existe "otro", le damos el destinatario previo del actual (SWAP)
      if (otro) {
        const refOtro = doc(db, "intercambio_regalos_asignaciones", String(otro.id));
        batch.update(refOtro, {
          paraCodigo: prevParaCodigo || "",
          paraNombre: prevParaNombre,
          paraDeseo: prevParaDeseo,
        });
      }

      await batch.commit();

      // refrescar estado en UI sin recargar
      setAsignaciones((prev) =>
        prev.map((x) => {
          if (String(x.id) === deCodigo) {
            return {
              ...x,
              paraCodigo: String(nuevoPara.codigo),
              paraNombre: nuevoPara.nombreCompleto,
              paraDeseo: nuevoPara.deseo,
            };
          }
          if (otro && String(x.id) === String(otro.id)) {
            return {
              ...x,
              paraCodigo: prevParaCodigo || "",
              paraNombre: prevParaNombre,
              paraDeseo: prevParaDeseo,
            };
          }
          return x;
        })
      );

      setEditOpen(false);
      setEditAsign(null);
      alert("✅ Cambiado. Se hizo intercambio automáticamente.");
    } catch (e) {
      console.error(e);
      alert("Error guardando cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Cargando...
      </div>
    );
  }
  if (!userOk) return null;

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/intercambio-regalos")}
          className="text-sm text-indigo-400 hover:text-indigo-300 mb-6"
        >
          ← Volver al menú
        </button>

        <h1 className="text-3xl font-bold mb-2">👑 Admin: Quién le tocó a quién</h1>
        <p className="text-neutral-400 mb-6">
          Aquí puedes ver todas las asignaciones y cambiarlas manualmente (swap automático).
        </p>

        <div className="space-y-3">
          {asignaciones.map((a) => (
            <div
              key={a.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {a.deNombre || "—"}{" "}
                    <span className="text-xs text-neutral-500">
                      (código: {a.deCodigo || a.id})
                    </span>
                  </p>

                  {a.noRegala ? (
                    <p className="text-sm text-amber-300 mt-1">
                      ⚠️ Este código está marcado como “no regala”.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-neutral-300 mt-1">
                        → Regala a:{" "}
                        <span className="text-emerald-300 font-semibold">
                          {a.paraNombre || "—"}
                        </span>
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Pide: <span className="text-white">{a.paraDeseo || "—"}</span>
                      </p>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {!a.noRegala && (
                    <button
                      onClick={() => abrirEditar(a)}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {asignaciones.length === 0 && (
            <p className="text-neutral-500 text-sm">Aún no hay asignaciones.</p>
          )}
        </div>

        {/* MODAL */}
        {editOpen && editAsign && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
            <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <h2 className="text-xl font-bold mb-1">Editar asignación</h2>
              <p className="text-sm text-neutral-400 mb-4">
                Cambiando a <b>{editAsign.deNombre}</b>. Si eliges alguien que ya está asignado,
                se hará <b>swap</b> automático.
              </p>

              <label className="block text-sm text-neutral-300 mb-2">
                Nuevo destinatario
              </label>
              <select
                value={nuevoParaCodigo}
                onChange={(e) => setNuevoParaCodigo(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-pink-500"
              >
                <option value="">— Selecciona —</option>
                {destinatariosElegibles.map((p) => (
                  <option key={p.codigo} value={p.codigo}>
                    {p.nombreCompleto} — pide: {p.deseo}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => {
                    setEditOpen(false);
                    setEditAsign(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                >
                  Cancelar
                </button>

                <button
                  onClick={guardarCambio}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 font-semibold disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar cambio"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
