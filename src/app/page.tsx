import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">AEGIS</h1>
        <p className="mt-4 text-muted-foreground">
          AI-powered media generation platform
        </p>
      </div>

      <Link
        href="/workspace/demo/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Get Started
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </main>
  );
}
