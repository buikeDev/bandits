'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

export type DesignItem = {
  id: string;
  material: string;
  color: string;
  colorName: string;
  ink: string;
  message: string;
  subtitle: string;
  font: string;
  logo: string;
  quantity: number;
};
const key = 'bandit-design-order-v1';
export function isDesignItem(value: unknown): value is DesignItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    ['id', 'material', 'color', 'colorName', 'ink', 'message', 'subtitle', 'font', 'logo'].every(
      (field) => typeof item[field] === 'string'
    ) &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) >= 1 &&
    Number(item.quantity) <= 100000 &&
    ['Tyvek', 'Vinyl', 'Silicone', 'Fabric'].includes(String(item.material)) &&
    /^#[0-9a-f]{6}$/i.test(String(item.color)) &&
    /^#[0-9a-f]{6}$/i.test(String(item.ink)) &&
    (item.logo === '' || /^data:image\/(png|jpeg|webp);base64,/.test(String(item.logo)))
  );
}

const OrderContext = createContext<{
  items: DesignItem[];
  ready: boolean;
  error: string;
  add: (item: Omit<DesignItem, 'id'>) => boolean;
  remove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
} | null>(null);

export function DesignOrderProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DesignItem[]>([]);
  const current = useRef<DesignItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(stored) || !stored.every(isDesignItem)) throw new Error();
      current.current = stored;
      setItems(stored);
    } catch {
      setError(
        'Your saved designs could not be loaded. Please check that browser storage is available.'
      );
    }
    setReady(true);
  }, []);

  function save(next: DesignItem[]) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      current.current = next;
      setItems(next);
      setError('');
      return true;
    } catch {
      setError(
        'Your changes could not be saved. Browser storage may be full or unavailable. Try a smaller logo.'
      );
      return false;
    }
  }

  return (
    <OrderContext.Provider
      value={{
        items,
        ready,
        error,
        add: (item) => {
          const design = { ...item, id: crypto.randomUUID() };
          return ready && isDesignItem(design) && save([...current.current, design]);
        },
        remove: (id) => {
          save(current.current.filter((item) => item.id !== id));
        },
        updateQuantity: (id, quantity) => {
          if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 100000)
            save(current.current.map((item) => (item.id === id ? { ...item, quantity } : item)));
        },
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useDesignOrder() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('DesignOrderProvider is required');
  return context;
}
