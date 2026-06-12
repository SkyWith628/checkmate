import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-5 py-12">
      <Link
        href="/"
        className="mb-10 font-display text-3xl font-light tracking-[0.4em] text-dark"
      >
        CHECK<span className="mx-[-4px] text-cherry">⬦</span>MATE
      </Link>
      <div className="w-full max-w-sm border border-gold bg-cream p-8">
        {children}
      </div>
    </div>
  );
}
