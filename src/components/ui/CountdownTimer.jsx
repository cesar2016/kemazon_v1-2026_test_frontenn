import { useState, useEffect } from 'react';

export function CountdownTimer({ endDate, size = 'default', onEnd }) {
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
        if (onEnd) onEnd();
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
