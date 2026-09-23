'use client';

import { useEffect, useRef, useState } from 'react';
import type { LogoLayer } from './logo-layout';

type Props = {
  layers: LogoLayer[];
  selected: string;
  onSelect: (id: string) => void;
  onChange: (layers: LogoLayer[]) => void;
  onLoading: (loading: boolean) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  disabled?: boolean;
};
export default function LogoLayerControls(p: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);
  const locked = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const selected = p.layers.find((layer) => layer.id === p.selected);
  function update(patch: Partial<LogoLayer>) {
    p.onChange(p.layers.map((layer) => (layer.id === p.selected ? { ...layer, ...patch } : layer)));
  }
  async function upload(files: File[]) {
    if (locked.current || !files.length) return;
    locked.current = true;
    setLoading(true);
    p.onLoading(true);
    setError('');
    const added: LogoLayer[] = [];
    const errors: string[] = [];
    let used = p.layers.reduce((sum, layer) => sum + layer.src.length, 0);
    try {
      for (const file of files) {
        try {
          if (
            !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
            file.size > 2 * 1024 * 1024
          )
            throw new Error('Use a PNG, JPG or WebP up to 2 MB.');
          const src = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('Could not read image.'));
            reader.readAsDataURL(file);
          });
          const aspect = await new Promise<number>((resolve, reject) => {
            const image = new window.Image();
            image.onload = () =>
              image.naturalWidth && image.naturalHeight
                ? resolve(image.naturalWidth / image.naturalHeight)
                : reject(new Error('Empty image.'));
            image.onerror = () => reject(new Error('Invalid image.'));
            image.src = src;
          });
          if (!mounted.current) return;
          if (aspect > 10000) throw new Error('Image proportions are too extreme.');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/artwork`, {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: file.name, data: src }),
          });
          const result = (await response.json().catch(() => null)) as { success?: boolean; data?: { id: string; name: string; url: string }; error?: string } | null;
          if (!response.ok || !result?.success || !result.data)
            throw new Error(result?.error ?? 'Artwork upload failed. Please try again.');
          used += 1;
          added.push({
            id: crypto.randomUUID(),
            name: result.data.name,
            src: result.data.url,
            artworkId: result.data.id,
            aspect,
            x: ((p.layers.length + added.length) * 25) % 101,
            y: 50,
            size: 70,
          });
        } catch (cause) {
          errors.push(
            `${file.name}: ${cause instanceof Error ? cause.message : 'Could not load image.'}`
          );
        }
      }
      if (mounted.current) {
        if (added.length) {
          p.onChange([...p.layers, ...added]);
          p.onSelect(added[added.length - 1].id);
        }
        setError(errors.join(' '));
      }
    } finally {
      locked.current = false;
      if (mounted.current) {
        setLoading(false);
        p.onLoading(false);
      }
    }
  }
  const disabled = loading || p.disabled;
  return (
    <fieldset disabled={disabled} className="mt-6 border-t border-neutral-100 pt-5">
      <legend className="sr-only">Logo layers</legend>
      <h3 className="text-sm font-bold">
        Logos & artwork <span className="font-normal text-neutral-500">({p.layers.length})</span>
      </h3>
      <p className="mt-2 text-xs leading-5 text-neutral-500">
        Upload multiple logos, then select one to drag it on the band. Arrow keys nudge the selected
        logo; Shift moves it faster. Drag the corner handle to resize.
      </p>
      <label className="mt-3 block rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
        <span className="text-xs font-bold">Add logos</span>
        <input
          id="band-logos"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = '';
            void upload(files);
          }}
          className="mt-2 block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-black file:px-3 file:py-2 file:text-white"
        />
        <span className="mt-2 block text-[11px] text-neutral-500">
          Transparent PNG supported · 2 MB per file
        </span>
      </label>
      {loading && (
        <p role="status" className="mt-3 text-xs">
          Reading artwork…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      )}
      <div className="mt-4 space-y-2">
        {p.layers.map((layer, index) => (
          <button
            type="button"
            key={layer.id}
            aria-pressed={p.selected === layer.id}
            onClick={() => p.onSelect(layer.id)}
            className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left text-xs ${p.selected === layer.id ? 'border-blue-500 bg-blue-50' : 'border-neutral-200'}`}
          >
            <svg
              width="32"
              height="32"
              className="shrink-0 rounded bg-neutral-100"
              aria-hidden="true"
            >
              <image href={layer.src} width="32" height="32" preserveAspectRatio="xMidYMid meet" />
            </svg>
            <span className="min-w-0 flex-1 truncate">{layer.name}</span>
            <span className="text-neutral-400">Layer {index + 1}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-4 space-y-4 rounded-lg bg-neutral-50 p-4">
          {(
            [
              ['size', 'Size', 5],
              ['x', 'Horizontal position', 0],
              ['y', 'Vertical position', 0],
            ] as const
          ).map(([key, label, min]) => (
            <label key={key} className="block text-xs font-bold">
              {label}
              <span className="float-right font-normal">{Math.round(selected[key])}%</span>
              <input
                aria-label={label}
                type="range"
                min={min}
                max="100"
                step="1"
                value={selected[key]}
                onPointerDown={p.onEditStart}
                onPointerUp={p.onEditEnd}
                onPointerCancel={p.onEditEnd}
                onKeyDown={p.onEditStart}
                onKeyUp={p.onEditEnd}
                onBlur={p.onEditEnd}
                onChange={(event) => update({ [key]: Number(event.target.value) })}
                className="mt-2 w-full accent-black"
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2 text-xs [&>button]:min-h-9 [&>button]:rounded-md [&>button]:border [&>button]:border-neutral-200 [&>button]:bg-white [&>button]:px-3 [&>button]:no-underline hover:[&>button]:bg-neutral-100">
            <button type="button" onClick={() => update({ x: 50, y: 50 })} className="underline">
              Center
            </button>
            <button
              type="button"
              onClick={() => {
                const duplicate = {
                  ...selected,
                  id: crypto.randomUUID(),
                  x: Math.min(100, selected.x + 5),
                };
                p.onChange([...p.layers, duplicate]);
                p.onSelect(duplicate.id);
              }}
              className="underline"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() =>
                p.onChange([...p.layers.filter((layer) => layer.id !== selected.id), selected])
              }
              className="underline"
            >
              Bring to front
            </button>
            <button
              type="button"
              onClick={() =>
                p.onChange([selected, ...p.layers.filter((layer) => layer.id !== selected.id)])
              }
              className="underline"
            >
              Send to back
            </button>
            <button
              type="button"
              onClick={() => {
                p.onChange(p.layers.filter((layer) => layer.id !== selected.id));
                p.onSelect('');
              }}
              className="text-red-700 underline"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}
