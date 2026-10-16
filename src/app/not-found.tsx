import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent-strong">404</p>
      <h1 className="text-4xl font-extrabold">This desk is empty.</h1>
      <p className="text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-4 rounded-full bg-accent px-6 py-3 font-semibold hover:bg-accent-strong">
        Back to the workspace
      </Link>
    </main>
  );
}
