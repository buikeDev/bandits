'use client';

import { useRef, useState } from 'react';
import type { LogoLayer } from './logo-layout';

export function useLogoHistory() {
  const [logos, render] = useState<LogoLayer[]>([]);
  const current = useRef<LogoLayer[]>([]);
  const past = useRef<LogoLayer[][]>([]);
  const future = useRef<LogoLayer[][]>([]);
  const group = useRef(false);
  const recorded = useRef(false);
  function setLogos(value: LogoLayer[] | ((layers: LogoLayer[]) => LogoLayer[])) {
    const next = typeof value === 'function' ? value(current.current) : value;
    if (
      next.length === current.current.length &&
      next.every((layer, index) => {
        const previous = current.current[index];
        return Object.keys(layer).every(
          (key) => layer[key as keyof LogoLayer] === previous[key as keyof LogoLayer]
        );
      })
    )
      return;
    if (!group.current || !recorded.current) {
      past.current = [...past.current.slice(-39), current.current];
      recorded.current = true;
    }
    future.current = [];
    current.current = next;
    render(next);
  }
  function begin() {
    if (!group.current) {
      group.current = true;
      recorded.current = false;
    }
  }
  function end() {
    group.current = false;
    recorded.current = false;
  }
  function undo() {
    end();
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(current.current);
    current.current = previous;
    render(previous);
  }
  function redo() {
    end();
    const next = future.current.pop();
    if (!next) return;
    past.current.push(current.current);
    current.current = next;
    render(next);
  }
  return {
    logos,
    setLogos,
    begin,
    end,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
