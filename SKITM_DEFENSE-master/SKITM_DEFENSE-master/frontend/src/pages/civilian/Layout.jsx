import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import WaveBackground from '../../components/WaveBackground'
import { useSurveillance } from '../../context/SurveillanceContext'

const NAV = [
  { to: '/civilian/live',    icon: '▶', label: 'Live Monitoring'  },
  { to: '/civilian/alerts',  icon: '⚑', label: 'Safety Alerts'   },
  { to: '/civilian/zones',   icon: '⊞', label: 'Zone View'        },
  { to: '/civilian/reports', icon: '📋', label: 'Incident Reports' },
]

export default function CivilianLayout() {
  const { user, civilianAlerts, t } = useSurveillance()
  const activeAlerts = civilianAlerts.filter(a => a.status === 'Active').length

  return (
    <div className="dashboard">
      <WaveBackground />
      <TopBar title={t('Public Safety Monitor', 'सार्वजनिक सुरक्षा')} />
      <div className="dashboard-body">
        <aside className="sidebar sidebar-civilian">
          <nav className="sb-nav">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `sb-link ${isActive ? 'sb-link-active' : ''}`}>
                <span className="sb-link-icon">{n.icon}</span>
                <span className="sb-link-label">{n.label}</span>
                {n.to === '/civilian/alerts' && activeAlerts > 0 && (
                  <span className="sb-badge">{activeAlerts}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="sb-footer">
            <div className="sb-role-badge civilian-role">◉ CIVILIAN</div>
            {user && <div className="sb-user">{user.name}</div>}
          </div>
        </aside>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
