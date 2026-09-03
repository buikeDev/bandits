import Image from 'next/image';

export default function CustomPrinting() {
  return (
    <section id="custom" className="bg-white pb-12 md:pb-14">
      <div className="page-shell">
        <div className="relative min-h-[330px] overflow-hidden rounded-lg bg-neutral-100 md:min-h-[370px]">
          <Image
            src="/images/custom-printing.png"
            alt="Pink custom printed wristband"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-transparent" />
          <div className="relative z-10 max-w-sm px-7 py-12 md:px-10 md:py-16">
            <p className="eyebrow">MAKE IT YOURS.</p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.04em]">
              Custom printed wristbands.
            </h2>
            <p className="mt-5 max-w-xs text-sm leading-6 text-neutral-700">
              Add your logo, text, QR code or design and make your event unforgettable.
            </p>
            <a href="/custom" className="button-primary mt-6 inline-flex">
              Design Yours
            </a>
          </div>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {[0, 1, 2, 3, 4].map((dot) => (
              <span
                key={dot}
                className={`h-2 w-2 rounded-full ${dot === 0 ? 'bg-black' : 'bg-neutral-300'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
