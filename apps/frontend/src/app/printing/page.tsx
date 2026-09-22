import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WristbandArtwork from '@/components/WristbandArtwork';

export const metadata: Metadata = {
  title: 'Printing options & templates | BAND-IT',
  description:
    'Explore custom wristband printing and design inspiration, then create your own wristband with BAND-IT.',
};

const options = [
  {
    title: 'Make a statement',
    description:
      'Add an event name, a short message or an access level. Choose your text and ink colour in the designer.',
  },
  {
    title: 'Put your brand on it',
    description:
      'Upload your logo and position it on the wristband preview to make your brand part of the event.',
  },
  {
    title: 'Bring it all together',
    description:
      'Combine your logo with a headline and a second line for a design that feels like yours.',
  },
];
const templates = [
  {
    title: 'Event access',
    message: 'ALL ACCESS',
    subtitle: 'ONE NIGHT. EVERY MOMENT.',
    color: '#ffc400',
    ink: '#101010',
    material: 'Tyvek',
    description: 'A bold event name and a clear access message.',
  },
  {
    title: 'Team day',
    message: 'ONE TEAM',
    subtitle: 'MAKE IT HAPPEN',
    color: '#0075ff',
    ink: '#ffffff',
    material: 'Vinyl',
    description: 'Bring your team together with a shared message.',
  },
  {
    title: 'Celebrations',
    message: 'LET’S CELEBRATE',
    subtitle: 'GOOD TIMES TOGETHER',
    color: '#ef51b4',
    ink: '#101010',
    material: 'Tyvek',
    description: 'A personal touch for parties and special occasions.',
  },
  {
    title: 'Community',
    message: 'BETTER TOGETHER',
    subtitle: 'YOUR COMMUNITY. YOUR COLOUR.',
    color: '#00c965',
    ink: '#101010',
    material: 'Silicone',
    description: 'Keep your community or campaign message close.',
  },
];

export default function PrintingPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-neutral-50">
          <div className="page-shell grid items-center gap-8 py-14 md:grid-cols-2 md:py-20">
            <div>
              <p className="eyebrow">CUSTOM WRISTBAND PRINTING</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Make it your band.
              </h1>
              <p className="mt-5 max-w-xl leading-7 text-neutral-600">
                Your colours, your message, your identity. Explore printing options and template
                ideas, then bring your own design to life.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="button-primary" href="/custom">
                  Design your wristband
                </Link>
                <Link className="button-secondary" href="#templates">
                  Explore templates
                </Link>
              </div>
            </div>
            <div className="rounded-3xl bg-yellow-100 p-6 sm:p-10">
              <WristbandArtwork
                material="Tyvek"
                color="#ffc400"
                ink="#101010"
                message="YOUR NEXT BIG MOMENT"
                subtitle="MAKE IT YOURS"
                font="Arial"
                logos={[]}
              />
            </div>
          </div>
        </section>

        <section id="printing-options" className="page-shell scroll-mt-24 py-14">
          <p className="eyebrow">PRINTING OPTIONS</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Start with what you want to say.
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {options.map((option, index) => (
              <article key={option.title} className="rounded-2xl border border-neutral-200 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-100 font-bold">
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-xl font-bold">{option.title}</h3>
                <p className="mt-3 leading-7 text-neutral-600">{option.description}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-3xl leading-7 text-neutral-600">
            Choose from available wristbands and colours in the designer. Your price combines the
            wristband unit price and a customisation fee for each printed wristband.
          </p>
        </section>

        <section id="templates" className="scroll-mt-24 bg-neutral-50 py-14">
          <div className="page-shell">
            <p className="eyebrow">TEMPLATE INSPIRATION</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              A little inspiration. A design of your own.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-neutral-600">
              These examples show what you can create. Open the designer to choose your available
              material and colour, then add your own wording or logo.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {templates.map((template) => (
                <article
                  key={template.title}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                >
                  <div className="bg-neutral-100 p-6 sm:px-10">
                    <WristbandArtwork
                      material={template.material}
                      color={template.color}
                      ink={template.ink}
                      message={template.message}
                      subtitle={template.subtitle}
                      font="Arial"
                      logos={[]}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold">{template.title}</h3>
                    <p className="mt-2 leading-7 text-neutral-600">{template.description}</p>
                    <Link
                      href="/custom"
                      className="mt-4 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                    >
                      Create your own design
                      <span className="sr-only"> inspired by {template.title.toLowerCase()}</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="page-shell py-14">
          <div className="rounded-2xl bg-black p-8 text-white sm:p-12">
            <h2 className="text-3xl font-black">Ready to make yours?</h2>
            <p className="mt-4 max-w-xl leading-7 text-neutral-300">
              Choose your wristband, build your design and review the preview and price before
              continuing.
            </p>
            <Link
              href="/custom"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300"
            >
              Design your wristband
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
