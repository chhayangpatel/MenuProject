import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const MagneticButton = ({ children, onClick, className }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      onClick={onClick}
      className={className}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        fontSize: '1rem',
        padding: '0.5rem 1rem',
        fontWeight: 500,
      }}
    >
      {children}
    </motion.button>
  );
};

export default function MagneticNav() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        gap: '2rem',
        padding: '0.5rem 1.5rem',
        borderRadius: '9999px',
        alignItems: 'center'
      }}
      className="glass"
    >
      <div style={{ fontWeight: 800, fontSize: '1.2rem', marginRight: '2rem' }}>MENU.PRO</div>
      <MagneticButton>Work</MagneticButton>
      <MagneticButton>Studio</MagneticButton>
      <MagneticButton>News</MagneticButton>
      <MagneticButton>Contact</MagneticButton>
    </motion.nav>
  );
}
