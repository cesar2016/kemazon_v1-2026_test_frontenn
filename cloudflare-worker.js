export default {
  fetch(request) {
    return handle(request)
  }
}

async function handle(request) {
  const u = new URL(request.url)
  const p = u.pathname
  
  if (!p.startsWith('/og/')) return new Response('Not Found', {status: 404})
  
  const s = p.split('/').pop()
  const isA = p.includes('auctions') || p.includes('subasta')
  const be = 'https://kemazon-v1-2016-kmz-v1-backend.qiaz7f.easypanel.host'
  const fe = 'https://kemazon.ar'
  
  try {
    const r = await fetch(be + '/api/products/' + s)
    if (!r.ok) return new Response('Product not found', {status: 404})
    
    const d = await r.json()
    const pr = d.product || d
    
    const n = (pr.name || 'Producto').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const de = (pr.description || 'Producto').substring(0, 160).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const prc = pr.price ? Number(pr.price).toLocaleString('es-AR') : '0'
    const img = be + '/api/products/image/' + s
    const pg = fe + (isA ? '/auctions/' : '/products/') + s
    const t = n + (isA ? ' - Subasta' : '')
    
    const h = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + t + ' | KEMAZON.ar</title><meta name="description" content="' + de + '"><meta property="og:type" content="product"><meta property="og:title" content="' + t + '"><meta property="og:description" content="' + de + '"><meta property="og:image" content="' + img + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="' + pg + '"><meta property="og:site_name" content="KEMAZON.ar"><meta property="product:price:amount" content="' + pr.price + '"><meta property="product:price:currency" content="ARS"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + t + '"><meta name="twitter:description" content="' + de + '"><meta name="twitter:image" content="' + img + '"></head><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:50px;background:#f5f5f5"><h1 style="color:#333">' + n + '</h1><p style="font-size:24px;font-weight:bold;color:#4f46e5">$' + prc + '</p><p><a href="' + pg + '" style="color:#4f46e5;font-size:18px">Ir a KEMAZON.ar</a></p></body></html>'
    
    return new Response(h, {headers: {'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'public, max-age=3600'}})
  } catch (e) {
    return new Response('Error: ' + e.message, {status: 500})
  }
}