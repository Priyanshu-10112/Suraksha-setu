import { motion } from 'framer-motion'

// Reusable animated card wrapper — fade up on mount, hover lift
export function MotionCard({ children, className, style, delay = 0 }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,212,255,0.12)' }}
    >
      {children}
    </motion.div>
  )
}

// Animated button — scale on hover/tap
export function MotionButton({ children, className, style, onClick, disabled, type }) {
  return (
    <motion.button
      className={className}
      style={style}
      onClick={onClick}
      disabled={disabled}
      type={type}
      whileHover={!disabled ? { scale: 1.04 } : {}}
      whileTap={!disabled  ? { scale: 0.96 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  )
}

// Staggered list container
export function MotionList({ children, className }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden:  {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {children}
    </motion.div>
  )
}

// Staggered list item
export function MotionItem({ children, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden:  { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      }}
    >
      {children}
    </motion.div>
  )
}
