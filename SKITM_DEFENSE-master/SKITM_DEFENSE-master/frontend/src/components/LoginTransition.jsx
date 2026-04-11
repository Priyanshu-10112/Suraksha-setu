import { motion, AnimatePresence } from 'framer-motion'

export default function LoginTransition({ show, onComplete }) {
  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 2 }}
        onAnimationComplete={onComplete}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Logo */}
        <motion.img
          src="/logo.png"
          alt="Suraksha Setu"
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '120px',
            width: 'auto',
            filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(96,165,250,0.3))'
          }}
        />

        {/* Text Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '36px',
            fontWeight: 800,
            color: '#e6edf3',
            letterSpacing: '2px',
            textAlign: 'center'
          }}
        >
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            SURAKSHA
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.4 }}
            style={{ color: '#ff9933', marginLeft: '8px' }}
          >
            SETU
          </motion.span>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          style={{
            fontFamily: 'Noto Sans Devanagari, sans-serif',
            fontSize: '18px',
            color: '#8b949e',
            letterSpacing: '1px'
          }}
        >
          सुरक्षा सेतु
        </motion.div>

        {/* Loading bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '200px' }}
          transition={{ delay: 1.4, duration: 0.6, ease: 'easeInOut' }}
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #ff9933, #ffffff, #138808)',
            borderRadius: '2px',
            marginTop: '20px'
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
