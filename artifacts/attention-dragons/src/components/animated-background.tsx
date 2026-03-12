import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/theme-context';
import type { ParticleType } from '@/lib/themes';

const RUNE_GLYPHS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ'];

function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  glyph?: string;
}

function useParticles(count: number, seed = 42): Particle[] {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: seededRand(seed + i * 3) * 100,
      delay: seededRand(seed + i * 7) * 8,
      duration: 6 + seededRand(seed + i * 11) * 10,
      size: 4 + seededRand(seed + i * 13) * 10,
      opacity: 0.3 + seededRand(seed + i * 17) * 0.5,
      glyph: RUNE_GLYPHS[Math.floor(seededRand(seed + i * 19) * RUNE_GLYPHS.length)],
    }));
  }, [count, seed]);
}

function EmberParticles() {
  const particles = useParticles(20, 1);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-8px',
            width: p.size * 0.5,
            height: p.size * 0.5,
            background: `radial-gradient(circle, hsl(30 100% 70%) 0%, hsl(20 90% 55%) 50%, transparent 100%)`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -(300 + p.size * 20)],
            x: [0, (seededRand(p.id * 23) - 0.5) * 80],
            opacity: [p.opacity, p.opacity * 0.8, 0],
            scale: [1, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

function RuneParticles({ color }: { color: string }) {
  const particles = useParticles(12, 2);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute font-display select-none"
          style={{
            left: `${p.x}%`,
            top: `${seededRand(p.id * 5) * 100}%`,
            fontSize: p.size + 4,
            color: `hsl(${color})`,
            opacity: 0,
            textShadow: `0 0 10px hsl(${color} / 0.8)`,
          }}
          animate={{
            opacity: [0, p.opacity * 0.6, 0],
            y: [0, -60 - p.size * 5],
            rotate: [0, (seededRand(p.id * 31) - 0.5) * 90],
          }}
          transition={{
            duration: p.duration * 1.5,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {p.glyph}
        </motion.div>
      ))}
    </div>
  );
}

function BubbleParticles() {
  const particles = useParticles(18, 3);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full border"
          style={{
            left: `${p.x}%`,
            bottom: '-20px',
            width: p.size,
            height: p.size,
            borderColor: `hsl(140 70% 55% / ${p.opacity * 0.6})`,
            background: `radial-gradient(circle at 30% 30%, hsl(140 60% 70% / 0.15), transparent 60%)`,
          }}
          animate={{
            y: [0, -(400 + p.size * 10)],
            x: [0, Math.sin(p.id) * 30, -Math.sin(p.id) * 20, 0],
            opacity: [0, p.opacity * 0.7, p.opacity * 0.5, 0],
            scale: [0.5, 1, 0.9, 1.05],
          }}
          transition={{
            duration: p.duration * 1.2,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function SparkParticles() {
  const particles = useParticles(25, 4);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            bottom: `${seededRand(p.id * 7) * 30}%`,
            width: p.size * 0.3,
            height: p.size * 0.3,
            background: seededRand(p.id) > 0.5
              ? `hsl(0 90% 65%)`
              : `hsl(40 90% 65%)`,
            borderRadius: '1px',
            opacity: p.opacity,
            transform: `rotate(${seededRand(p.id * 37) * 45}deg)`,
          }}
          animate={{
            y: [0, -(80 + p.size * 10)],
            x: [0, (seededRand(p.id * 41) - 0.5) * 60],
            opacity: [p.opacity, p.opacity, 0],
            scale: [1, 1.5, 0],
          }}
          transition={{
            duration: 1 + seededRand(p.id * 43) * 2,
            delay: p.delay * 0.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

function LeafParticles() {
  const particles = useParticles(16, 5);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.size * 0.6,
            borderRadius: '50% 0 50% 0',
            background: seededRand(p.id * 3) > 0.4
              ? `hsl(${100 + seededRand(p.id * 11) * 30} 65% ${30 + seededRand(p.id * 7) * 20}%)`
              : `hsl(${40 + seededRand(p.id * 13) * 20} 60% ${35 + seededRand(p.id * 9) * 15}%)`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, 600 + p.size * 20],
            x: [0, (seededRand(p.id * 23) - 0.5) * 120, (seededRand(p.id * 29) - 0.5) * 80, 0],
            rotate: [0, seededRand(p.id * 31) * 360 * (seededRand(p.id) > 0.5 ? 1 : -1)],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration * 1.5,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export function AnimatedBackground() {
  const { theme } = useTheme();

  const particles: Record<ParticleType, JSX.Element | null> = {
    embers: <EmberParticles />,
    runes: <RuneParticles color={theme.accentGlowColor} />,
    bubbles: <BubbleParticles />,
    sparks: <SparkParticles />,
    leaves: <LeafParticles />,
    none: null,
  };

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: theme.backgroundGradient }}
    >
      {particles[theme.particleType]}
    </div>
  );
}
