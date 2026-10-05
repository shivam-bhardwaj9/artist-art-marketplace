import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#eee7db] px-5 py-16">
      <div className="absolute -right-16 -top-28 h-[420px] w-[420px] rounded-full border border-[#d8cbb8]" />
      <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full border border-[#d8cbb8]" />
      <section className="relative max-w-xl text-center" data-testid="page-not-found">
        <Compass className="mx-auto text-[#9a8058]" size={25} strokeWidth={1.2} />
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.22em] text-[#8e7650]">A little off the wall</p>
        <p className="mt-3 font-editorial text-[clamp(6rem,17vw,11rem)] leading-[.85] tracking-[-.09em] text-[#39362f]" data-testid="text-not-found-code">404</p>
        <h1 className="mt-7 font-editorial text-3xl tracking-[-.03em] md:text-4xl">This frame is still empty.</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">That page isn’t part of the collection. Let’s find something worth looking at.</p>
        <Link href="/" className="button-dark mt-7" data-testid="link-not-found-home"><ArrowLeft size={14} /> Back to the gallery</Link>
      </section>
    </div>
  );
}
