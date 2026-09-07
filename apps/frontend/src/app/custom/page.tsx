'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDesignOrder } from '@/components/DesignOrderProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const materials = [
  { name: 'Tyvek', detail: 'Light & simple', size: '19 × 250 mm', height: 76 },
  { name: 'Vinyl', detail: 'A sturdy classic', size: '25 × 250 mm', height: 100 },
  { name: 'Silicone', detail: 'Made to keep', size: '12 × 202 mm', height: 60 },
  { name: 'Fabric', detail: 'Festival favourite', size: '15 × 350 mm', height: 68 },
];
const colors = [
  ['Sunshine', '#fbbf24'],
  ['Coral', '#fb7185'],
  ['Tangerine', '#fb923c'],
  ['Sky', '#7dd3fc'],
  ['Mint', '#6ee7b7'],
  ['Lilac', '#c4b5fd'],
  ['White', '#ffffff'],
  ['Black', '#171717'],
];

export default function CustomPage() {
  const router = useRouter();
  const { add, items, ready, error: orderError } = useDesignOrder();
  const [quantity, setQuantity] = useState('100');
  const [readingLogo, setReadingLogo] = useState(false);
  const [material, setMaterial] = useState(materials[0]);
  const [color, setColor] = useState(colors[0]);
  const [ink, setInk] = useState('#171717');
  const [message, setMessage] = useState('GOOD TIMES. GREAT PEOPLE.');
  const [subtitle, setSubtitle] = useState('ALL ACCESS • 2026');
  const [font, setFont] = useState('Arial, Helvetica, sans-serif');
  const [logo, setLogo] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const upload = useRef<HTMLInputElement>(null);
  const uploadVersion = useRef(0);
  const sameColor = color[1] === ink;

  function reset() {
    setQuantity('100');
    setReadingLogo(false);
    uploadVersion.current += 1;
    setMaterial(materials[0]);
    setColor(colors[0]);
    setInk('#171717');
    setMessage('GOOD TIMES. GREAT PEOPLE.');
    setSubtitle('ALL ACCESS • 2026');
    setFont('Arial, Helvetica, sans-serif');
    setLogo('');
    setError('');
    setNotice('Design reset.');
    if (upload.current) upload.current.value = '';
  }

  function readLogo(file?: File) {
    const version = ++uploadVersion.current;
    setError('');
    setReadingLogo(false);
    if (!file) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError('Choose a PNG, JPG or WebP image under 2 MB.');
      return;
    }
    const reader = new FileReader();
    setReadingLogo(true);
    reader.onload = () => {
      if (version === uploadVersion.current) {
        setLogo(String(reader.result));
        setReadingLogo(false);
      }
    };
    reader.onerror = () => {
      if (version === uploadVersion.current) {
        setReadingLogo(false);
        setError('This image could not be read. Please try another.');
      }
    };
    reader.readAsDataURL(file);
  }

  function addDesign(continueDesigning: boolean) {
    const units = Number(quantity);
    if (!Number.isInteger(units) || units < 1 || units > 100000) {
      setError('Enter a whole-number quantity between 1 and 100,000.');
      return;
    }
    if (sameColor && (message.trim() || subtitle.trim())) {
      setError('Choose a contrasting print colour before adding this design.');
      return;
    }
    if (readingLogo || !ready) return;
    const saved = add({
      material: material.name,
      color: color[1],
      colorName: color[0],
      ink,
      message,
      subtitle,
      font,
      logo,
      quantity: units,
    });
    if (!saved) return;
    if (continueDesigning) {
      reset();
      setNotice('Design added to your order. You can now create another.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else router.push('/order');
  }

  return (
    <>
      <Header />
      <main className="page-shell py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="mb-8 flex gap-2 text-xs text-neutral-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <span aria-current="page">Wristband studio</span>
        </nav>
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">YOUR EVENT. YOUR COLOURS. YOUR BAND.</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-5xl">
              Make it unmistakably yours.
            </h1>
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              A little band. A big impression. Bring your next wristband to life.
            </p>
          </div>
          <span className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold">
            BANDIT DESIGN STUDIO
          </span>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
          <section aria-labelledby="preview-heading" className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-[#eae9e5]">
              <div className="flex items-center justify-between p-6">
                <h2 id="preview-heading" className="text-xs font-bold uppercase tracking-widest">
                  Your wristband
                </h2>
                <span className="flex items-center gap-2 text-xs text-neutral-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Live preview
                </span>
              </div>
              <div
                className="flex min-h-[310px] items-center px-4 sm:min-h-[390px] sm:px-8"
                style={{
                  backgroundImage: 'radial-gradient(#00000012 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                <svg
                  viewBox="0 0 720 230"
                  role="img"
                  aria-label={`${color[0]} ${material.name} wristband: ${message}, ${subtitle}`}
                  className="w-full drop-shadow-xl"
                >
                  <title>{`${material.name} wristband concept`}</title>
                  <desc>
                    Concept preview only. Dimensions and colours require confirmation before
                    printing.
                  </desc>
                  <rect
                    x="12"
                    y={(230 - material.height) / 2}
                    width="696"
                    height={material.height}
                    rx={material.name === 'Silicone' ? 28 : 8}
                    fill={color[1]}
                    stroke="#00000020"
                  />
                  {material.name !== 'Silicone' && (
                    <>
                      <path
                        d={`M 94 ${(230 - material.height) / 2 + 6} v ${material.height - 12}`}
                        stroke={ink}
                        strokeOpacity="0.25"
                        strokeDasharray="3 4"
                      />
                      <text
                        x="53"
                        y="119"
                        textAnchor="middle"
                        fill={ink}
                        opacity="0.55"
                        fontFamily="Arial"
                        fontSize="9"
                      >
                        BANDIT.
                      </text>
                    </>
                  )}
                  {logo && (
                    <image
                      href={logo}
                      x="112"
                      y="91"
                      width="48"
                      height="48"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  )}
                  <text
                    x={logo ? 414 : 382}
                    y={subtitle ? 113 : 122}
                    textAnchor="middle"
                    fill={ink}
                    fontFamily={font}
                    fontWeight="900"
                    fontSize={Math.min(24, 740 / Math.max(message.length, 1))}
                    letterSpacing="1"
                  >
                    {message}
                  </text>
                  {subtitle && (
                    <text
                      x={logo ? 414 : 382}
                      y="132"
                      textAnchor="middle"
                      fill={ink}
                      fontFamily={font}
                      fontSize="10"
                      letterSpacing="2"
                    >
                      {subtitle}
                    </text>
                  )}
                </svg>
              </div>
              <div className="flex flex-wrap justify-between gap-3 border-t border-black/10 px-6 py-4 text-xs text-neutral-600">
                <span>Flat artwork view</span>
                <span>
                  {material.name} · Illustrative {material.size}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-white p-5">
              <span className="text-xl text-amber-500" aria-hidden="true">
                ✦
              </span>
              <p className="text-xs leading-5 text-neutral-500">
                Made for your imagination. This is a concept preview; actual colours, sizing and
                print placement will need approval before production.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              <span>Your colours</span>
              <span>Your message</span>
              <span>Your moment</span>
            </div>
          </section>
          <section
            aria-label="Customize your wristband"
            className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
          >
            <fieldset>
              <legend className="text-lg font-black">
                <span className="mr-3 text-amber-500">01</span>Pick your material
              </legend>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {materials.map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    aria-pressed={material.name === item.name}
                    onClick={() => setMaterial(item)}
                    className={`rounded-lg border p-4 text-left transition-colors ${material.name === item.name ? 'border-black bg-neutral-100 ring-1 ring-black' : 'border-neutral-200 hover:border-neutral-500'}`}
                  >
                    <span className="block text-sm font-bold">{item.name}</span>
                    <span className="mt-1 block text-xs text-neutral-500">{item.detail}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-7 border-t border-neutral-100 pt-7">
              <legend className="sr-only">Wristband colour</legend>
              <h2 className="text-lg font-black">
                <span className="mr-3 text-amber-500">02</span>Set the mood
              </h2>
              <p className="mt-4 text-xs text-neutral-500">
                Band colour <span className="ml-2 font-bold text-black">{color[0]}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {colors.map((item) => (
                  <button
                    key={item[0]}
                    type="button"
                    title={item[0]}
                    aria-label={item[0]}
                    aria-pressed={color[0] === item[0]}
                    onClick={() => setColor(item)}
                    className={`h-9 w-9 rounded-full border border-black/15 ring-offset-4 ${color[0] === item[0] ? 'ring-2 ring-black' : ''}`}
                    style={{ backgroundColor: item[1] }}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-7 border-t border-neutral-100 pt-7">
              <legend className="sr-only">Text and artwork</legend>
              <h2 className="text-lg font-black">
                <span className="mr-3 text-amber-500">03</span>Make your mark
              </h2>
              <label className="mt-5 block text-xs font-bold" htmlFor="band-message">
                Main message{' '}
                <span className="float-right font-normal text-neutral-400">
                  {message.length}/36
                </span>
              </label>
              <input
                id="band-message"
                maxLength={36}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
              <label htmlFor="band-subtitle" className="mt-4 block text-xs font-bold">
                Second line <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <input
                id="band-subtitle"
                maxLength={40}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mt-2 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="band-font" className="block text-xs font-bold">
                    Lettering
                  </label>
                  <select
                    id="band-font"
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-neutral-300 p-3 text-sm"
                  >
                    <option value="Arial, Helvetica, sans-serif">Bold & modern</option>
                    <option value="Georgia, serif">Classic serif</option>
                    <option value="Courier New, monospace">Typewriter</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="band-ink" className="block text-xs font-bold">
                    Print colour
                  </label>
                  <select
                    id="band-ink"
                    value={ink}
                    onChange={(e) => setInk(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-neutral-300 p-3 text-sm"
                  >
                    <option value="#171717">Black</option>
                    <option value="#ffffff">White</option>
                  </select>
                </div>
              </div>
              {sameColor && (
                <p role="status" className="mt-3 text-xs text-amber-800">
                  Choose a contrasting print colour so your message is visible.
                </p>
              )}
              <label
                htmlFor="band-logo"
                className="mt-5 block rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4"
              >
                <span className="block text-xs font-bold">
                  Add your logo <span className="font-normal text-neutral-500">(optional)</span>
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  PNG, JPG or WebP · Up to 2 MB
                </span>
                <input
                  ref={upload}
                  id="band-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => readLogo(e.target.files?.[0])}
                  className="mt-3 block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-black file:px-3 file:py-2 file:text-white"
                />
              </label>
              {logo && (
                <button
                  type="button"
                  onClick={() => {
                    uploadVersion.current += 1;
                    setReadingLogo(false);
                    setLogo('');
                    if (upload.current) upload.current.value = '';
                  }}
                  className="mt-2 text-xs underline"
                >
                  Remove logo
                </button>
              )}
              {error && (
                <p role="alert" className="mt-2 text-xs text-red-700">
                  {error}
                </p>
              )}
            </fieldset>
            <div className="mt-7 border-t border-neutral-100 pt-6">
              <div className="mb-4 flex justify-between text-xs">
                <span className="text-neutral-500">Your design</span>
                <span className="font-bold">
                  {material.name} / {color[0]}
                </span>
              </div>
              <label htmlFor="design-quantity" className="mb-2 block text-xs font-bold">
                How many wristbands?
              </label>
              <input
                id="design-quantity"
                type="number"
                min="1"
                max="100000"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="mb-4 w-full rounded-lg border border-neutral-300 p-3 text-sm"
              />
              <button
                type="button"
                disabled={!ready || readingLogo}
                onClick={() => addDesign(false)}
                className="button-primary w-full !py-4 !text-sm disabled:opacity-50"
              >
                Add to order
              </button>
              <button
                type="button"
                disabled={!ready || readingLogo}
                onClick={() => addDesign(true)}
                className="button-secondary mt-3 w-full !py-4 !text-sm disabled:opacity-50"
              >
                Add & create another design
              </button>
              {readingLogo && (
                <p role="status" className="mt-3 text-xs">
                  Preparing your logo…
                </p>
              )}
              {orderError && (
                <p role="alert" className="mt-3 text-xs text-red-700">
                  {orderError}
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="mt-3 w-full rounded py-2 text-xs text-neutral-500 hover:text-black"
              >
                Reset design
              </button>
              <p className="mt-2 text-center text-[11px] leading-5 text-neutral-500">
                Save multiple designs and review your quantities before checkout.
              </p>
              <p role="status" className="mt-2 text-center text-xs text-neutral-600">
                {notice}
              </p>
              {items.length > 0 && (
                <Link href="/order" className="mt-4 block text-center text-sm font-bold underline">
                  Review order ({items.length} designs)
                </Link>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
