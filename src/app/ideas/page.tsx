import Link from "next/link";

export default function IdeasPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Ideas Bíblicas</h1>
        <p className="text-neutral-300 mb-8">
          Esta sección está lista para que guardes tus ideas, bosquejos y textos clave.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/crear"
            className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 hover:bg-neutral-800 transition"
          >
            <h2 className="text-lg font-semibold">Crear nuevo sermón</h2>
            <p className="text-sm text-neutral-400 mt-1">Ir al editor para desarrollar tu idea.</p>
          </Link>

          <Link
            href="/mis-sermones"
            className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 hover:bg-neutral-800 transition"
          >
            <h2 className="text-lg font-semibold">Ver mis sermones</h2>
            <p className="text-sm text-neutral-400 mt-1">Continuar trabajando ideas guardadas.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
