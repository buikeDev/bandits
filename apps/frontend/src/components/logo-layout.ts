export type LogoLayer = {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  size: number;
  aspect: number;
};
export const bandHeight = (material: string) =>
  ({ Tyvek: 76, Vinyl: 100, Silicone: 60, Fabric: 68 })[material] ?? 76;
export function logoBounds(layer: LogoLayer, material: string) {
  const height = bandHeight(material) - 12;
  const width = (Math.min(596, height * layer.aspect) * layer.size) / 100;
  const logoHeight = width / layer.aspect;
  return {
    x: 106 + ((596 - width) * layer.x) / 100,
    y: (230 - height) / 2 + ((height - logoHeight) * layer.y) / 100,
    width,
    height: logoHeight,
    travelX: 596 - width,
    travelY: height - logoHeight,
  };
}
export function isLogoLayer(value: unknown): value is LogoLayer {
  if (!value || typeof value !== 'object') return false;
  const layer = value as Record<string, unknown>;
  return (
    typeof layer.id === 'string' &&
    typeof layer.name === 'string' &&
    typeof layer.src === 'string' &&
    /^data:image\/(png|jpeg|webp);base64,/.test(layer.src) &&
    ['x', 'y', 'size', 'aspect'].every(
      (key) => typeof layer[key] === 'number' && Number.isFinite(layer[key])
    ) &&
    Number(layer.x) >= 0 &&
    Number(layer.x) <= 100 &&
    Number(layer.y) >= 0 &&
    Number(layer.y) <= 100 &&
    Number(layer.size) >= 5 &&
    Number(layer.size) <= 100 &&
    Number(layer.aspect) > 0 &&
    Number(layer.aspect) <= 10000
  );
}
export const clampPosition = (value: number) => Math.max(0, Math.min(100, value));
