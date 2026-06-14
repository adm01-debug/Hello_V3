/* eslint-disable react-refresh/only-export-components -- file intentionally exports variants/hooks alongside components; HMR-only rule */
import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

export const scale = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

const variantsMap = { fadeIn, slideUp, scale } as const;

interface AnimatedDivProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: keyof typeof variantsMap;
}

export function AnimatedDiv({ children, variant = 'fadeIn', ...props }: AnimatedDivProps) {
  return (
    <motion.div {...variantsMap[variant]} {...props}>
      {children}
    </motion.div>
  );
}