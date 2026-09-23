'use client';

import { useEffect, useState } from 'react';
import { wristbandColorHex } from '@bandit/shared';
import type { ProductDetailDto } from '@bandit/shared';
import { getDesignOptions } from '@/catalog/api';
import { calculatePrice, formatOrderPrice } from '@/components/order-pricing';
import CustomStockPicker from '@/components/CustomStockPicker';
import LogoLayerControls from '@/components/LogoLayerControls';
import WristbandArtwork from '@/components/WristbandArtwork';
import type { LogoLayer } from '@/components/logo-layout';
import { useLogoHistory } from '@/components/useLogoHistory';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDesignOrder } from '@/components/DesignOrderProvider';
import { useCartFeedback } from '@/components/useCartFeedback';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const materials = [
  { name: 'Tyvek', detail: 'Light & simple', size: '19 × 250 mm', height: 76 },
  { name: 'Vinyl', detail: 'A sturdy classic', size: '25 × 250 mm', height: 100 },
  { name: 'Silicone', detail: 'Made to keep', size: '12 × 202 mm', height: 60 },
  { name: 'Fabric', detail: 'Festival favourite', size: '15 × 350 mm', height: 68 },
];
const defaultColor = ['Yellow', wristbandColorHex('Yellow')];

export default function CustomPage() {
  const router = useRouter();
  const { adding, busy, confirm } = useCartFeedback();
  const { add, items, ready, error: orderError } = useDesignOrder();
  const [catalog, setCatalog] = useState<ProductDetailDto[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [fee, setFee] = useState<number | null>(null);
  const [choice, setChoice] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogError('');
    getDesignOptions(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setCatalog(data.products);
          setFee(data.customizationFeeMinor);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCatalogError(error.message);
      });
    return () => {
      controller.abort();
    };
  }, [reload]);
  const options = catalog.flatMap((product) =>
    product.variants
      .filter((v) => v.isCustomizationEnabled)
      .map((variant) => ({ product, variant }))
  );
  const selected = options.find((option) => option.variant.id === choice);
  const [quantity, setQuantity] = useState('100');
  const [readingLogo, setReadingLogo] = useState(false);
  const [material, setMaterial] = useState(materials[0]);
  const [color, setColor] = useState(defaultColor);
  const [ink, setInk] = useState('#171717');
  const [message, setMessage] = useState('GOOD TIMES. GREAT PEOPLE.');
  const [subtitle, setSubtitle] = useState('ALL ACCESS • 2026');
  const [font, setFont] = useState('Arial, Helvetica, sans-serif');
  const { logos, setLogos, begin, end, undo, redo, canUndo, canRedo } = useLogoHistory();
  const [zoom, setZoom] = useState(100);
  const [guides, setGuides] = useState(true);
  const [selectedLogo, setSelectedLogo] = useState('');
  const [uploadEpoch, setUploadEpoch] = useState(0);
  function updateLogo(id: string, patch: Partial<LogoLayer>) {
    setLogos((current) =>
      current.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer))
    );
  }
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const sameColor = color[1] === ink;
  const materialPrice = calculatePrice(
    selected
      ? {
          basePrice: selected.product.basePrice,
          priceAdjustment: selected.variant.priceAdjustment,
          pricingTiers: selected.product.pricingTiers,
        }
      : undefined,
    Number(quantity)
  );
  const printing = Boolean(message.trim() || subtitle.trim() || logos.length);
  const unitPrice =
    materialPrice && fee !== null ? materialPrice.unit + (printing ? fee / 100 : 0) : null;
  function chooseStock(id: string) {
    setChoice(id);
    const option = options.find((o) => o.variant.id === id);
    if (!option) {
      setColor(['', '#e5e5e5']);
      setError('');
      setNotice('');
      return;
    }
    const name = option.variant.material?.toLowerCase() ?? '';
    setMaterial(
      materials.find(
        (m) =>
          name.includes(m.name.toLowerCase()) ||
          (m.name === 'Silicone' && name.includes('rubber')) ||
          (m.name === 'Vinyl' && name.includes('plastic'))
      ) ?? materials[0]
    );
    const nameColor = option.variant.color ?? '';
    setColor([nameColor, wristbandColorHex(nameColor)]);
  }

  function reset() {
    setChoice('');
    setQuantity('100');
    setReadingLogo(false);
    setUploadEpoch((value) => value + 1);
    setMaterial(materials[0]);
    setColor(defaultColor);
    setInk('#171717');
    setMessage('GOOD TIMES. GREAT PEOPLE.');
    setSubtitle('ALL ACCESS • 2026');
    setFont('Arial, Helvetica, sans-serif');
    setLogos([]);
    setSelectedLogo('');
    setError('');
    setNotice('Design reset.');
  }

  async function addDesign(continueDesigning: boolean, button: HTMLButtonElement) {
    if (busy.current) return;
    const units = Number(quantity);
    if (!Number.isInteger(units) || units < 1 || units > 100000) {
      setError('Enter a whole-number quantity between 1 and 100,000.');
      return;
    }
    if (sameColor && (message.trim() || subtitle.trim())) {
      setError('Choose a contrasting print colour before adding this design.');
      return;
    }
    if (!selected || fee === null) {
      setError('Choose an available wristband and colour first.');
      return;
    }
    const already = items
      .filter((i) => i.product?.variantId === selected.variant.id)
      .reduce((n, i) => n + i.quantity, 0);
    if (units + already > selected.variant.availableQuantity) {
      setError('The quantity exceeds available stock.');
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
      logo: '',
      logos,
      quantity: units,
      product: {
        id: selected.product.id,
        slug: selected.product.slug,
        name: selected.product.name,
        variantId: selected.variant.id,
        variantName: selected.variant.name,
        availableQuantity: selected.variant.availableQuantity,
        pricing: {
          basePrice: selected.product.basePrice,
          priceAdjustment: selected.variant.priceAdjustment,
          pricingTiers: selected.product.pricingTiers,
        },
      },
    });
    if (!saved) return;
    setNotice('Design added to your order.');
    if (!(await confirm(button, color[1]))) return;
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
            BAND-IT DESIGN STUDIO
          </span>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
          <section aria-labelledby="preview-heading" className="lg:sticky lg:top-24">
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
              <div className="flex flex-wrap items-center gap-2 border-y border-black/5 bg-white/50 px-4 py-3 text-xs">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo || readingLogo || adding}
                  className="rounded border bg-white px-3 py-2 disabled:opacity-30"
                  aria-label="Undo logo edit"
                >
                  ↶ Undo
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo || readingLogo || adding}
                  className="rounded border bg-white px-3 py-2 disabled:opacity-30"
                  aria-label="Redo logo edit"
                >
                  ↷ Redo
                </button>
                <label className="ml-auto flex items-center gap-2">
                  Zoom
                  <select
                    aria-label="Preview zoom"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="rounded border bg-white p-2"
                  >
                    <option value="100">100%</option>
                    <option value="150">150%</option>
                    <option value="200">200%</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={guides}
                    onChange={(event) => setGuides(event.target.checked)}
                  />
                  Guides
                </label>
              </div>
              <div
                className="overflow-x-auto px-3 py-12 sm:py-16"
                style={{
                  backgroundImage: 'radial-gradient(#00000012 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                <div style={{ width: `${zoom}%`, minWidth: '100%' }}>
                  <WristbandArtwork
                    material={material.name}
                    color={color[1]}
                    ink={ink}
                    message={message}
                    subtitle={subtitle}
                    font={font}
                    logos={logos}
                    selected={selectedLogo}
                    onSelect={setSelectedLogo}
                    onChange={readingLogo || adding ? undefined : updateLogo}
                    onEditStart={begin}
                    onEditEnd={end}
                    guides={guides}
                  />
                </div>
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
              <legend className="text-lg font-black">Choose your wristband and colour</legend>
              <CustomStockPicker
                key={uploadEpoch}
                options={options}
                value={choice}
                onSelect={chooseStock}
              />
              {catalogError && (
                <p role="alert" className="mt-3 text-red-700">
                  {catalogError}{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setReload((v) => v + 1)}
                  >
                    Retry
                  </button>
                </p>
              )}
              {!catalogError && fee !== null && !options.length && (
                <p className="mt-3 text-sm">
                  No customisable stock is available yet. Please check back soon.
                </p>
              )}
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
              <LogoLayerControls
                key={uploadEpoch}
                layers={logos}
                selected={selectedLogo}
                onSelect={setSelectedLogo}
                onChange={setLogos}
                onLoading={setReadingLogo}
                onEditStart={begin}
                onEditEnd={end}
                disabled={adding}
              />
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
              {unitPrice !== null && (
                <p className="mb-4 text-sm">
                  Material: {formatOrderPrice(materialPrice!.unit)} + customisation:{' '}
                  {formatOrderPrice(printing ? fee! / 100 : 0)} per band.
                  <br />
                  <strong>{formatOrderPrice(unitPrice * Number(quantity))} before delivery</strong>
                </p>
              )}
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
                disabled={!ready || readingLogo || adding}
                onClick={(event) => void addDesign(false, event.currentTarget)}
                className="button-primary w-full !py-4 !text-sm disabled:opacity-50"
              >
                {adding ? '✓ Added to order' : 'Add to order'}
              </button>
              <button
                type="button"
                disabled={!ready || readingLogo || adding}
                onClick={(event) => void addDesign(true, event.currentTarget)}
                className="button-secondary mt-3 w-full !py-4 !text-sm disabled:opacity-50"
              >
                {adding ? '✓ Design added!' : 'Add & create another design'}
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
