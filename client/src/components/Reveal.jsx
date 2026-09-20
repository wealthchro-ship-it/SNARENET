import { useEffect, useRef, useState } from 'react';

export function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setInView(true);
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const { ref, inView } = useInView();
  return (
    <Tag
      ref={ref}
      className={`reveal-on-scroll ${inView ? 'is-visible' : ''} ${className}`.trim()}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...rest.style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}