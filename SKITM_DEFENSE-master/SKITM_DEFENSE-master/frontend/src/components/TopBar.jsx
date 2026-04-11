import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurveillance } from '../context/SurveillanceContext'

export default function TopBar({ title }) {
  const { systemStatus, user, setUser, lang, setLang, t } = useSurveillance()
  const [now, setNow] = useState(new Date())
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false })
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const isAlert = systemStatus !== 'OPERATIONAL'
  const isDefense = user?.role === 'defense'

  const handleLogout = () => {
    setUser(null)
    navigate(isDefense ? '/defense-login' : '/civilian-login')
  }

  return (
    <header className="topbar">
      <div className="tb-brand">
        <img src="/logo.png" alt="Suraksha Setu" className="tb-logo" />
        <div className="tb-brand-text">
          <div className="tb-title">SurakshaSetu</div>
          <div className="tb-page-title">{title}</div>
        </div>
      </div>

      <div className="tb-clock-block">
        <div className="tb-clock">{timeStr}</div>
        <div className="tb-date">{dateStr} · IST</div>
      </div>

      <div className="tb-right">
        <button className="lang-toggle" onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}>
          {lang === 'en' ? 'हिं' : 'EN'}
        </button>
        {user && (
          <div className="officer-badge">
            <div className={`badge-avatar ${isDefense ? 'av-defense' : 'av-civilian'}`}>
              {user.name?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div>
              <div className="badge-name">{user.name}</div>
              <div className="badge-id">{isDefense ? `ID: ${user.id}` : user.email}</div>
            </div>
          </div>
        )}
        <div className={`sys-status ${isAlert ? 'sys-alert' : 'sys-ok'}`}>
          <span className="sys-dot" />
          <span>{isAlert ? t('ALERT','अलर्ट') : t('OPERATIONAL','परिचालन')}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          ⎋ {t('Logout','लॉगआउट')}
        </button>
      </div>
      <div className="tb-tricolor-line">
        <div className="tcl-s" /><div className="tcl-w" /><div className="tcl-g" />
      </div>
    </header>
  )
}
