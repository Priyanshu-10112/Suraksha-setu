import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSurveillance } from '../context/SurveillanceContext'
import RadarMapBackground from '../components/RadarMapBackground'
import LoginTransition from '../components/LoginTransition'

export default function CivilianLogin() {
  const { setUser } = useSurveillance()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTransition, setShowTransition] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Email and Password are required.'); return }
    setLoading(true); setError('')
    setUser({ role: 'civilian', name: form.email.split('@')[0], id: '', email: form.email, token: 'demo-token' })
    setShowTransition(true)
  }

  const handleTransitionComplete = () => {
    navigate('/civilian/live')
    setLoading(false)
  }

  return (
    <div className="login-page login-civilian">
      <LoginTransition show={showTransition} onComplete={handleTransitionComplete} />
      <RadarMapBackground />

      <motion.div
        className="login-card civilian-card"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ animation: 'none' }}
      >
        <div className="login-card-glow civilian-glow" />

        <div className="login-header">
          <div className="login-emblem">
            <motion.img
              src="/logo.png"
              alt="Suraksha Setu"
              style={{ height: '60px', width: 'auto' }}
              animate={{ 
                filter: [
                  'drop-shadow(0 0 0px #22c55e)', 
                  'drop-shadow(0 0 18px #22c55e44)', 
                  'drop-shadow(0 0 0px #22c55e)'
                ] 
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div className="login-brand">
            <div className="login-title">SurakshaSetu</div>
            <div className="login-subtitle civilian-sub">Public Safety Portal</div>
            <div className="login-tagline">Keeping Communities Safe</div>
          </div>
        </div>

        <div className="login-divider" />

        <form className="login-form" onSubmit={handleSubmit}>
          {[
            { label: 'Email Address', key: 'email',    type: 'email',    placeholder: 'you@example.com' },
            { label: 'Password',      key: 'password', type: 'password', placeholder: '••••••••' },
          ].map((f, i) => (
            <motion.div
              key={f.key}
              className="form-group"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
            >
              <label className="form-label">{f.label}</label>
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
            className="login-btn civilian-btn"
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.03, boxShadow: '0 0 20px rgba(34,197,94,0.35)' } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {loading ? 'Signing in…' : '→ Sign In'}
          </motion.button>
        </form>

        <div className="login-footer">
          <a href="/defense-login" className="login-switch-link">→ Defense Portal</a>
          <span className="login-version">Public Access · v4.2.1</span>
        </div>
      </motion.div>
    </div>
  )
}
