'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { OrderPricing } from './order-pricing';
import { isLogoLayer, type LogoLayer } from './logo-layout';

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
  logos?: LogoLayer[];
  quantity: number;
  product?: {
    id: string;
    slug: string;
    name: string;
    variantId: string;
    variantName: string;
    availableQuantity: number;
    pricing?: OrderPricing;
  };
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
    (item.product !== undefined
      ? isCatalogProduct(item.product)
      : ['Tyvek', 'Vinyl', 'Silicone', 'Fabric'].includes(String(item.material))) &&
    /^#[0-9a-f]{6}$/i.test(String(item.color)) &&
    /^#[0-9a-f]{6}$/i.test(String(item.ink)) &&
    (item.logo === '' || /^data:image\/(png|jpeg|webp);base64,/.test(String(item.logo))) &&
    (item.logos === undefined ||
      (Array.isArray(item.logos) &&
        item.logos.every(isLogoLayer) &&
        new Set(item.logos.map((layer) => layer.id)).size === item.logos.length))
  );
}

function isCatalogProduct(value: unknown): value is NonNullable<DesignItem['product']> {
  if (!value || typeof value !== 'object') return false;
  const product = value as Record<string, unknown>;
  return (
    ['id', 'slug', 'name', 'variantId', 'variantName'].every(
      (field) => typeof product[field] === 'string' && String(product[field]).length > 0
    ) &&
    Number.isInteger(product.availableQuantity) &&
    Number(product.availableQuantity) >= 0
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
          if (item.product) {
            const reserved = current.current
              .filter((line) => line.product?.variantId === item.product?.variantId)
              .reduce((sum, line) => sum + line.quantity, 0);
            if (reserved + item.quantity > item.product.availableQuantity) {
              setError(
                `Only ${Math.max(0, item.product.availableQuantity - reserved)} more units of this colour can be added to your order.`
              );
              return false;
            }
          }
          return ready && isDesignItem(design) && save([...current.current, design]);
        },
        remove: (id) => {
          save(current.current.filter((item) => item.id !== id));
        },
        updateQuantity: (id, quantity) => {
          const item = current.current.find((line) => line.id === id);
          if (item?.product) {
            const others = current.current
              .filter(
                (line) => line.id !== id && line.product?.variantId === item.product?.variantId
              )
              .reduce((sum, line) => sum + line.quantity, 0);
            if (others + quantity > item.product.availableQuantity) {
              setError(
                `This colour has ${item.product.availableQuantity} units available across your order.`
              );
              return;
            }
          }
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
