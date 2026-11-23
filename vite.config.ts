import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function cleanEnvValue(raw: string | undefined): string {
  return (raw || '').trim().replace(/^["']|["']$/g, '').trim();
}

function findEnvBySuffix(
  sources: Record<string, string | undefined>[],
  preferredKeys: string[],
  suffixRegex: RegExp,
  excludeRegex: RegExp,
): string {
  for (const key of preferredKeys) {
    for (const src of sources) {
      const val = cleanEnvValue(src[key]);
      if (val) return val;
    }
  }
  for (const src of sources) {
    for (const [key, rawVal] of Object.entries(src)) {
      if (excludeRegex.test(key)) continue;
      if (suffixRegex.test(key)) {
        const val = cleanEnvValue(rawVal);
        if (val) return val;
      }
    }
  }
  return '';
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const sources = [env, process.env];
  const supabaseUrl = findEnvBySuffix(
    sources,
    ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
    /SUPABASE_URL$/i,
    /POSTGRES|DATABASE|PRISMA/i,
  );
  const supabaseAnonKey = findEnvBySuffix(
    sources,
    [
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_ANON_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
    ],
    /SUPABASE_(ANON|PUBLISHABLE)_KEY$/i,
    /SERVICE|SECRET|ADMIN|JWT/i,
  );

  return {
    define: {
      ...(supabaseUrl
        ? {'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl)}
        : {}),
      ...(supabaseAnonKey
        ? {'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey)}
        : {}),
    },
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(import.meta.dirname, 'dist');
          const srcAssets = path.resolve(import.meta.dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
