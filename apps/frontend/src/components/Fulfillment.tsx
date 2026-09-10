import { DeliverIcon, PackIcon, StoreIcon } from './icons/FeatureIcons';

const services = [
  {
    icon: StoreIcon,
    step: '01. STORE',
    copy: 'We securely store your inventory in our facilities.',
  },
  { icon: PackIcon, step: '02. PACK', copy: 'We pick, pack and prepare every order with care.' },
  {
    icon: DeliverIcon,
    step: '03. DELIVER',
    copy: 'We deliver to your customers across the country.',
  },
];

export default function Fulfillment() {
  return (
    <section id="fulfilment" className="bg-white pb-10">
      <div className="page-shell">
        <div className="rounded-lg bg-[#080a0a] px-7 py-10 text-white md:px-10">
          <div className="grid gap-9 lg:grid-cols-[0.85fr_1.5fr]">
            <div>
              <p className="eyebrow">WE FULFIL TOO.</p>
              <h2 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.04em]">
                You sell it.
                <br />
                We handle the rest.
              </h2>
              <p className="mt-5 max-w-xs text-sm leading-6 text-neutral-400">
                End-to-end fulfilment for businesses that want to grow without limits.
              </p>
              <div className="mt-6 flex gap-3">
                <a href="/fulfilment" className="button-light">
                  Explore Fulfilment
                </a>
                <a href="/fulfilment#enquire" className="button-dark">
                  Talk to Us
                </a>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {services.map(({ icon: Icon, step, copy }) => (
                <div key={step} className="rounded-md border border-white/5 bg-white/[0.055] p-6">
                  <div className="mb-8 text-white">
                    <Icon />
                  </div>
                  <p className="text-sm font-black text-amber-400">{step}</p>
                  <p className="mt-4 text-xs leading-5 text-neutral-300">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-8 text-lg font-black text-white/75">
            <span>TRACE</span>
            <span className="font-medium">pepsi</span>
            <span>JAMESON</span>
            <span className="font-serif italic">Coca-Cola</span>
            <span>TECNO</span>
            <span className="font-serif">Hennessy</span>
          </div>
        </div>
      </div>
    </section>
  );
}
