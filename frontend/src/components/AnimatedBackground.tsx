import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Emerald blob - top left */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, #34d399, transparent 70%)',
          top: '-10%',
          left: '-5%',
          filter: 'blur(100px)',
          opacity: 0.05,
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Purple blob - bottom right */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, #a78bfa, transparent 70%)',
          bottom: '-15%',
          right: '-10%',
          filter: 'blur(120px)',
          opacity: 0.04,
        }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Cyan blob - center */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, #22d3ee, transparent 70%)',
          top: '40%',
          left: '50%',
          filter: 'blur(110px)',
          opacity: 0.04,
        }}
        animate={{
          x: [0, 30, -40, 0],
          y: [0, -50, 30, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Amber blob - top right (new) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, #fbbf24, transparent 70%)',
          top: '10%',
          right: '5%',
          filter: 'blur(100px)',
          opacity: 0.03,
        }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 30, -40, 0],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
