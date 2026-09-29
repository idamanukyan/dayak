import type { Config } from 'tailwindcss';
import preset from '@dayak/config/tailwind';

export default {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx}',
    // shadcn components live under src/components
  ],
} satisfies Config;
