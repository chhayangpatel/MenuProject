import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const menuVariants = {
  initial: {
    scaleY: 0,
  },
  animate: {
    scaleY: 1,
    transition: {
      duration: 0.5,
      ease: [0.12, 0, 0.39, 0],
    },
  },
  exit: {
    scaleY: 0,
    transition: {
      delay: 0.5,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const navLinksVariants = {
  initial: {
    y: '30vh',
    transition: {
      duration: 0.5,
      ease: [0.37, 0, 0.63, 1],
    },
  },
  open: {
    y: 0,
    transition: {
      ease: [0, 0.55, 0.45, 1],
      duration: 0.7,
    },
  },
};

const containerVars = {
  initial: {
    transition: {
      staggerChildren: 0.09,
      staggerDirection: -1,
    },
  },
  open: {
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.09,
      staggerDirection: 1,
    },
  },
};

export default function FullScreenOverlay() {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

  const navLinks = [
    { title: 'Home', href: '#' },
    { title: 'About', href: '#' },
    { title: 'Showcase', href: '#' },
    { title: 'Contact', href: '#' },
  ];

  return (
    <>
      <button
        onClick={toggleMenu}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '2rem',
          zIndex: 100,
          background: open ? 'transparent' : 'var(--accent-color)',
          border: 'none',
          color: 'white',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'background 0.3s ease'
        }}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={menuVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: '#1a1a1f',
              transformOrigin: 'top',
              zIndex: 90,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4rem',
            }}
          >
            <motion.div
              variants={containerVars}
              initial="initial"
              animate="open"
              exit="initial"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                alignItems: 'center'
              }}
            >
              {navLinks.map((link, i) => (
                <div key={i} style={{ overflow: 'hidden' }}>
                  <motion.div variants={navLinksVariants}>
                    <a
                      href={link.href}
                      onClick={toggleMenu}
                      style={{
                        fontSize: 'clamp(3rem, 6vw, 5rem)',
                        fontWeight: 600,
                        color: 'white',
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '-2px',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseEnter={(e) => (e.target.style.color = 'var(--accent-color)')}
                      onMouseLeave={(e) => (e.target.style.color = 'white')}
                    >
                      {link.title}
                    </a>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
