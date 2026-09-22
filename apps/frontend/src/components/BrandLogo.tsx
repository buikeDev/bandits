type BrandLogoProps = {
  className?: string;
  tagline?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
};

/** Brand-reference wordmark: bold lettering, yellow hyphen, spaced tagline. */
export default function BrandLogo({
  className = 'w-36',
  tagline = true,
  x,
  y,
  width,
  height,
  color,
}: BrandLogoProps) {
  return (
    <svg
      viewBox={`0 0 240 ${tagline ? 76 : 52}`}
      role="img"
      aria-label="BAND-IT"
      className={`inline-block shrink-0 ${className}`}
      fill="currentColor"
      x={x}
      y={y}
      width={width}
      height={height}
      color={color}
    >
      <text
        x="0"
        y="44"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="48"
        letterSpacing="-1.5"
        textLength="238"
        lengthAdjust="spacingAndGlyphs"
      >
        BAND<tspan fill="#f5c400">-</tspan>IT
      </text>
      {tagline && (
        <text
          x="2"
          y="69"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="9"
          fontWeight="600"
          letterSpacing="3.15"
          textLength="236"
          lengthAdjust="spacing"
        >
          BANDS & VIBES
        </text>
      )}
    </svg>
  );
}
