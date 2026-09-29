import { Inter, Noto_Sans_Armenian } from 'next/font/google';

// Latin + Cyrillic (ru/en). See design spec: Inter renders these cleanly.
export const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

// Armenian source locale needs proper Armenian glyphs.
export const notoArmenian = Noto_Sans_Armenian({
  subsets: ['armenian'],
  variable: '--font-sans',
  display: 'swap',
});
