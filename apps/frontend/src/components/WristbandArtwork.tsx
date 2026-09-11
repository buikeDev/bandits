'use client';

import { useRef, type PointerEvent } from 'react';
import BrandLogo from './BrandLogo';
import { bandHeight, clampPosition, logoBounds, type LogoLayer } from './logo-layout';

type Props = {
  material: string;
  color: string;
  ink: string;
  message: string;
  subtitle: string;
  font: string;
  logos: LogoLayer[];
  selected?: string;
  onSelect?: (id: string) => void;
  onChange?: (id: string, patch: Partial<LogoLayer>) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  guides?: boolean;
  showBrand?: boolean;
};
export default function WristbandArtwork(p: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    clientX: number;
    clientY: number;
    travelX: number;
    travelY: number;
    resizing: boolean;
    layer: LogoLayer;
  } | null>(null);
  const point = (event: PointerEvent<SVGGElement>) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
      : new DOMPoint();
  };
  const height = bandHeight(p.material);
  return (
    <svg
      ref={svg}
      viewBox="0 0 720 230"
      role={p.onChange ? 'group' : 'img'}
      aria-label={`${p.material} wristband design with ${p.logos.length} logos`}
      className="w-full drop-shadow-xl"
      data-wristband-artwork
    >
      <title>{`${p.material} wristband design`}</title>
      <rect
        x="12"
        y={(230 - height) / 2}
        width="696"
        height={height}
        rx={p.material === 'Silicone' ? 28 : 8}
        fill={p.color}
        stroke="#00000020"
      />
      {p.material !== 'Silicone' && (
        <>
          <path
            d={`M94 ${(230 - height) / 2 + 6}v${height - 12}`}
            stroke={p.ink}
            strokeOpacity=".25"
            strokeDasharray="3 4"
          />
          {p.showBrand !== false && (
            <BrandLogo
              x={28}
              y={109}
              width={50}
              height={12}
              color={p.ink}
              tagline={false}
              className=""
            />
          )}
        </>
      )}
      {p.guides && p.onChange && (
        <g
          aria-hidden="true"
          pointerEvents="none"
          stroke="#2563eb"
          strokeOpacity=".4"
          strokeDasharray="4 4"
        >
          <path d={`M106 115H702M404 ${(230 - height) / 2 + 6}v${height - 12}`} />
          <rect x="106" y={(230 - height) / 2 + 6} width="596" height={height - 12} fill="none" />
        </g>
      )}
      <text
        x={p.logos.length ? 414 : 382}
        y={p.subtitle ? 113 : 122}
        textAnchor="middle"
        fill={p.ink}
        fontFamily={p.font}
        fontWeight="900"
        fontSize={Math.min(24, 740 / Math.max(p.message.length, 1))}
        letterSpacing="1"
      >
        {p.message}
      </text>
      {p.subtitle && (
        <text
          x={p.logos.length ? 414 : 382}
          y="132"
          textAnchor="middle"
          fill={p.ink}
          fontFamily={p.font}
          fontSize="10"
          letterSpacing="2"
        >
          {p.subtitle}
        </text>
      )}
      {p.logos.map((layer) => {
        const b = logoBounds(layer, p.material);
        return (
          <g
            key={layer.id}
            data-logo-id={layer.id}
            role={p.onSelect ? 'button' : undefined}
            tabIndex={p.onSelect ? 0 : undefined}
            aria-label={`${layer.name}${p.selected === layer.id ? ', selected' : ''}`}
            style={p.onChange ? { cursor: 'grab', touchAction: 'none' } : undefined}
            onPointerDown={
              p.onChange
                ? (event) => {
                    event.preventDefault();
                    p.onEditStart?.();
                    p.onSelect?.(layer.id);
                    const pt = point(event);
                    drag.current = {
                      id: layer.id,
                      x: layer.x,
                      y: layer.y,
                      clientX: pt.x,
                      clientY: pt.y,
                      travelX: b.travelX,
                      travelY: b.travelY,
                      resizing:
                        (event.target as SVGElement).getAttribute('data-resize-handle') === 'true',
                      layer,
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }
                : undefined
            }
            onPointerMove={
              p.onChange
                ? (event) => {
                    const d = drag.current;
                    if (!d || d.id !== layer.id) return;
                    const pt = point(event);
                    if (d.resizing) {
                      const original = logoBounds(d.layer, p.material);
                      const scale =
                        1 +
                        ((pt.x - d.clientX) * original.width +
                          (pt.y - d.clientY) * original.height) /
                          (original.width ** 2 + original.height ** 2);
                      const size = Math.max(5, Math.min(100, d.layer.size * scale));
                      const resized = logoBounds({ ...d.layer, size }, p.material);
                      const top = (230 - (height - 12)) / 2;
                      p.onChange?.(layer.id, {
                        size,
                        x: clampPosition(((original.x - 106) / Math.max(1, resized.travelX)) * 100),
                        y: clampPosition(((original.y - top) / Math.max(1, resized.travelY)) * 100),
                      });
                      return;
                    }
                    p.onChange?.(layer.id, {
                      x: clampPosition(d.x + ((pt.x - d.clientX) / Math.max(1, d.travelX)) * 100),
                      y: clampPosition(d.y + ((pt.y - d.clientY) / Math.max(1, d.travelY)) * 100),
                    });
                  }
                : undefined
            }
            onPointerUp={() => {
              drag.current = null;
              p.onEditEnd?.();
            }}
            onPointerCancel={() => {
              drag.current = null;
              p.onEditEnd?.();
            }}
            onLostPointerCapture={() => {
              drag.current = null;
              p.onEditEnd?.();
            }}
            onKeyDown={
              p.onChange
                ? (event) => {
                    const step = event.shiftKey ? 5 : 1;
                    const delta: Record<string, [number, number]> = {
                      ArrowLeft: [-step, 0],
                      ArrowRight: [step, 0],
                      ArrowUp: [0, -step],
                      ArrowDown: [0, step],
                    };
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      p.onSelect?.(layer.id);
                    }
                    if (delta[event.key]) {
                      event.preventDefault();
                      p.onSelect?.(layer.id);
                      p.onChange?.(layer.id, {
                        x: clampPosition(layer.x + delta[event.key][0]),
                        y: clampPosition(layer.y + delta[event.key][1]),
                      });
                    }
                  }
                : undefined
            }
          >
            <image
              href={layer.src}
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              preserveAspectRatio="xMidYMid meet"
            />
            {p.onChange && (
              <rect
                x={b.x - 2}
                y={b.y - 2}
                width={b.width + 4}
                height={b.height + 4}
                fill="transparent"
                stroke={p.selected === layer.id ? '#2563eb' : 'transparent'}
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
            )}
            {p.onChange && p.selected === layer.id && (
              <rect
                data-resize-handle="true"
                x={b.x + b.width - 6}
                y={b.y + b.height - 6}
                width="12"
                height="12"
                rx="2"
                fill="#2563eb"
                stroke="white"
                strokeWidth="1.5"
                style={{ cursor: 'nwse-resize' }}
              >
                <title>Drag to resize</title>
              </rect>
            )}
          </g>
        );
      })}
    </svg>
  );
}
