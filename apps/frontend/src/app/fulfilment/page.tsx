import type { Metadata } from 'next';
import BrandLogo from '@/components/BrandLogo';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FulfilmentBrief from '@/components/FulfilmentBrief';
import { StoreIcon, PackIcon, DeliverIcon } from '@/components/icons/FeatureIcons';

export const metadata: Metadata = {
  title: 'Fulfilment for your business | BAND-IT',
  description:
    'Storage, picking, packing and delivery support for your business. Explore BAND-IT fulfilment and prepare your enquiry.',
};

const services = [
  {
    id: 'storage',
    icon: StoreIcon,
    title: 'Space for your stock.',
    label: '01 / STORE',
    copy: 'Move inventory out of your workspace and into a fulfilment setup built around your products.',
    details: [
      'Inventory receiving and organisation',
      'Storage needs agreed around your stock',
      'Preparation for incoming orders',
    ],
  },
  {
    id: 'packaging',
    icon: PackIcon,
    title: 'Every order, prepared.',
    label: '02 / PACK',
    copy: 'From a single item to a curated bundle, make packing part of a better customer experience.',
    details: [
      'Order picking and packing',
      'Product bundles and event kits',
      'Branded packaging requirements',
    ],
  },
  {
    id: 'delivery',
    icon: DeliverIcon,
    title: 'The next stop: your customer.',
    label: '03 / DELIVER',
    copy: 'Bring dispatch and delivery planning into one workflow, with destinations and timelines agreed upfront.',
    details: [
      'Dispatch coordination',
      'Delivery planning for your destinations',
      'Handover requirements agreed with you',
    ],
  },
];

const faqs = [
  [
    'Is fulfilment only for wristbands?',
    'No. BAND-IT also supports third-party products from fulfilment clients. Share what you sell, including product sizes and handling requirements, so we can assess the right setup.',
  ],
  [
    'How much does fulfilment cost?',
    'Your requirements shape the quote: stock volume, product dimensions, monthly orders, packaging and delivery destinations. Include these in your enquiry brief so the scope can be discussed.',
  ],
  [
    'Can I use my own branded packaging?',
    'Include your packaging, inserts and bundle requirements in your brief. The team can confirm suitability and agree the packing process before onboarding.',
  ],
  [
    'Where can you deliver?',
    'Share your customer locations with the team. Coverage, delivery partners and expected timelines need to be confirmed for your fulfilment arrangement.',
  ],
  [
    'What do I need to get started?',
    'Prepare a product list, estimated stock and order volumes, delivery locations and any special handling needs. These form the starting point for agreeing a fulfilment plan.',
  ],
];

