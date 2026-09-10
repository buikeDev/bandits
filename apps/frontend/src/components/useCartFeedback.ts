'use client';

import { useEffect, useRef, useState } from 'react';

export function useCartFeedback() {
  const [adding, setAdding] = useState(false);
  const busy = useRef(false);
  const active = useRef(true);
  const animations = useRef<Animation[]>([]);
  const particle = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      animations.current.forEach((animation) => animation.cancel());
      particle.current?.remove();
    };
  }, []);

  async function confirm(button: HTMLButtonElement, color: string) {
    busy.current = true;
    setAdding(true);
    const cart = document.querySelector<HTMLElement>('[data-order-cart]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      if (!reduced && cart && typeof button.animate === 'function') {
        const start = button.getBoundingClientRect();
        const end = cart.getBoundingClientRect();
        const x = start.left + start.width / 2;
        const y = start.top + start.height / 2;
        const dx = end.left + end.width / 2 - x;
        const dy = end.top + end.height / 2 - y;
        const ball = document.createElement('div');
        ball.setAttribute('aria-hidden', 'true');
        Object.assign(ball.style, {
          position: 'fixed',
          left: `${x - 22}px`,
          top: `${y - 22}px`,
          width: '44px',
          height: '44px',
          pointerEvents: 'none',
          zIndex: '9999',
          borderRadius: '14px',
          backgroundColor: color,
          backgroundImage: 'linear-gradient(135deg, #ffffffaa, transparent 45%, #00000033)',
          border: '2px solid #ffffff',
          boxShadow: '0 8px 18px #00000030',
        });
        document.body.appendChild(ball);
        particle.current = ball;
        const flight = ball.animate(
          [
            {
              transform: 'translate(0, 0) rotate(-20deg) scale(1)',
              borderRadius: '14px',
              offset: 0,
            },
            {
              transform: `translate(${dx * 0.35}px, ${Math.min(dy * 0.65, -120)}px) rotate(140deg) scale(.8)`,
              borderRadius: '50%',
              offset: 0.45,
            },
            {
              transform: `translate(${dx}px, ${dy}px) rotate(420deg) scale(.15)`,
              borderRadius: '50%',
              opacity: 0.4,
              offset: 1,
            },
          ],
          { duration: 760, easing: 'cubic-bezier(.3,.05,.55,1)', fill: 'forwards' }
        );
        const press = button.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(.96)', backgroundColor: '#bbf7d0' },
            { transform: 'scale(1)' },
          ],
          { duration: 420 }
        );
        animations.current = [flight, press];
        await flight.finished;
        ball.remove();
        const bounce = cart.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.35) rotate(-12deg)', backgroundColor: '#fbbf24' },
            { transform: 'scale(.95) rotate(8deg)' },
            { transform: 'scale(1)' },
          ],
          { duration: 380 }
        );
        animations.current = [bounce];
        await bounce.finished;
      }
    } catch {
      // Interrupted animations must never interrupt a successfully saved order.
    } finally {
      particle.current?.remove();
      particle.current = null;
      animations.current = [];
      busy.current = false;
      if (active.current) setAdding(false);
    }
    return active.current;
  }

  return { adding, busy, confirm };
}
