'use client';
import { useState } from 'react';
import { wristbandColorHex, type ProductDetailDto } from '@bandit/shared';

type Option = { product: ProductDetailDto; variant: ProductDetailDto['variants'][number] };
export default function CustomStockPicker({
  options,
  value,
  onSelect,
}: {
  options: Option[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const [category, setCategory] = useState('');
  const [colour, setColour] = useState('');
  const categories = [
    ...new Map(options.map(({ product }) => [product.category.slug, product.category])).values(),
  ];
  const available = options.filter(({ product }) => product.category.slug === category);
  const colours = [
    ...new Set(
      available.map(({ variant }) => variant.color).filter((name): name is string => Boolean(name))
    ),
  ];
  const matches = available.filter(({ variant }) => variant.color === colour);
  const selected = matches.find(({ variant }) => variant.id === value);
  return (
    <div className="mt-4 space-y-5">
      <label className="block text-sm font-semibold">
        Wristband category
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setColour('');
            onSelect('');
          }}
          className="mt-2 min-h-11 w-full rounded-lg border bg-white p-3"
        >
          <option value="">Choose a category</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {category ? (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Choose your colour</legend>
          <div className="flex flex-wrap gap-2">
            {colours.map((name) => {
              const stock = available.filter(
                ({ variant }) => variant.color === name && variant.availableQuantity > 0
              );
              return (
                <button
                  key={name}
                  type="button"
                  disabled={!stock.length}
                  aria-pressed={colour === name}
                  className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${colour === name ? 'border-black bg-yellow-50 ring-1 ring-black' : 'border-neutral-200 bg-white'}`}
                  onClick={() => {
                    setColour(name);
                    onSelect(stock.length === 1 ? stock[0].variant.id : '');
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{
                      background:
                        name === 'Multi-colour'
                          ? 'conic-gradient(#00c965,#0075ff,#a94de4,#ffc400,#00c965)'
                          : wristbandColorHex(name),
                    }}
                  />
                  {name}
                  {!stock.length && ' — Sold out'}
                </button>
              );
            })}
          </div>
          {!colours.length && (
            <p className="text-sm text-neutral-500">
              No colours are available in this category yet.
            </p>
          )}
        </fieldset>
      ) : (
        <p className="text-sm text-neutral-500">Choose a category to see its available colours.</p>
      )}
      {colour && matches.length > 1 && (
        <label className="block text-sm font-semibold">
          Size / wristband option
          <select
            value={value}
            onChange={(event) => onSelect(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-white p-3"
          >
            <option value="">Choose an option</option>
            {matches.map(({ product, variant }) => (
              <option key={variant.id} value={variant.id} disabled={variant.availableQuantity < 1}>
                {product.name} · {variant.name}
                {variant.size ? ` · ${variant.size}` : ''}
                {variant.availableQuantity < 1 ? ' — Sold out' : ''}
              </option>
            ))}
          </select>
        </label>
      )}
      {selected && (
        <p role="status" className="text-sm text-neutral-600">
          {selected.variant.availableQuantity.toLocaleString()} available in {colour}.
        </p>
      )}
    </div>
  );
}
