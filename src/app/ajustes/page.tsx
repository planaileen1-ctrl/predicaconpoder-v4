import Link from "next/link";

export default function AjustesPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Ajustes</h1>
        <p className="text-neutral-300 mb-8">
          Configura tu cuenta y preferencias desde esta sección.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/perfil"
            className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 hover:bg-neutral-800 transition"
          >
            <h2 className="text-lg font-semibold">Perfil</h2>
            <p className="text-sm text-neutral-400 mt-1">Actualiza tus datos personales.</p>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 hover:bg-neutral-800 transition"
          >
            <h2 className="text-lg font-semibold">Volver al panel</h2>
            <p className="text-sm text-neutral-400 mt-1">Regresar al menú principal.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
