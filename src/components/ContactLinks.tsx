import { motion, useReducedMotion } from 'framer-motion';
import { contactLinks } from '../content/profile';
import { useIsPhone } from '../lib/runtime';

export function ContactLinks({ iconSize, placement }: { iconSize: number; placement: 'intro' | 'topbar' }) {
  const shouldReduceMotion = useReducedMotion();
  const isPhone = useIsPhone();
  const simple = shouldReduceMotion || isPhone;

  return (
    <>
      {contactLinks.map((link, index) => {
        const Icon = link.icon;
        const motionProps = simple
          ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
          : {
              initial: { opacity: 0, y: placement === 'topbar' ? -6 : 6 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: placement === 'topbar' ? -6 : 6 },
              transition: { duration: 0.22, delay: index * 0.03, ease: [0.2, 0.72, 0.18, 1] as const }
            };

        return (
          <motion.a
            className="btn btn--quiet btn--small"
            href={link.href}
            key={`${placement}-${link.label}`}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noreferrer' : undefined}
            {...motionProps}
          >
            <Icon size={iconSize} />
            {link.label}
          </motion.a>
        );
      })}
    </>
  );
}
