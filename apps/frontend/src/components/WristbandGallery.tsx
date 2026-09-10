'use client';

import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

function Band({
  color,
  name,
  reverse = false,
}: {
  color: string;
  name: string;
  reverse?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 600 500"
      role="img"
      aria-label={`${name} wristband, ${reverse ? 'reverse' : 'front'} view`}
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={`${id}outer`} x1="0" y1="0" x2="1" y2=".5">
          <stop stopColor={color} />
          <stop offset=".45" stopColor={color} />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
        <linearGradient id={`${id}inner`} x2="0" y2="1">
          <stop stopColor="#c8c4bc" />
          <stop offset="1" stopColor="#faf9f5" />
        </linearGradient>
        <filter id={`${id}shadow`}>
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <ellipse
        cx="305"
        cy="390"
        rx="174"
        ry="24"
        fill="#756e61"
        opacity=".2"
        filter={`url(#${id}shadow)`}
      />
      <g
        transform={
          reverse ? 'translate(600 0) scale(-1 1) rotate(-12 300 250)' : 'rotate(-12 300 250)'
        }
      >
        <ellipse
          cx="300"
          cy="208"
          rx="217"
          ry="111"
          fill={`url(#${id}inner)`}
          stroke="#fff"
          strokeWidth="2"
        />
        <path
          d="M 83 208 C 83 350 517 350 517 208 L 517 299 C 517 441 83 441 83 299 Z"
          fill={color}
        />
        <path
          d="M 83 208 C 83 350 517 350 517 208 L 517 299 C 517 441 83 441 83 299 Z"
          fill={`url(#${id}outer)`}
        />
        <path
          d="M 83 208 C 83 350 517 350 517 208"
          fill="none"
          stroke="#ffffff99"
          strokeWidth="2"
        />
        <path d="M 462 265 L 462 357" stroke="#00000020" strokeWidth="2" strokeDasharray="3 4" />
      </g>
    </svg>
  );
}

export default function WristbandGallery({ color, name }: { color: string; name: string }) {
  const [view, setView] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="order-2 flex gap-3 sm:order-1 sm:w-16 sm:flex-col">
          {['Front view', 'Reverse view', 'More wristbands'].map((label, index) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              aria-pressed={view === index}
              onClick={() => setView(index)}
              className={`h-16 w-16 overflow-hidden rounded-xl border bg-[#e9e6e0] ${view === index ? 'border-amber-400 ring-1 ring-amber-400' : 'border-transparent'}`}
            >
              {index < 2 ? (
                <Band color={color} name={name} reverse={index === 1} />
              ) : (
                <Image
                  src="/images/hero-wristbands.png"
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
        <div className="relative order-1 aspect-[.95] min-w-0 flex-1 overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_30%_20%,#faf9f6,#e5e1da)] sm:order-2">
          {view < 2 ? (
            <Band color={color} name={name} reverse={view === 1} />
          ) : (
            <Image
              src="/images/hero-wristbands.png"
              alt="Colourful wristband collection"
              fill
              sizes="(min-width: 1024px) 50vw, 90vw"
              className="object-contain p-6"
            />
          )}
          <button
            type="button"
            onClick={() => dialog.current?.showModal()}
            aria-label="Enlarge wristband preview"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-lg shadow-sm"
          >
            ⤢
          </button>
          <span className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1 text-[11px] font-bold">
            {view + 1} / 3
          </span>
          <span className="absolute bottom-4 right-4 text-[10px] text-neutral-500">
            {view === 2 ? 'Collection inspiration' : `${name} · Colour illustration`}
          </span>
        </div>
      </div>
      <div className="relative mt-5 overflow-hidden rounded-2xl bg-[#fff1c5] p-6 sm:ml-[76px]">
        <div className="relative z-10 max-w-[58%]">
          <p className="text-2xl font-black leading-tight tracking-tight">
            Perfect for
            <br />
            every occasion.
          </p>
          <p className="mt-3 text-xs leading-5 text-neutral-600">
            From festivals to corporate events, find a wristband that belongs at yours.
          </p>
          <Link href="#occasions" className="button-primary mt-4">
            Explore use cases <span className="ml-4">→</span>
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-16 top-0 h-full w-3/4">
          <Band color={color} name={name} />
        </div>
      </div>
      <dialog
        ref={dialog}
        className="w-[min(90vw,800px)] rounded-2xl bg-[#eeeae3] p-4 backdrop:bg-black/60"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <button
          type="button"
          autoFocus
          onClick={() => dialog.current?.close()}
          className="float-right rounded-full bg-white px-4 py-2"
          aria-label="Close preview"
        >
          ✕
        </button>
        <div className="clear-both aspect-[1.2]">
          {view < 2 ? (
            <Band color={color} name={name} reverse={view === 1} />
          ) : (
            <Image
              src="/images/hero-wristbands.png"
              alt="Wristband collection"
              width={800}
              height={600}
              className="h-full w-full object-contain"
            />
          )}
        </div>
      </dialog>
    </div>
  );
}
