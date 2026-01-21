const root = new URL('../demo/', import.meta.url)

const server = Bun.serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url)
    let pathname = decodeURIComponent(url.pathname)
    if (pathname === '/') {
      pathname = '/index.html'
    }

    const file = Bun.file(new URL(`.${pathname}`, root))
    if (!(await file.exists())) {
      return new Response('Not found', { status: 404 })
    }

    return new Response(file)
  },
})

console.log(`Demo server running on http://localhost:${server.port}`)
