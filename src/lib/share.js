function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function convertBase64ToBlob(base64String, maxWidth = 1200, maxHeight = 630, format = 'jpeg') {
  return new Promise((resolve, reject) => {
    if (!base64String || typeof base64String !== 'string') {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
      const quality = format === 'webp' ? 0.85 : 0.85;
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(null);
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      resolve(null);
    };

    if (base64String.startsWith('data:')) {
      img.src = base64String;
    } else if (base64String.startsWith('http')) {
      img.src = base64String;
    } else {
      img.src = `data:image/jpeg;base64,${base64String}`;
    }
  });
}

export function extractBase64FromUrl(url) {
  if (!url) return null;
  
  if (url.startsWith('data:image')) {
    return url;
  }
  
  return null;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function formatDateTime(value) {
  if (!value) return 'muy pronto';

  return new Date(value).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildSalesPitch(name, description, cta) {
  const teaser = truncateText(description, 110);
  const teaserLine = teaser ? `\n${teaser}` : '';
  return `✨ ${name}${teaserLine}\n${cta}`;
}

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://kemazon.ar';

export function buildPublicShareUrl(pathname = '/', hash = '') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const cleanedPath = normalizedPath.replace(/^#\/?/, '');

  return `${FRONTEND_URL}${cleanedPath}`;
}

export function buildProductShareData(product, url, imageUrl) {
  const name = product?.name || 'Producto destacado';
  const price = formatCurrency(product?.price);
  const originalPrice = Number(product?.original_price || 0);
  const hasDiscount = originalPrice > Number(product?.price || 0);
  const description = truncateText(product?.description, 140);
  const availability = product?.stock > 0 ? 'Listo para comprar hoy' : 'Consultá disponibilidad';
  const hook = hasDiscount ? 'Aprovechá el precio especial antes de que vuele.' : 'Descubrí una oportunidad pensada para comprar sin vueltas.';
  const cta = `${hook} ${availability}.`;

  const shareTitle = `${name} | KEMAZON.ar`;
  const shareSummary = buildSalesPitch(name, description, cta);
  
  const copyText = [
    `🔥 ${name}`,
    '',
    `💸 Precio destacado: ${price}${hasDiscount ? ` antes ${formatCurrency(originalPrice)}` : ''}`,
    description ? `📝 ${description}` : null,
    `🚀 ${cta}`,
    '',
    `🔗 ${url}`,
    imageUrl && !imageUrl.startsWith('data:') ? `📷 Ver imagen: ${imageUrl}` : null,
  ].filter(Boolean).join('\n');

  const instagramCaption = [
    `🔥 ${name}`,
    description ? description : null,
    `💸 ${price}${hasDiscount ? ` | antes ${formatCurrency(originalPrice)}` : ''}`,
    `🚀 ${cta}`,
    '',
    '#Kemazon #ComprasOnline #OfertaDelDia',
    url,
  ].filter(Boolean).join('\n');

  return {
    kind: 'product',
    title: 'Compartir producto',
    cardTitle: name,
    cardBadge: hasDiscount ? 'Oferta destacada' : 'Elegido para vender',
    cardPrice: price,
    cardMeta: hasDiscount ? `Antes ${formatCurrency(originalPrice)}` : availability,
    cardDescription: description || cta,
    imageUrl,
    url,
    shareTitle,
    shareSummary,
    copyText,
    instagramCaption,
    emailSubject: `Mirá este producto en KEMAZON: ${name}`,
    emailBody: `${copyText}\n\nEnviado desde KEMAZON.ar`,
    whatsappText: copyText,
    twitterText: `${shareSummary}\n${price}\n${url}`,
    linkedinText: `${name} - ${price}. ${description || cta}`,
    telegramText: `${shareSummary}\n${price}`,
    nativeText: copyText,
  };
}

export function buildAuctionShareData(product, auction, url, imageUrl) {
  const name = product?.name || 'Subasta destacada';
  const currentPrice = formatCurrency(auction?.current_price || auction?.price || 0);
  const bidCount = auction?.bids?.length || auction?.bids_count || 0;
  const endsAt = formatDateTime(auction?.ends_at);
  const description = truncateText(product?.description, 140);
  const urgency = bidCount > 0
    ? `Ya hay ${bidCount} ${bidCount === 1 ? 'oferta' : 'ofertas'} y sigue creciendo.`
    : 'Todavía estás a tiempo de entrar primero y quedarte con esta oportunidad.';
  const cta = `Subasta activa hasta ${endsAt}. ${urgency}`;

  const shareTitle = `${name} | Subasta KEMAZON.ar`;
  const shareSummary = buildSalesPitch(name, description, cta);
  const copyText = [
    `⚡ ${name}`,
    '',
    `🏷️ Oferta actual: ${currentPrice}`,
    `⏰ Cierra: ${endsAt}`,
    `🔥 ${urgency}`,
    description ? `📝 ${description}` : null,
    '',
    `🔗 ${url}`,
    imageUrl && !imageUrl.startsWith('data:') ? `📷 Ver imagen: ${imageUrl}` : null,
  ].filter(Boolean).join('\n');

  const socialCaption = [
    `⚡ ${name}`,
    description ? description : null,
    `🏷️ Oferta actual: ${currentPrice}`,
    `⏰ Cierra: ${endsAt}`,
    `🔥 ${urgency}`,
    '',
    '#Kemazon #Subastas #Oportunidad',
    url,
  ].filter(Boolean).join('\n');

  return {
    kind: 'auction',
    title: 'Compartir subasta',
    cardTitle: name,
    cardBadge: bidCount > 0 ? `${bidCount} pujas activas` : 'Subasta en vivo',
    cardPrice: currentPrice,
    cardMeta: `Cierra ${endsAt}`,
    cardDescription: description || cta,
    imageUrl,
    url,
    shareTitle,
    shareSummary,
    copyText,
    instagramCaption: socialCaption,
    emailSubject: `Mirá esta subasta en KEMAZON: ${name}`,
    emailBody: `${copyText}\n\nEnviado desde KEMAZON.ar`,
    whatsappText: copyText,
    twitterText: `${shareSummary}\n${currentPrice}\n${url}`,
    linkedinText: `${name} - ${currentPrice}. ${cta}`,
    telegramText: `${shareSummary}\n${currentPrice}`,
    nativeText: copyText,
  };
}
