import Image from 'next/image';

import {
  BulkDiscountsIcon,
  CustomPrintedIcon,
  FastDeliveryIcon,
  WaterproofIcon,
} from './icons/FeatureIcons';

const features = [
  { icon: WaterproofIcon, title: 'Waterproof', detail: 'Durable & secure' },
  { icon: CustomPrintedIcon, title: 'Custom Printed', detail: 'Your logo, your way' },
  { icon: FastDeliveryIcon, title: 'Fast Delivery', detail: 'Nationwide' },
  { icon: BulkDiscountsIcon, title: 'Bulk Discounts', detail: 'Best prices for big orders' },
];

export default function Hero() {
  return (
    <section className="border-b border-neutral-200 bg-white">
      <div className="page-shell pb-8 pt-10 md:pb-12 md:pt-14">
        <div className="grid items-center gap-8 md:grid-cols-[0.8fr_1.4fr]">
          <div className="relative z-10">
            <p className="eyebrow">EVENTS. PRODUCTS. DELIVERED.</p>
            <h1 className="mt-5 max-w-md text-5xl font-black leading-[0.98] tracking-[-0.055em] md:text-6xl">
              Wristbands for every occasion.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-6 text-neutral-700">
              High quality wristbands, custom printing and fulfilment solutions for events and
              businesses of all sizes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#wristbands" className="button-primary">
                Shop Wristbands
              </a>
              <a href="#custom" className="button-secondary">
                Custom Print
              </a>
            </div>
          </div>
          <div className="relative h-[330px] md:h-[390px]">
            <Image
              src="/images/hero-wristbands.png"
              alt="Colourful custom event wristbands"
              fill
              priority
              sizes="(min-width: 768px) 62vw, 100vw"
              className="object-contain"
            />
          </div>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-7 border-t border-neutral-200 pt-7 md:mt-3 md:grid-cols-4 md:border-0 md:pt-0">
          {features.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="mt-0.5 scale-75 text-neutral-800">
                <Icon />
              </div>
              <div>
                <p className="text-xs font-bold">{title}</p>
                <p className="mt-1 text-[11px] text-neutral-600">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
