export default function ProductFeatureIcon({
  kind,
}: {
  kind: 'shield' | 'feather' | 'lock' | 'sparkle' | 'ticket';
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'shield' && (
        <>
          <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
          <path d="m8 12 3 3 5-6" />
        </>
      )}
      {kind === 'feather' && (
        <>
          <path d="M5 19 17 7M7 17C1 7 13 1 20 4c1 8-4 16-13 13Z" />
          <path d="M10 14v-4M13 11h4" />
        </>
      )}
      {kind === 'lock' && (
        <>
          <rect x="6" y="10" width="12" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
        </>
      )}
      {kind === 'sparkle' && (
        <>
          <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
          <path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5Z" />
        </>
      )}
      {kind === 'ticket' && (
        <>
          <path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z" />
          <path d="M9 5v14" strokeDasharray="2 2" />
        </>
      )}
    </svg>
  );
}
