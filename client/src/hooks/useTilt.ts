import { useEffect, useRef } from 'react';

/**
 * useTilt — subtle pointer-driven micro-parallax for glass cards.
 * Purely presentational: it only writes CSS custom properties on the
 * element it is attached to, and never interacts with application state.
 *
 * Respects `prefers-reduced-motion`.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(maxDeg = 4) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      el.style.setProperty('--tilt-x', `${(0.5 - py) * maxDeg}deg`);
      el.style.setProperty('--tilt-y', `${(px - 0.5) * maxDeg}deg`);
      el.style.setProperty('--glare-x', `${px * 100}%`);
      el.style.setProperty('--glare-y', `${py * 100}%`);
      el.classList.add('is-tilting');
    };

    const handleLeave = () => {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.classList.remove('is-tilting');
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);

    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
    };
  }, [maxDeg]);

  return ref;
}

export default useTilt;
