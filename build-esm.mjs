import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

function parseArgs(argv) {
  const out = {
    entry: null,
    config: path.resolve(process.cwd(), 'vite.config.izzi.esm.js'),
    outDir: null,
    outFile: null,
    install: false,
    global: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--entry') out.entry = argv[++i]
    else if (a === '--config') out.config = argv[++i]
    else if (a === '--outDir') out.outDir = argv[++i]
    else if (a === '--outFile') out.outFile = argv[++i]
    else if (a === '--install') out.install = true
    else if (a === '--global') out.global = true
  }

  return out
}

function resolveFromGlobalRoot(pkg, globalRoot) {
  const require = createRequire(import.meta.url)
  return require.resolve(pkg, { paths: [globalRoot] })
}

async function ensureDependencies({ install, global, globalRoot }) {
  const required = ['vite', '@vitejs/plugin-react', '@tailwindcss/vite']

  const missing = []
  for (const pkg of required) {
    try {
      if (global) {
        if (!globalRoot) throw new Error('globalRoot is required in --global mode')
        resolveFromGlobalRoot(pkg, globalRoot)
      } else {
        await import(pkg)
      }
    } catch {
      missing.push(pkg)
    }
  }

  if (missing.length === 0) return

  if (!install) {
    console.error(
      `Missing dependencies: ${missing.join(', ')}\n` +
        (global
          ? `Run: pnpm add -g ${missing.join(' ')}\n`
          : `Run: pnpm add -D ${missing.join(' ')}\n`) +
        `Or re-run this script with: --install ${global ? '--global' : ''}`.trim()
    )
    process.exit(1)
  }

  if (global) {
    execSync(`pnpm add -g ${missing.join(' ')}`, { stdio: 'inherit' })
  } else {
    execSync(`pnpm add -D ${missing.join(' ')}`, { stdio: 'inherit' })
  }
}

async function importPkg(pkg, { globalRoot }) {
  if (!globalRoot) return import(pkg)

  const require = createRequire(import.meta.url)
  const resolved = require.resolve(pkg, { paths: [globalRoot] })
  return import(pathToFileURL(resolved).href)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.entry) {
    console.error(
      'Usage: node scripts/build-izzi-esm.mjs --entry <path/to/entry.jsx> [--outFile Lumi.mount.esm.js] [--outDir dist] [--config vite.config.izzi.esm.js] [--install] [--global]'
    )
    process.exit(1)
  }

  let globalRoot = null
  if (args.global) {
    try {
      globalRoot = execSync('pnpm root -g', { encoding: 'utf8' }).trim()
    } catch (e) {
      console.error('Failed to resolve pnpm global root. Is pnpm installed and available on PATH?')
      process.exit(1)
    }
  }

  await ensureDependencies({
    install: args.install,
    global: args.global,
    globalRoot,
  })

  const viteMod = await importPkg('vite', { globalRoot })
  const reactMod = await importPkg('@vitejs/plugin-react', { globalRoot })
  const tailwindMod = await importPkg('@tailwindcss/vite', { globalRoot })

  const { build, loadConfigFromFile, mergeConfig } = viteMod
  const react = reactMod.default
  const tailwindcss = tailwindMod.default

  const root = process.cwd()
  const entryAbs = path.resolve(root, args.entry)
  const configAbs = path.resolve(root, args.config)

  function stripTailwindSupports() {
    const re =
      /@supports\s*\((?:[^)]*?-webkit-hyphens[^)]*?|[^)]*?-moz-orient[^)]*?|[^)]*?color:rgb\(from red[^)]*?\))\)\s*\{([\s\S]*?)\}\s*/g

    return {
      name: 'strip-tailwind-supports',
      apply: 'build',
      generateBundle(_, bundle) {
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (
            fileName.endsWith('.css') &&
            chunk.type === 'asset' &&
            typeof chunk.source === 'string'
          ) {
            const before = chunk.source
            const after = before.replace(re, '$1')
            chunk.source = after
          }
        }
      },
    }
  }

  function reactNoNamedImportsFromReact() {
    return {
      name: 'react-no-named-imports-from-react',
      enforce: 'pre',
      transform(code, id) {
        if (!id) return null
        if (id.includes('node_modules')) return null
        if (!/\.(jsx|tsx|js|ts)$/.test(id)) return null

        const reReactDefaultAndNamed =
          /(^|\n)\s*import\s+React\s*,\s*\{([^}]*)\}\s*from\s*['\"]react['\"]\s*;?/g
        const reReactNamedOnly =
          /(^|\n)\s*import\s*\{([^}]*)\}\s*from\s*['\"]react['\"]\s*;?/g

        let named = []
        let out = code

        out = out.replace(reReactDefaultAndNamed, (m, p1, names) => {
          named.push(
            ...names
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          )
          return `${p1}import React from 'react';`
        })

        out = out.replace(reReactNamedOnly, (m, p1, names) => {
          named.push(
            ...names
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          )
          return `${p1}import React from 'react';`
        })

        named = named
          .map((s) => s.replace(/\s+/g, ' ').trim())
          .filter(Boolean)

        if (named.length === 0) return null
        if (named.some((s) => /\sas\s/.test(s))) return null

        named = [...new Set(named)]

        const lines = out.split(/\r?\n/)
        let lastImportLine = -1
        for (let i = 0; i < lines.length; i++) {
          if (/^\s*import\s/.test(lines[i])) lastImportLine = i
        }

        const injection = `const { ${named.join(', ')} } = React;`
        if (lines.some((l) => l.trim() === injection)) return null

        if (lastImportLine === -1) {
          return {
            code: `import React from 'react';\n${injection}\n${out}`,
            map: null,
          }
        }

        lines.splice(lastImportLine + 1, 0, injection)

        return {
          code: lines.join('\n'),
          map: null,
        }
      },
    }
  }

  function reactExternalToGlobal() {
    return {
      name: 'react-external-to-global',
      apply: 'build',
      generateBundle(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue
          if (typeof chunk.code !== 'string') continue

          chunk.code = chunk.code.replace(
            /(^|\r?\n)\s*import\s+([A-Za-z_$][\w$]*)\s+from\s*["']react["']\s*;?/m,
            (_, prefix, ident) => `${prefix}const ${ident}=React;`
          )

          chunk.code = chunk.code.replace(
            /(^|\r?\n)\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s*["']react["']\s*;?/m,
            (_, prefix, ident) => `${prefix}const ${ident}=React;`
          )
        }
      },
    }
  }

  const baseConfig = {
    root,
    plugins: [
      reactNoNamedImportsFromReact(),
      reactExternalToGlobal(),
      react({ jsxRuntime: 'classic' }),
      tailwindcss(),
      stripTailwindSupports(),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      lib: {
        entry: entryAbs,
        fileName: () => (args.outFile ? args.outFile : 'Lumi.mount.esm.js'),
        formats: ['es'],
      },
      outDir: args.outDir ? path.resolve(root, args.outDir) : undefined,
      emptyOutDir: false,
      minify: 'esbuild',
      rollupOptions: {
        external: ['react'],
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  }

  let finalConfig = baseConfig
  if (args.config && fs.existsSync(configAbs)) {
    const loaded = await loadConfigFromFile(
      { command: 'build', mode: 'production' },
      configAbs
    )
    if (loaded?.config) {
      finalConfig = mergeConfig(loaded.config, baseConfig)
    }
  }

  await build(finalConfig)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
