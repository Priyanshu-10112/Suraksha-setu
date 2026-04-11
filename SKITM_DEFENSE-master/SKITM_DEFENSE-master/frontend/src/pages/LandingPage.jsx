import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import RadarMapBackground from '../components/RadarMapBackground'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <RadarMapBackground />

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.h1
            className="hero-title"
            animate={{ 
              textShadow: [
                '0 0 20px rgba(34, 197, 94, 0.5)',
                '0 0 40px rgba(34, 197, 94, 0.8)',
                '0 0 20px rgba(34, 197, 94, 0.5)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            SURAKSHA-SETU
          </motion.h1>

          <motion.button
            className="hero-cta-btn"
            onClick={() => navigate('/defense-login')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Access Secure Portal
          </motion.button>
          
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            AI-Powered Real-Time Defense & Civil Surveillance System
          </motion.p>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <motion.div
          className="section-container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="section-title">About SurakshaSetu</h2>
          
          <div className="about-grid">
            <motion.div
              className="about-text"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="about-item">
                <div className="about-icon">🛡️</div>
                <div className="about-content">
                  <h3>Smart Surveillance System</h3>
                  <p>Advanced AI-powered monitoring with real-time threat analysis and automated response protocols.</p>
                </div>
              </div>

              <div className="about-item">
                <div className="about-icon">⚡</div>
                <div className="about-content">
                  <h3>Real-Time Threat Detection</h3>
                  <p>Instant identification and classification of security threats using cutting-edge machine learning.</p>
                </div>
              </div>

              <div className="about-item">
                <div className="about-icon">🤖</div>
                <div className="about-content">
                  <h3>AI-Based Decision Support</h3>
                  <p>Intelligent recommendations and automated alerts to enhance operational efficiency.</p>
                </div>
              </div>

              <div className="about-item">
                <div className="about-icon">👥</div>
                <div className="about-content">
                  <h3>Dual Mode Operation</h3>
                  <p>Separate interfaces for defense personnel and civilian monitoring with role-based access.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="about-visual"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="visual-grid">
                <motion.div
                  className="visual-item"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(34, 197, 94, 0.2)',
                      '0 0 40px rgba(34, 197, 94, 0.4)',
                      '0 0 20px rgba(34, 197, 94, 0.2)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="visual-icon">📹</div>
                  <div className="visual-label">Live Monitoring</div>
                </motion.div>
                <motion.div
                  className="visual-item"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(34, 197, 94, 0.2)',
                      '0 0 40px rgba(34, 197, 94, 0.4)',
                      '0 0 20px rgba(34, 197, 94, 0.2)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <div className="visual-icon">🎯</div>
                  <div className="visual-label">Threat Detection</div>
                </motion.div>
                <motion.div
                  className="visual-item"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(34, 197, 94, 0.2)',
                      '0 0 40px rgba(34, 197, 94, 0.4)',
                      '0 0 20px rgba(34, 197, 94, 0.2)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <div className="visual-icon">🔍</div>
                  <div className="visual-label">Face Recognition</div>
                </motion.div>
                <motion.div
                  className="visual-item"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(34, 197, 94, 0.2)',
                      '0 0 40px rgba(34, 197, 94, 0.4)',
                      '0 0 20px rgba(34, 197, 94, 0.2)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                >
                  <div className="visual-icon">⚠️</div>
                  <div className="visual-label">Alert System</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <motion.div
          className="section-container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="section-title">Key Features</h2>
          
          <div className="features-grid">
            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="feature-icon">📡</div>
              <h3 className="feature-title">Real-Time Monitoring</h3>
              <p className="feature-desc">
                24/7 live surveillance with multi-camera support and instant threat detection capabilities.
              </p>
            </motion.div>

            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="feature-icon">🔔</div>
              <h3 className="feature-title">Intelligent Alerts</h3>
              <p className="feature-desc">
                Smart notification system with priority-based alerts and automated response protocols.
              </p>
            </motion.div>

            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="feature-icon">🗺️</div>
              <h3 className="feature-title">Zone-Based Security</h3>
              <p className="feature-desc">
                Customizable security zones with restricted area monitoring and perimeter breach detection.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© SurakshaSetu | Secure. Smart. Reliable.</p>
      </footer>
    </div>
  )
}