export default function FulfilmentPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="bg-[#080a0a] text-white">
          <div className="page-shell py-8">
            <nav aria-label="Breadcrumb" className="flex gap-3 text-xs text-neutral-400">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-white">Fulfilment</span>
            </nav>
            <div className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-20">
              <div>
                <p className="eyebrow">BAND-IT FOR BUSINESS</p>
                <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                  You sell it.
                  <br />
                  We handle
                  <br />
                  <span className="text-amber-400">the rest.</span>
                </h1>
                <p className="mt-6 max-w-md text-base leading-7 text-neutral-400">
                  Storage, packing and delivery support. Give your products a place to move, and
                  your business room to grow.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#enquire" className="button-light">
                    Plan your fulfilment{' '}
                    <span aria-hidden="true" className="ml-4">
                      ↗
                    </span>
                  </a>
                  <a href="#how-it-works" className="button-dark">
                    See how it works
                  </a>
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 sm:p-10">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.15em] text-neutral-400">
                  <span>YOUR FULFILMENT FLOW</span>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                </div>
                <div
                  aria-hidden="true"
                  className="mx-auto my-10 flex aspect-[1.35] max-w-xs items-center justify-center rounded-lg bg-[#cda66c] shadow-[16px_16px_0_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex h-full w-14 items-center justify-center bg-[#ebc98f]">
                    <span className="-rotate-90 whitespace-nowrap text-2xl font-black tracking-tight text-black">
                      <BrandLogo className="w-36" />
                    </span>
                  </div>
                </div>
                <p className="text-center text-sm font-bold">Your product. Our next move.</p>
                <ol className="mt-8 grid grid-cols-3 gap-2 border-t border-white/10 pt-6 text-center text-xs">
                  {['Receive', 'Prepare', 'Dispatch'].map((step, i) => (
                    <li key={step}>
                      <span className="mb-2 block text-amber-400">0{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="page-shell py-16 md:py-24" aria-labelledby="services-heading">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">LESS LOGISTICS. MORE BUSINESS.</p>
              <h2 id="services-heading" className="section-title mt-3">
                From your inventory to their doorstep.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-neutral-600">
              A practical fulfilment workflow for wristbands, client products and growing brands.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {services.map(({ id, icon: Icon, title, label, copy, details }) => (
              <article
                key={id}
                id={id}
                className="scroll-mt-24 rounded-xl border border-neutral-200 bg-[#f7f7f4] p-7"
              >
                <div aria-hidden="true">
                  <Icon />
                </div>
                <p className="mt-8 text-[10px] font-black tracking-widest text-neutral-500">
                  {label}
                </p>
                <h3 className="mt-3 text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{copy}</p>
                <ul className="mt-6 space-y-3 border-t border-neutral-200 pt-5">
                  {details.map((detail) => (
                    <li key={detail} className="flex gap-3 text-xs leading-5">
                      <span aria-hidden="true" className="font-bold text-amber-600">
                        ✓
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 bg-[#f3f3ef] py-16 md:py-20">
          <div className="page-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">GETTING STARTED</p>
              <h2 className="section-title mt-3">
                A clear plan.
                <br />
                Before the first parcel.
              </h2>
              <a href="#enquire" className="button-primary mt-6">
                Prepare your brief{' '}
                <span aria-hidden="true" className="ml-4">
                  ↗
                </span>
              </a>
            </div>
            <ol className="divide-y divide-neutral-300">
              {[
                [
                  'Tell us what you sell',
                  'Share your products, stock levels, order volumes and delivery needs.',
                ],
                [
                  'Agree your setup',
                  'Confirm scope, pricing, packaging and handling requirements with the team.',
                ],
                [
                  'Get your stock ready',
                  'Coordinate the inventory handover and agree how orders will be shared.',
                ],
                [
                  'Start fulfilling orders',
                  'Move into the agreed picking, packing and dispatch workflow.',
                ],
              ].map(([title, copy], index) => (
                <li key={title} className="flex gap-6 py-6 first:pt-0">
                  <span className="text-sm font-black text-neutral-400">0{index + 1}</span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="businesses" className="page-shell scroll-mt-24 py-16 md:py-20">
          <p className="eyebrow">BUILT AROUND YOUR BUSINESS</p>
          <h2 className="section-title mt-3">More than wristbands.</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              [
                'Online stores',
                'Make room for your next chapter, with support for stock, packaging and outgoing orders.',
              ],
              [
                'Events & activations',
                'Bring wristbands, merchandise and event kits into a coordinated fulfilment plan.',
              ],
              [
                'Product brands',
                'Explore fulfilment for your own products, with handling requirements tailored to your range.',
              ],
            ].map(([title, copy]) => (
              <article key={title} className="border-l-2 border-amber-400 pl-6">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="enquire" className="scroll-mt-20 bg-amber-50 py-16 md:py-20">
          <div className="page-shell grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-[11px] font-black tracking-wide text-amber-800">
                LET’S MAKE ROOM FOR GROWTH
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                Your next order.
                <br />
                Our next conversation.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-neutral-600">
                Start with a few details about your business. A useful brief helps define the
                services, costs and delivery requirements for your fulfilment plan.
              </p>
              <p className="mt-8 border-t border-amber-200 pt-6 text-sm leading-6 text-neutral-600">
                Ordering wristbands instead?{' '}
                <Link href="/shop" className="font-bold text-black underline underline-offset-4">
                  Explore the shop
                </Link>
                .
              </p>
            </div>
            <FulfilmentBrief />
          </div>
        </section>

        <section id="faqs" className="page-shell scroll-mt-24 py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">A FEW THINGS TO KNOW</p>
            <h2 className="section-title mt-3">Fulfilment, explained.</h2>
            <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="cursor-pointer text-sm font-bold focus-visible:outline-amber-500">
                    {question}
                  </summary>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
