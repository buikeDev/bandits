import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Our company | BAND-IT',
  description:
    'Meet BAND-IT: wristbands, custom printing and fulfilment for events and businesses. Get in touch with our team.',
};

const audiences = [
  {
    title: 'Events & experiences',
    description:
      'Wristbands for entry, guest identification and memorable occasions, from private celebrations to larger events.',
  },
  {
    title: 'Brands & communities',
    description:
      'Custom printed bands that carry a message, bring people together and put your identity on display.',
  },
  {
    title: 'Businesses & retailers',
    description:
      'Bulk wristband orders and fulfilment support for businesses managing products and customer deliveries.',
  },
  {
    title: 'Healthcare & identification',
    description:
      'Hospital and identification wristband options for organisations that need clear identification.',
  },
];

export default function CompanyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-neutral-50">
          <div className="page-shell py-14 md:py-20">
            <p className="eyebrow">THE COMPANY BEHIND THE BAND</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
              People. Events. Brands.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              Wristbands that bring people together. Printing that makes them yours. Fulfilment that
              supports your business.
            </p>
            <nav aria-label="Company sections" className="mt-8 flex flex-wrap gap-3">
              {[
                ['About us', 'about-us'],
                ['Our clients', 'our-clients'],
                ['Testimonials', 'testimonials'],
                ['Contact us', 'contact-us'],
              ].map(([label, id]) => (
                <a key={id} href={`#${id}`} className="button-secondary">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section id="about-us" className="page-shell scroll-mt-24 py-14">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="eyebrow">ABOUT US</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Built around your next occasion.
              </h2>
            </div>
            <div className="space-y-5 leading-7 text-neutral-600">
              <p>
                BAND-IT is a wristband sales and fulfilment platform for events, organisations and
                businesses. Our range includes Tyvek, vinyl, silicone, fabric, VIP and hospital
                wristbands, with plain and custom printed options.
              </p>
              <p>
                Choose your wristband and available colour, personalise your design and review your
                order. For businesses, we also offer fulfilment services covering storage, packaging
                and delivery.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link className="button-primary" href="/shop">
                  Shop wristbands
                </Link>
                <Link className="button-secondary" href="/fulfilment">
                  Explore fulfilment
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="our-clients" className="scroll-mt-24 bg-neutral-50 py-14">
          <div className="page-shell">
            <p className="eyebrow">OUR CLIENTS</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Who we’re here for.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-neutral-600">
              From event organisers to growing businesses, our products and services are designed
              around different needs.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {audiences.map((audience) => (
                <article
                  key={audience.title}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
                >
                  <h3 className="text-xl font-bold">{audience.title}</h3>
                  <p className="mt-3 leading-7 text-neutral-600">{audience.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="page-shell scroll-mt-24 py-14">
          <p className="eyebrow">TESTIMONIALS</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Your experience matters.</h2>
          <div className="mt-7 rounded-2xl border border-neutral-200 p-6 sm:p-8">
            <p className="max-w-2xl leading-7 text-neutral-600">
              Customer stories are coming soon. Have you ordered from BAND-IT? We’d love to hear how
              it went.
            </p>
            <a
              href="mailto:officialbandIt@gmail.com?subject=My%20BAND-IT%20experience"
              className="mt-5 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
            >
              Share your experience
            </a>
          </div>
        </section>

        <section id="contact-us" className="page-shell scroll-mt-24 pb-14">
          <div className="grid gap-8 rounded-2xl bg-black p-8 text-white md:grid-cols-2 sm:p-12">
            <div>
              <p className="text-xs font-bold tracking-widest text-yellow-400">CONTACT US</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Let’s talk about what you need.
              </h2>
              <p className="mt-4 leading-7 text-neutral-300">
                Ask about wristbands, custom printing, bulk orders or fulfilment. For an existing
                order, include your order reference so we can help.
              </p>
            </div>
            <div className="flex flex-col items-start justify-center">
              <p className="text-sm text-neutral-300">Email the BAND-IT team</p>
              <a
                href="mailto:officialbandIt@gmail.com"
                className="mt-2 inline-flex min-h-11 max-w-full items-center break-all text-lg font-bold text-yellow-400 underline underline-offset-4"
              >
                officialbandIt@gmail.com
              </a>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                This opens your email app. Write your message and send it to our team.
              </p>
              <Link
                href="/fulfilment#enquire"
                className="mt-5 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
              >
                Send a fulfilment brief
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
