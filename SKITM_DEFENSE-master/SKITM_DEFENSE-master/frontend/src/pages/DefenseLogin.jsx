import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSurveillance } from '../context/SurveillanceContext'
import RadarMapBackground from '../components/RadarMapBackground'
import LoginTransition from '../components/LoginTransition'

export default function DefenseLogin() {
  const { setUser } = useSurveillance()
  const navigate = useNavigate()
  const [form, setForm] = useState({ badgeId: '', password: '', otp: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTransition, setShowTransition] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.badgeId || !form.password) { setError('Badge ID and Password are required.'); return }
    setLoading(true); setError('')
    setUser({ role: 'defense', name: form.badgeId, id: form.badgeId, email: '', token: 'demo-token' })
    setShowTransition(true)
  }

  const handleTransitionComplete = () => {
    navigate('/defense/live')
    setLoading(false)
  }

  return (
    <div className="login-page login-defense">
      <LoginTransition show={showTransition} onComplete={handleTransitionComplete} />
      <RadarMapBackground />

      {/* Floating animated card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        // subtle float loop
        whileInView={{ y: [0, -6, 0] }}
        style={{ animation: 'none' }}
      >
        {/* Border glow pulse via CSS */}
        <div className="login-card-glow" />

        <div className="login-header">
          <div className="login-emblem">
            <motion.img
              src="/logo.png"
              alt="Suraksha Setu"
              style={{ height: '60px', width: 'auto' }}
              animate={{ 
                filter: [
                  'drop-shadow(0 0 0px #60a5fa)', 
                  'drop-shadow(0 0 18px #60a5fa44)', 
                  'drop-shadow(0 0 0px #60a5fa)'
                ] 
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div className="login-brand">
            <div className="login-title">SurakshaSetu</div>
            <div className="login-subtitle">Defense Portal</div>
            <div className="login-tagline">CLASSIFIED · AUTHORIZED ACCESS ONLY</div>
          </div>
        </div>

        <div className="login-divider" />

        <form className="login-form" onSubmit={handleSubmit}>
          {[
            { label: 'Badge ID', key: 'badgeId', type: 'text', placeholder: 'DSS-XXXX' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
            { label: 'OTP', key: 'otp', type: 'text', placeholder: '6-digit OTP', opt: true },
          ].map((f, i) => (
            <motion.div
              key={f.key}
              className="form-group"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
            >
              <label className="form-label">
                {f.label} {f.opt && <span className="form-label-opt">(optional)</span>}
              </label>
              <input className="form-input" type={f.type} placeholder={f.placeholder}
                value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </motion.div>
          ))}

          {error && (
            <motion.div className="form-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {error}
            </motion.div>
          )}

          <motion.button
            className="login-btn defense-btn"
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.03, boxShadow: '0 0 20px rgba(0,212,255,0.4)' } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {loading ? 'Authenticating…' : '⛨ Secure Login'}
          </motion.button>
        </form>

        <div className="login-footer">
          <a href="/civilian-login" className="login-switch-link">→ Civilian Portal</a>
          <span className="login-version">v4.2.1 · DSS-ALPHA</span>
        </div>
      </motion.div>
    </div>
  )
}
