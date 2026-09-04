import React from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export default function FloatingScrollMenu() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = React.useState(true);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > 150 && latest > previous) {
      setHidden(false);
    } else if (latest < 150) {
      setHidden(true);
    }
  });

  return (
    <motion.div
      variants={{
        visible: { y: 0, opacity: 1, scale: 1 },
        hidden: { y: 100, opacity: 0, scale: 0.8 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        gap: '1rem',
        padding: '0.8rem 2rem',
        borderRadius: '9999px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      }}
      className="glass"
    >
      {['Overview', 'Features', 'Pricing', 'Docs'].map((item) => (
        <a 
          key={item} 
          href={`#${item.toLowerCase()}`}
          style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          {item}
        </a>
      ))}
    </motion.div>
  );
}
