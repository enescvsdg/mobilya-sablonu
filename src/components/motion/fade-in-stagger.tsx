"use client";

import { motion } from "framer-motion";

import { useIntroDone } from "@/lib/intro";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// On-mount staggered entrance — for content that's already in the
// viewport on load (hero, product detail), as opposed to Reveal/Stagger
// in reveal.tsx and stagger.tsx which trigger on scroll-into-view.
export function FadeInStagger({
  children,
  className,
  waitForIntro = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Ana sayfa giriş animasyonu bitene kadar gizli kalır. */
  waitForIntro?: boolean;
}) {
  const introDone = useIntroDone();
  const show = !waitForIntro || introDone;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate={show ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
