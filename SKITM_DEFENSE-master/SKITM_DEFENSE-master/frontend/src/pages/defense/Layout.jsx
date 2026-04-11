import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import WaveBackground from '../../components/WaveBackground'
import { useSurveillance } from '../../context/SurveillanceContext'

const NAV = [
  { to: '/defense/live',     icon: '▶', label: 'Live Surveillance' },
  { to: '/defense/threats',  icon: '◈', label: 'Threat Detection'  },
  { to: '/defense/zones',    icon: '⊞', label: 'Zone Management'   },
  { to: '/defense/alerts',   icon: '⚑', label: 'Alert Center'      },
  { to: '/defense/faces',    icon: '🔍', label: 'Face Recognition'  },
  { to: '/defense/cameras',  icon: '📷', label: 'Camera Management' },
  { to: '/defense/settings', icon: '⚙', label: 'Camera Controls'   },
]

export default function DefenseLayout() {
  const { user, alerts, wsConnected, t } = useSurveillance()
  const activeAlerts = alerts.filter(a => a.status === 'Active').length

  return (
    <div className="dashboard">
      <WaveBackground />
      <TopBar title={t('Defense Operations', 'रक्षा संचालन')} />
      <div className="dashboard-body">
        <aside className="sidebar">
          <nav className="sb-nav">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `sb-link ${isActive ? 'sb-link-active' : ''}`}>
                <span className="sb-link-icon">{n.icon}</span>
                <span className="sb-link-label">{n.label}</span>
                {n.to === '/defense/alerts' && activeAlerts > 0 && (
                  <span className="sb-badge">{activeAlerts}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="sb-footer">
            <div className={`ws-indicator ${wsConnected ? 'ws-on' : 'ws-off'}`}>
              <span className="ws-dot" />{wsConnected ? 'WS Connected' : 'WS Offline'}
            </div>
            <div className="sb-role-badge defense-role">⛨ DEFENSE</div>
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
