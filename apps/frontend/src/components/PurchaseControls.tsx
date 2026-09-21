'use client';
import { wristbandColorHex } from '@bandit/shared';
import Link from 'next/link';
import type { ProductDetailDto } from '@bandit/shared';
type Props = {
  product: ProductDetailDto;
  selectedColor: string;
  quantity: string;
  remaining: number;
  valid: boolean;
  unitPrice: number;
  ready: boolean;
  adding: boolean;
  requestedColor: string;
  error: string;
  saveError: string;
  notice: string;
  onChoose: (name: string) => void;
  onQuantity: (quantity: string) => void;
  onAdd: (checkout: boolean, button: HTMLButtonElement) => Promise<void>;
};
export default function PurchaseControls(p: Props) {
  const money = (value: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);
  const choices = [
    ...new Set(p.product.variants.map((v) => v.color).filter((c): c is string => Boolean(c))),
  ].map((name) => {
    const matches = p.product.variants.filter((v) => v.color === name);
    return {
      name,
      hex: wristbandColorHex(name),
      label: name,
      soldOut: matches.every((v) => v.availableQuantity <= 0),
    };
  });
  const selected = choices.find((v) => v.name.toLowerCase() === p.selectedColor.toLowerCase());
  return (
    <section className="purchase-panel" aria-label="Choose wristband options">
      <h2 className="purchase-price">From {money(p.product.basePrice)}</h2>
      <label className="purchase-label" htmlFor="band-color">
        Choose your colour
      </label>
      <div className="purchase-select">
        <span aria-hidden="true" style={{ backgroundColor: selected?.hex ?? '#eee' }} />
        <select
          id="band-color"
          value={selected?.name ?? p.selectedColor}
          onChange={(e) => p.onChoose(e.target.value)}
        >
          {choices.map((v) => (
            <option key={v.name} value={v.name} disabled={v.soldOut}>
              {v.label}
              {v.soldOut ? ' — Sold out' : ''}
            </option>
          ))}
          {!selected && <option>{p.selectedColor}</option>}
        </select>
      </div>
      <fieldset className="purchase-colors">
        <legend className="purchase-label">Or pick from our colours</legend>
        <div className="swatch-grid">
          {choices.map((v) => (
            <button
              type="button"
              className="purchase-swatch"
              key={v.name}
              title={v.label}
              aria-label={v.label}
              aria-pressed={selected?.name === v.name}
              disabled={v.soldOut}
              onClick={() => p.onChoose(v.name)}
              style={{
                background:
                  v.name === 'Multi-colour'
                    ? 'conic-gradient(from 45deg,#00c965,#0075ff,#a94de4,#ffc400,#00c965)'
                    : v.hex,
              }}
            />
          ))}
        </div>
      </fieldset>
      {p.requestedColor && (
        <p className="purchase-note text-amber-800">
          Requested colour. Availability confirmed before ordering.
        </p>
      )}
      <label className="purchase-label" htmlFor="wristband-units">
        Number of units
      </label>
      <div className="quantity-stepper">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={!p.valid || Number(p.quantity) <= 1 || p.adding}
          onClick={() => p.onQuantity(String(Number(p.quantity) - 1))}
        >
          −
        </button>
        <input
          id="wristband-units"
          type="number"
          min="1"
          max={Math.min(p.remaining, 100000)}
          value={p.quantity}
          disabled={p.remaining === 0 || p.adding}
          onChange={(e) => p.onQuantity(e.target.value)}
        />
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={!p.valid || Number(p.quantity) >= Math.min(p.remaining, 100000) || p.adding}
          onClick={() => p.onQuantity(String(Number(p.quantity) + 1))}
        >
          +
        </button>
      </div>
      {p.valid ? (
        <div className="purchase-total">
          <span>
            <b>{money(p.unitPrice)}</b> per unit
          </span>
          <strong>{money(p.unitPrice * Number(p.quantity))} total</strong>
        </div>
      ) : (
        <p className="purchase-note text-amber-800">
          {p.remaining ? 'Enter a quantity within available stock.' : 'No more units available.'}
        </p>
      )}
      {p.error && (
        <p role="alert" className="purchase-note text-red-700">
          {p.error}
        </p>
      )}
      {p.saveError && (
        <p role="alert" className="purchase-note text-red-700">
          {p.saveError}
        </p>
      )}
      <div className="purchase-actions">
        <button
          type="button"
          disabled={!p.ready || !p.valid || p.adding}
          onClick={(e) => void p.onAdd(false, e.currentTarget)}
        >
          {p.adding ? '✓ Added' : 'Add to cart'}
        </button>
        <button
          type="button"
          disabled={!p.ready || !p.valid || p.adding}
          onClick={(e) => void p.onAdd(true, e.currentTarget)}
        >
          Buy now
        </button>
      </div>
      <p className="purchase-delivery">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <path d="M3 5h11v12H3zM14 9h4l3 4v4h-7" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
        Checkout &amp; delivery details will be confirmed next.
      </p>
      {p.notice && (
        <p role="status" className="purchase-note text-green-800">
          {p.notice}{' '}
          <Link href="/order" className="underline">
            View cart
          </Link>
        </p>
      )}
    </section>
  );
}
