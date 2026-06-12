import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-col items-center justify-between gap-2 bg-dark px-5 py-6 text-sand md:flex-row md:px-[60px] md:py-[60px]">
      <Link
        href="/"
        className="font-display text-2xl font-light tracking-[0.3em] text-sand"
      >
        CHECKMATE
      </Link>
      <p className="text-xs tracking-[0.15em] text-muted-foreground">
        © {new Date().getFullYear()} CHECKMATE
      </p>
    </footer>
  );
}
