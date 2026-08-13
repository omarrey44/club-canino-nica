import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold text-navy-800">Esta pagina no existe</h1>
        <p className="text-ink-muted">
          Puede que el enlace haya cambiado o que la estancia ya haya terminado.
        </p>
        <Link
          href="/inicio"
          className="inline-flex font-semibold text-brand-600 hover:underline"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
