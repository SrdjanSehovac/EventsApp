import { memo, useMemo } from 'react';
import { View } from 'react-native';
import qrcode from 'qrcode-generator';

/**
 * Pure-JS QR code drawn with Views (no react-native-svg in the 1.1.0 build).
 * Each row merges runs of dark modules into one View, so a ticket QR is
 * ~200 views instead of ~1000.
 */
function QrCodeImpl({ value, size = 220, quiet = 2 }: { value: string; size?: number; quiet?: number }) {
  const rows = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    const out: { y: number; runs: [number, number][] }[] = [];
    for (let y = 0; y < n; y += 1) {
      const runs: [number, number][] = [];
      let start = -1;
      for (let x = 0; x <= n; x += 1) {
        const dark = x < n && qr.isDark(y, x);
        if (dark && start < 0) start = x;
        if (!dark && start >= 0) {
          runs.push([start, x - start]);
          start = -1;
        }
      }
      out.push({ y, runs });
    }
    return { n, out };
  }, [value]);

  const total = rows.n + quiet * 2;
  const cell = Math.floor(size / total);
  const side = cell * total;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Ticket QR code"
      style={{ width: side, height: side, backgroundColor: '#FFFFFF' }}
    >
      {rows.out.map(({ y, runs }) =>
        runs.map(([x, len]) => (
          <View
            key={`${y}-${x}`}
            style={{
              position: 'absolute',
              left: (x + quiet) * cell,
              top: (y + quiet) * cell,
              width: len * cell,
              height: cell,
              backgroundColor: '#000000',
            }}
          />
        )),
      )}
    </View>
  );
}

export const QrCode = memo(QrCodeImpl);
