function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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
    copyButtonLabel: 'Copiar mensaje vendedor',
    captionButtonLabel: 'Copiar caption para Instagram/TikTok',
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
    copyButtonLabel: 'Copiar mensaje de subasta',
    captionButtonLabel: 'Copiar caption para Instagram/TikTok',
  };
}
