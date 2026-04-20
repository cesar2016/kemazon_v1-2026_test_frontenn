import { useState, useEffect } from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  loading,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/30 border-b-4 border-primary-700 active:border-b-0 active:translate-y-[2px]',
    secondary: 'bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200 hover:bg-white hover:shadow-md',
    success: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:shadow-lg hover:shadow-secondary-500/30 border-b-4 border-secondary-700 active:border-b-0 active:translate-y-[2px]',
    tertiary: 'bg-gradient-to-r from-tertiary-500 to-tertiary-600 text-white hover:shadow-lg hover:shadow-tertiary-500/30 border-b-4 border-tertiary-700 active:border-b-0 active:translate-y-[2px]',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className = '', children, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select
        className={`input ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function Badge({ children, variant = 'primary', className = '' }) {
  const variants = {
    primary: 'bg-primary-100 text-primary-700 border border-primary-200',
    success: 'bg-secondary-100 text-secondary-700 border border-secondary-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    danger: 'bg-red-100 text-red-700 border border-red-200',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-200',
    tertiary: 'bg-tertiary-100 text-tertiary-700 border border-tertiary-200',
  };

  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-gray-200 border-t-primary-500`} />
    </div>
  );
}

export function Card({ children, className = '', variant = 'default', hover = false, ...props }) {
  const variants = {
    default: 'card',
    glass: 'glass-card',
    outline: 'bg-white rounded-2xl border-2 border-primary-50 hover:border-primary-100 transition-all duration-300',
  };

  return (
    <div
      className={`${variants[variant]} ${hover ? 'hover:shadow-lg transition-transform duration-300 hover:scale-[1.01]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
        <div className={`relative glass rounded-3xl shadow-2xl w-full ${sizes[size]} p-6 animate-fade-in border border-white/50`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-primary-600 transition-colors bg-white/50 p-2 rounded-full backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {title && <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="w-16 h-16 mx-auto text-gray-300 mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {action}
    </div>
  );
}

export function PriceFormatter({ price, originalPrice, className = '' }) {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(price);

  return (
    <span className={className}>
      <span className="price">{formatted}</span>
      {originalPrice && originalPrice > price && (
        <span className="price-original ml-2">
          {new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
          }).format(originalPrice)}
        </span>
      )}
    </span>
  );
}

export function ProductImage({
  src,
  fallbackSrcs = [],
  alt = 'Imagen del producto',
  className = '',
  ...props
}) {
  const [hasError, setHasError] = useState(false);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  const sourceList = [src, ...fallbackSrcs].filter(Boolean);

  useEffect(() => {
    setHasError(false);
    setCurrentSrcIndex(0);
  }, [src, JSON.stringify(fallbackSrcs)]);

  const handleError = () => {
    if (currentSrcIndex < sourceList.length - 1) {
      setCurrentSrcIndex((prev) => prev + 1);
      return;
    }

    if (!hasError) {
      setHasError(true);
    }
  };

  if (hasError || sourceList.length === 0) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        {...props}
      >
        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={sourceList[currentSrcIndex]}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}

export function CountdownTimer({ endDate, size = 'default' }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsUrgent(true);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsUrgent(distance <= 60 * 60 * 1000);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const colorClass = isUrgent ? 'text-red-600' : 'text-green-600';
  const bgClass = isUrgent ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';

  const isSmall = size === 'small';

  return (
    <div className={`flex items-center justify-center gap-1 ${bgClass} border rounded-lg px-3 py-2 ${colorClass} ${isSmall ? 'text-sm' : 'text-base'}`}>
      {timeLeft.days > 0 && (
        <>
          <span className="font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="font-medium">d</span>
          <span className="mx-1">:</span>
        </>
      )}
      <span className="font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
      <span className="font-medium">h</span>
      <span className="mx-1">:</span>
      <span className="font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
      <span className="font-medium">m</span>
      <span className="mx-1">:</span>
      <span className="font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
      <span className="font-medium">s</span>
    </div>
  );
}
