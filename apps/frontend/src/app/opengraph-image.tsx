import { ImageResponse } from 'next/og';

export const alt = 'BAND-IT — People. Events. Brands.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#111111',
          color: 'white',
          display: 'flex',
          height: '100%',
          width: '100%',
          padding: '76px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 68, fontWeight: 800, letterSpacing: -3 }}>
            <span>BAND</span><span style={{ color: '#f5c400', margin: '0 4px' }}>-</span><span>IT</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#f5c400', fontSize: 24, fontWeight: 700, letterSpacing: 3 }}>PEOPLE. EVENTS. BRANDS.</span>
            <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: -2, marginTop: 22 }}>Wristbands for every occasion.</span>
          </div>
        </div>
        <div
          style={{
            background: '#f5c400',
            borderRadius: 999,
            bottom: -165,
            display: 'flex',
            height: 480,
            position: 'absolute',
            right: -125,
            width: 480,
          }}
        />
      </div>
    ),
    size
  );
}
