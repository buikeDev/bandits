import Image from 'next/image';

const wristbands = [
  ['TYVEK', 'Plain & Printed', 'tyvek-standard'],
  ['VINYL / PLASTIC', 'Plain & Printed', 'vinyl-plastic-standard'],
  ['RUBBER / SILICONE', 'Plain & Printed', 'rubber-silicone-standard'],
  ['FABRIC', 'Printed', 'fabric-standard'],
  ['VIP', 'Specialty Bands', 'vip-standard'],
  ['HOSPITAL', 'Identification Bands', 'hospital-standard'],
];

export default function WristbandsShop() {
  return (
    <section id="wristbands" className="bg-white py-12 md:py-14">
      <div className="page-shell">
        <div className="mb-7 flex items-end justify-between">
          <h2 className="section-title">Shop Wristbands</h2>
          <a href="/shop" className="text-link">
            View all wristbands <span>→</span>
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {wristbands.map(([name, variant, slug]) => (
            <a
              key={name}
              href={`/wristbands/${slug}`}
              className="group overflow-hidden rounded-md border border-neutral-200 bg-white"
            >
              <div className="relative aspect-[1.18] overflow-hidden">
                <Image
                  src={`/images/categories/${slug.replace('-standard', '')}.png`}
                  alt={`${name.toLowerCase()} wristband`}
                  fill
                  sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 17vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
                />
              </div>
              <div className="p-3">
                <p className="text-[11px] font-black">{name}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-neutral-600">
                  <span>{variant}</span>
                  <span className="text-base text-black">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
