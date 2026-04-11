import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SurveillanceProvider, useSurveillance } from './context/SurveillanceContext'
import PageTransition from './components/PageTransition'

import DefenseLogin   from './pages/DefenseLogin'
import CivilianLogin  from './pages/CivilianLogin'
import LandingPage    from './pages/LandingPage'
import DefenseLayout  from './pages/defense/Layout'
import CivilianLayout from './pages/civilian/Layout'

import LiveSurveillance from './pages/defense/LiveSurveillance'
import ThreatDetection  from './pages/defense/ThreatDetection'
import ZoneManagement   from './pages/defense/ZoneManagement'
import AlertCenter      from './pages/defense/AlertCenter'
import Settings         from './pages/defense/Settings'
import CameraManagement from './pages/defense/CameraManagement'
import FaceRecognition  from './pages/defense/FaceRecognition'

import LiveMonitoring  from './pages/civilian/LiveMonitoring'
import SafetyAlerts    from './pages/civilian/SafetyAlerts'
import ZoneView        from './pages/civilian/ZoneView'
import IncidentReports from './pages/civilian/IncidentReports'

function ProtectedDefense({ children }) {
  const { user } = useSurveillance()
  if (!user || user.role !== 'defense') return <Navigate to="/" replace />
  return children
}

function ProtectedCivilian({ children }) {
  const { user } = useSurveillance()
  if (!user || user.role !== 'civilian') return <Navigate to="/" replace />
  return children
}

// Wrap each page-level element in PageTransition
function T({ children }) {
  return <PageTransition>{children}</PageTransition>
}

function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />

        <Route path="/defense-login"  element={<T><DefenseLogin /></T>} />
        <Route path="/civilian-login" element={<T><CivilianLogin /></T>} />

        <Route path="/defense" element={<ProtectedDefense><DefenseLayout /></ProtectedDefense>}>
          <Route index element={<Navigate to="live" replace />} />
          <Route path="live"     element={<T><LiveSurveillance /></T>} />
          <Route path="threats"  element={<T><ThreatDetection /></T>} />
          <Route path="zones"    element={<T><ZoneManagement /></T>} />
          <Route path="alerts"   element={<T><AlertCenter /></T>} />
          <Route path="faces"    element={<T><FaceRecognition /></T>} />
          <Route path="settings" element={<T><Settings /></T>} />
          <Route path="cameras"  element={<T><CameraManagement /></T>} />
        </Route>

        <Route path="/civilian" element={<ProtectedCivilian><CivilianLayout /></ProtectedCivilian>}>
          <Route index element={<Navigate to="live" replace />} />
          <Route path="live"    element={<T><LiveMonitoring /></T>} />
          <Route path="alerts"  element={<T><SafetyAlerts /></T>} />
          <Route path="zones"   element={<T><ZoneView /></T>} />
          <Route path="reports" element={<T><IncidentReports /></T>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <SurveillanceProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </SurveillanceProvider>
  )
}
