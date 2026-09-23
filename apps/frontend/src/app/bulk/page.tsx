import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Bulk wristband orders | BAND-IT',
  description:
    'Order wristbands for events and businesses. Choose materials, colours and quantities, with optional custom printing.',
};

export default function BulkPage() {
  return (
    <>
      <Header />
      <main className="page-shell py-12 sm:py-20">
        <p className="eyebrow">BULK ORDERS</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
          Wristbands for your next big event.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
          Choose your wristband type, pick available colours and enter your quantity. Order plain
          bands or create a design for your event, team or business.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="button-primary" href="/shop?kind=WRISTBAND">
            Shop bulk wristbands
          </Link>
          <Link className="button-secondary" href="/custom">
            Design custom wristbands
          </Link>
        </div>
        <div className="my-14 grid gap-6 md:grid-cols-3">
          {[
            [
              '1. Choose your bands',
              'Browse materials and available colours. Each colour has its own stock availability.',
            ],
            [
              '2. Set your quantity',
              'Applicable bulk price tiers are applied automatically. Custom printing adds the current per-band customisation fee.',
            ],
            [
              '3. Complete your order',
              'Review your total, save your order and send the prepared WhatsApp message. Our team confirms delivery and payment details.',
            ],
          ].map(([title, description]) => (
            <section key={title} className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-3 leading-7 text-neutral-600">{description}</p>
            </section>
          ))}
        </div>
        <section className="max-w-3xl space-y-5">
          <h2 className="text-2xl font-black">Before you order</h2>
          <p className="leading-7 text-neutral-600">
            Bulk tiers vary by product and apply to each order line. You’ll see the applicable unit
            price and total before checkout. Delivery charges are confirmed separately; collection
            has no delivery charge.
          </p>
          <p className="leading-7 text-neutral-600">
            For quantities beyond the available stock or help planning your order, email{' '}
            <a
              className="underline"
              href="mailto:banditwristbandsng@gmail.com?subject=Bulk%20wristband%20enquiry"
            >
              banditwristbandsng@gmail.com
            </a>{' '}
            with your preferred material, colours, quantity and event date.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
