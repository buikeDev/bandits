import Link from 'next/link';
import BrandLogo from './BrandLogo';
import NewsletterSignup from './NewsletterSignup';

const columns = [
  {
    title: 'SHOP',
    links: ['Wristbands', 'All Products', 'New Arrivals', 'Best Sellers', 'Bulk Orders'],
  },
  {
    title: 'CUSTOM PRINTING',
    links: ['Design Your Wristband', 'Printing Options', 'Templates', 'FAQs'],
  },
  {
    title: 'FULFILMENT',
    links: ['How It Works', 'Storage', 'Packaging', 'Delivery', 'For Businesses'],
  },
  { title: 'COMPANY', links: ['About Us', 'Our Clients', 'Testimonials', 'Contact Us'] },
];
const shopLinks: Record<string, string> = {
  Wristbands: '/shop?kind=WRISTBAND',
  'All Products': '/shop',
  'New Arrivals': '/shop?sort=newest',
  'Best Sellers': '/shop?sort=best-sellers',
  'Bulk Orders': '/bulk',
};
const printingLinks: Record<string, string> = {
  'Design Your Wristband': '/custom',
  'Printing Options': '/printing#printing-options',
  Templates: '/printing#templates',
};
const companyLinks: Record<string, string> = {
  'About Us': '/company#about-us',
  'Our Clients': '/company#our-clients',
  Testimonials: '/company#testimonials',
  'Contact Us': '/company#contact-us',
};

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="page-shell grid gap-9 border-b border-neutral-200 py-10 md:grid-cols-[1.15fr_repeat(4,0.7fr)_1.25fr]">
        <div>
          <BrandLogo />
          <p className="mt-4 text-[11px] leading-5 text-neutral-600">
            Wristbands. Products. Fulfilment.
            <br />
            Everything you need for successful events and growing businesses.
          </p>
          <div className="mt-5 flex gap-4 text-xs font-bold">
            <span>◎</span>
            <span>f</span>
            <span>♥</span>
            <span>in</span>
          </div>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-[10px] font-black">{column.title}</h3>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link}>
                  <Link
                    href={
                      column.title === 'SHOP'
                        ? shopLinks[link]
                        : column.title === 'FULFILMENT'
                          ? `/fulfilment#${({ 'How It Works': 'how-it-works', Storage: 'storage', Packaging: 'packaging', Delivery: 'delivery', 'For Businesses': 'businesses' } as Record<string, string>)[link]}`
                          : (printingLinks[link] ?? companyLinks[link] ?? '#')
                    }
                    className="text-[10px] text-neutral-600 hover:text-black"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-[10px] font-black">NEWSLETTER</h3>
          <p className="mt-4 text-[10px] leading-5 text-neutral-600">
            Get updates on new products, offers and more.
          </p>
          <NewsletterSignup />
        </div>
      </div>
      <div className="page-shell flex flex-col justify-between gap-3 py-6 text-[9px] text-neutral-500 sm:flex-row">
        <p>© 2026 BAND-IT. All rights reserved.</p>
        <div className="flex gap-8">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms & Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
