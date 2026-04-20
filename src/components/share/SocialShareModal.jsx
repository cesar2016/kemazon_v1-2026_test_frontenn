import { useState } from 'react';
import { Camera, Mail, Send, Smartphone } from 'lucide-react';
import { Modal, Badge } from '../ui';
import { toast } from 'sonner';

function BrandIcon({ children, className }) {
  return (
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SocialButton({ href, onClick, label, subtitle, icon, className = '' }) {
  const content = (
    <div className={`flex items-center gap-3 rounded-2xl p-3 transition-all ${className}`}>
      {icon}
      <div className="text-left">
        <p className="text-sm font-black text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}

function buildShareUrls(shareData) {
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareData.whatsappText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent(shareData.shareSummary)}`,
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(shareData.twitterText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.telegramText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`,
    email: `mailto:?subject=${encodeURIComponent(shareData.emailSubject)}&body=${encodeURIComponent(shareData.emailBody)}`,
  };
}

async function fetchImageFile(imageUrl, fileBaseName) {
  if (!imageUrl) return null;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`No se pudo descargar la miniatura (${response.status})`);
  }

  const blob = await response.blob();
  const extension = blob.type.split('/')[1] || 'jpg';
  return new File([blob], `${fileBaseName}.${extension}`, { type: blob.type || 'image/jpeg' });
}

async function copyTextToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error('No se pudo copiar el texto');
  }
}

export function SocialShareModal({ isOpen, onClose, shareData }) {
  const [isNativeSharing, setIsNativeSharing] = useState(false);

  if (!shareData) return null;

  const shareUrls = buildShareUrls(shareData);
  const supportsNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (!supportsNativeShare) {
      try {
        await copyTextToClipboard(shareData.copyText);
        window.open(shareUrls.whatsapp, '_blank', 'noopener,noreferrer');
        toast.success('Se copió el mensaje y se abrió WhatsApp para compartir');
      } catch (error) {
        toast.error('No se pudo preparar el contenido para compartir');
      }
      return;
    }

    setIsNativeSharing(true);

    try {
      const payload = {
        title: shareData.shareTitle,
        text: shareData.nativeText,
        url: shareData.url,
      };

      const file = await fetchImageFile(
        shareData.imageUrl,
        shareData.cardTitle.toLowerCase().replace(/[^a-z0-9]+/gi, '-')
      ).catch(() => null);

      if (file && navigator.canShare?.({ files: [file] })) {
        payload.files = [file];
      }

      await navigator.share(payload);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        toast.error('No se pudo abrir el menú nativo de compartir');
      }
    } finally {
      setIsNativeSharing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={shareData.title}>
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-sm">
          <div className="relative h-52 bg-gradient-to-br from-gray-100 via-white to-primary-50">
            {shareData.imageUrl ? (
              <img
                src={shareData.imageUrl}
                alt={shareData.cardTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Camera className="w-12 h-12" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/65 to-transparent">
              <Badge variant="warning" className="border-none bg-white/90 text-gray-900">
                {shareData.cardBadge}
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">{shareData.cardTitle}</h3>
                <p className="mt-1 text-sm text-gray-500">{shareData.cardMeta}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-primary-600">{shareData.cardPrice}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-primary-50 via-white to-amber-50 p-4 border border-primary-100">
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{shareData.shareSummary}</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{shareData.cardDescription}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SocialButton
            onClick={handleNativeShare}
            label="Compartir"
            subtitle={supportsNativeShare ? 'Comparte imagen + texto promocional juntos' : 'Prepara el texto y abre WhatsApp con tu miniatura pública'}
            className="bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-blue-100 border border-primary-200"
            icon={(
              <BrandIcon className="bg-primary-600 text-white">
                <Smartphone className="w-5 h-5" />
              </BrandIcon>
            )}
          />
          <SocialButton
            href={shareUrls.whatsapp}
            label="WhatsApp"
            subtitle="Comparte el texto y previsualiza desde kemazon.ar"
            className="bg-green-50 hover:bg-green-100 border border-green-200"
            icon={(
              <BrandIcon className="bg-green-500 text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>
              </BrandIcon>
            )}
          />
          <SocialButton
            href={shareUrls.facebook}
            label="Facebook"
            subtitle="Usa el enlace público con miniatura y copy"
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200"
            icon={(
              <BrandIcon className="bg-blue-600 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.953 10.125 11.853v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.249h3.328l-.532 3.469h-2.796v8.385C19.612 23.026 24 18.062 24 12.073z"/></svg>
              </BrandIcon>
            )}
          />
          <SocialButton
            href={shareUrls.x}
            label="X"
            subtitle="Publica el texto promocional con vista previa"
            className="bg-gray-50 hover:bg-gray-100 border border-gray-200"
            icon={(
              <BrandIcon className="bg-gray-900 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26L22.827 21.75H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </BrandIcon>
            )}
          />
          <SocialButton
            href={shareUrls.telegram}
            label="Telegram"
            subtitle="Envía el texto con tu enlace público"
            className="bg-sky-50 hover:bg-sky-100 border border-sky-200"
            icon={(
              <BrandIcon className="bg-sky-500 text-white">
                <Send className="w-5 h-5" />
              </BrandIcon>
            )}
          />
          <SocialButton
            href={shareUrls.linkedin}
            label="LinkedIn"
            subtitle="Comparte la publicación con preview profesional"
            className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
            icon={(
              <BrandIcon className="bg-indigo-700 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </BrandIcon>
            )}
          />
          <SocialButton
            href={shareUrls.email}
            label="Email"
            subtitle="Abre un mail con asunto, texto y enlace"
            className="bg-amber-50 hover:bg-amber-100 border border-amber-200"
            icon={(
              <BrandIcon className="bg-amber-500 text-white">
                <Mail className="w-5 h-5" />
              </BrandIcon>
            )}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Contenido que se comparte</p>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-sans">{shareData.copyText}</pre>
        </div>
      </div>
    </Modal>
  );
}
