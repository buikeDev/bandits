import Image from 'next/image';
import { CheckIcon } from './icons/FeatureIcons';

export default function BulkOrders() {
  return (
    <section id="bulk" className="bg-white pb-10">
      <div className="page-shell">
        <div className="grid overflow-hidden rounded-lg bg-neutral-50 md:grid-cols-[1fr_1.05fr_0.9fr]">
          <div className="relative min-h-56">
            <Image
              src="/images/hero-wristbands.png"
              alt="Stacked event wristbands"
              fill
              sizes="33vw"
              className="object-cover object-center"
            />
          </div>
          <div className="flex flex-col justify-center px-8 py-9">
            <h2 className="text-3xl font-black tracking-[-0.04em]">Need a large order?</h2>
            <p className="mt-3 text-xs leading-5 text-neutral-600">
              Get special pricing for events, organizations and businesses.
            </p>
            <a href="/bulk" className="button-primary mt-5 w-fit">
              Order in bulk
            </a>
          </div>
          <div className="flex flex-col justify-center gap-5 border-l border-neutral-200 px-8 py-9">
            {['Best bulk prices', 'Fast turnaround', 'Dedicated support'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-xs text-neutral-700">
                <span className="scale-75">
                  <CheckIcon />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
