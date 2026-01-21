import { rm } from 'node:fs/promises'

const outdir = 'demo/.bundle'

const build = await Bun.build({
  entrypoints: ['demo/demo.tsx'],
  target: 'browser',
  minify: true,
  sourcemap: 'none',
  outdir,
})

if (!build.success) {
  console.error('Failed to build demo bundle')
  for (const message of build.logs) {
    console.error(message.message)
  }
  process.exit(1)
}

const output = build.outputs.find((item) => item.path.endsWith('.js'))
if (!output) {
  console.error('No JavaScript output generated')
  process.exit(1)
}

const js = await output.text()
const safeJs = js.replace(/<\/script>/g, '<\\/script>')

const html = `<!doctype html>
<html lang="en" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Anchor Stack Demo</title>
    <link
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Manrope:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <style>
      body {
        font-family: 'Manrope', system-ui, -apple-system, sans-serif;
      }
      h1, h2, h3 {
        font-family: 'Fraunces', serif;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${safeJs}</script>
  </body>
</html>
`

await Bun.write('demo/index.html', html)
await rm(outdir, { recursive: true, force: true })
console.log('demo/index.html generated')
