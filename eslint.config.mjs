import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// ESLint owns ONLY the Next.js framework layer (next/image, Core Web Vitals,
// React Hooks, jsx-a11y). Formatting, import sorting, and general JS/TS lint
// are handled by Biome (see biome.json) to avoid overlapping/duplicate work.
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      'public/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // The help page uses `// label` as intentional "eyebrow" heading text,
      // not stray JS comments, so this is a design choice rather than a bug.
      'react/jsx-no-comment-textnodes': 'warn',
    },
  },
];

export default eslintConfig;
