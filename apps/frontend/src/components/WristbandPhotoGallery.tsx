'use client';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
const filters: Record<string, string> = {
  pink: 'hue-rotate(280deg)',
  blue: 'hue-rotate(160deg)',
  red: 'hue-rotate(315deg)',
  green: 'hue-rotate(65deg)',
  purple: 'hue-rotate(210deg)',
  orange: 'hue-rotate(335deg)',
  black: 'grayscale(1) brightness(.4)',
  white: 'grayscale(1) brightness(1.35)',
  silver: 'grayscale(1)',
};
export default function WristbandPhotoGallery({ name }: { color: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = {
    src: '/images/product-plain.png',
    label: 'Plain ' + name.toLowerCase() + ' wristband without printing',
    filter: filters[name.toLowerCase()] ?? '',
  };
  return (
    <div className="gallery-column">
      <div className="photo-gallery">
        <div className="gallery-main">
          <Image
            src={photo.src}
            alt={photo.label}
            fill
            priority
            sizes="(min-width:850px) 550px,100vw"
            style={{ filter: photo.filter, objectFit: 'contain' }}
          />
          <button
            type="button"
            className="gallery-zoom"
            aria-label="Enlarge photo"
            onClick={() => dialog.current?.showModal()}
          >
            ⤢
          </button>
        </div>
      </div>
      <div className="gallery-promo">
        <Image
          src="/images/product-promo.png"
          alt="Yellow, pink and blue printed wristbands"
          fill
          sizes="550px"
        />
        <div className="promo-copy">
          <h2>
            Perfect for
            <br />
            every occasion.
          </h2>
          <p>
            From festivals to corporate events, BAND-IT wristbands keep your crowd organised and your
            brand visible.
          </p>
          <Link href="#occasions">
            Explore use cases <span>→</span>
          </Link>
        </div>
      </div>
      <p className="gallery-note">
        Plain wristband preview shown. Your order uses your selected colour and units.
      </p>
      <dialog
        ref={dialog}
        className="w-[min(90vw,800px)] rounded-xl bg-white p-4 backdrop:bg-black/60"
      >
        <button
          autoFocus
          type="button"
          onClick={() => dialog.current?.close()}
          className="float-right px-3 py-2"
          aria-label="Close photo"
        >
          ✕
        </button>
        <Image
          src={photo.src}
          alt={photo.label}
          width={1447}
          height={1087}
          className="max-h-[80vh] w-full object-contain"
          style={{ filter: photo.filter }}
        />
      </dialog>
    </div>
  );
}
