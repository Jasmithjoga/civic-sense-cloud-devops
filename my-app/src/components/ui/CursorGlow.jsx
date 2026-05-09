import { useEffect, useRef } from 'react';

export default function CursorGlow() {
    const glowRef = useRef(null);
    const pos = useRef({ x: -200, y: -200 });
    const current = useRef({ x: -200, y: -200 });
    const rafRef = useRef(null);

    useEffect(() => {
        const onMove = (e) => {
            pos.current = { x: e.clientX, y: e.clientY };
        };

        // Smooth lerp animation loop
        const animate = () => {
            current.current.x += (pos.current.x - current.current.x) * 0.10;
            current.current.y += (pos.current.y - current.current.y) * 0.10;

            if (glowRef.current) {
                glowRef.current.style.transform =
                    `translate(${current.current.x - 200}px, ${current.current.y - 200}px)`;
            }
            rafRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', onMove);
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div
            ref={glowRef}
            aria-hidden="true"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: 400,
                height: 400,
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 9999,
                background: 'radial-gradient(circle, rgba(59,130,246,0.13) 0%, rgba(99,102,241,0.07) 40%, transparent 70%)',
                filter: 'blur(12px)',
                willChange: 'transform',
                mixBlendMode: 'screen',
            }}
        />
    );
}
