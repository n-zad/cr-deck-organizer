import { useLayoutEffect, useRef, useState } from 'react';

function fallbackWidth(): number {
  if (typeof window === 'undefined') return 800;
  return Math.max(320, window.innerWidth - 48);
}

export function useElementWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallbackWidth);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const next = node.getBoundingClientRect().width;
      if (next > 0) setWidth(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
