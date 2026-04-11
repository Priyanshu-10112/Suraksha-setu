import { motion } from 'framer-motion'

const variants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1    },
  exit:    { opacity: 0, y: -10, scale: 0.98 },
}

const transition = { duration: 0.35, ease: 'easeOut' }

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  )
}
