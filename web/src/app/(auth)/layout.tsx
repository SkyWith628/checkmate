import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-luxe-radial px-5 py-12">
      <div
        aria-hidden
        className="animate-glow pointer-events-none absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-antique-gold/15 blur-3xl"
      />
      <Reveal direction="zoom" className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-10 block text-center font-display text-3xl font-light tracking-[0.4em] text-dark"
        >
          CHECK<span className="mx-[-4px] text-cherry">⬦</span>MATE
        </Link>
        <div className="glass shadow-luxe w-full rounded-2xl border border-gold/60 p-8">
          {children}
        </div>
      </Reveal>
    </div>
  );
}
