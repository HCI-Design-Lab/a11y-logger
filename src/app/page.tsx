import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-24">
      <h1 className="text-4xl font-bold">A11y Logger</h1>
      <p className="text-lg text-muted-foreground">
        Open-source, offline-first accessibility auditing tool
      </p>
      <Button>Get Started</Button>
    </main>
  );
}
