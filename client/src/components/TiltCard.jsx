import { useRef } from 'react';

export default function TiltCard({ children, className = '', maxX = 8, maxY = 8, ...rest }) {
  const ref = useRef(null);

  const onPointerMove = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${((0.5 - py) * maxY).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((px - 0.5) * maxX).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
  };

  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...rest}
    >
      {children}
    </div>
  );
}