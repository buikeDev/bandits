import WristbandArtwork from './WristbandArtwork';
import type { SavedLine } from '@/admin/types';
import { money } from '@/admin/api';
export default function SavedOrderArtwork({ items }: { items: SavedLine[] }) {
  return (
    <div className="space-y-5">
      {items.map((item, index) => {
        const custom = Boolean(item.message || item.subtitle || item.logo || item.logos?.length);
        const raw = item.material.toLowerCase();
        const material =
          raw.includes('silicone') || raw.includes('rubber')
            ? 'Silicone'
            : raw.includes('vinyl') || raw.includes('plastic')
              ? 'Vinyl'
              : raw.includes('fabric')
                ? 'Fabric'
                : raw.includes('tyvek')
                  ? 'Tyvek'
                  : item.material;
        const logos = item.logos?.length
          ? item.logos
          : item.logo
            ? [
                {
                  id: 'legacy',
                  name: 'Uploaded logo',
                  src: item.logo,
                  x: 0,
                  y: 50,
                  size: 60,
                  aspect: 1,
                },
              ]
            : [];
        const previewLogos = logos.map((logo) => ({
          ...logo,
          src: logo.artworkId ? `/api/admin/artwork/${encodeURIComponent(logo.artworkId)}` : logo.src,
        }));
        return (
          <article
            key={`${item.id}-${index}`}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
          >
            <div className="bg-[#faf9f6] px-4 py-6">
              <WristbandArtwork
                material={material}
                color={item.color}
                ink={item.ink}
                message={item.message}
                subtitle={item.subtitle}
                font={item.font}
                logos={previewLogos}
                showBrand={custom}
              />
            </div>
            <div className="space-y-2 p-5">
              <h3 className="font-bold">
                {index + 1}. {item.name}
              </h3>
              <p className="text-sm">
                {item.material} · {item.colorName} · {item.quantity.toLocaleString()} units
              </p>
              <p className="text-sm text-neutral-600">
                {item.materialUnitMinor !== undefined && (
                  <>
                    Material: {money(item.materialUnitMinor)} + customisation:{' '}
                    {money(item.customizationUnitMinor ?? 0)} per band.{' '}
                  </>
                )}
                Unit: {item.unitMinor === null ? 'Quote required' : money(item.unitMinor)} ·
                Subtotal: {item.totalMinor === null ? 'Quote required' : money(item.totalMinor)}
              </p>
              {item.requestedColor && (
                <p className="text-sm text-amber-800">
                  Requested colour — availability must be confirmed.
                </p>
              )}
              {custom && (
                <dl className="space-y-1 break-words text-sm text-neutral-600">
                  <div>
                    <dt className="inline font-semibold">Text: </dt>
                    <dd className="inline">{item.message || 'None'}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Subtitle: </dt>
                    <dd className="inline">{item.subtitle || 'None'}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Print: </dt>
                    <dd className="inline">
                      {item.ink} · {item.font}
                    </dd>
                  </div>
                </dl>
              )}
              {logos.map((logo) => (
                <a
                  key={logo.id}
                  href={logo.artworkId ? `/api/admin/artwork/${encodeURIComponent(logo.artworkId)}` : logo.src}
                  download={`${logo.name.replace(/[^a-z0-9._-]/gi, '_') || 'artwork'}.png`}
                  target={logo.artworkId ? '_blank' : undefined}
                  rel={logo.artworkId ? 'noreferrer' : undefined}
                  className="inline-flex min-h-11 items-center pr-4 text-sm underline"
                >
                  Download {logo.name}
                </a>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
