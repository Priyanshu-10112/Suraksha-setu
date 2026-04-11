// BackgroundVideo.jsx
// Fullscreen CSS-animated background for login pages.
// No actual video file needed — uses pure CSS to simulate
// a defense/radar signal aesthetic (avoids 5MB video asset).
export default function BackgroundVideo() {
  return (
    <div className="bgv-root" aria-hidden="true">
      {/* Simulated video: animated CSS layers that look like radar/signal */}
      <div className="bgv-base" />
      <div className="bgv-grid" />
      <div className="bgv-radar-wrap">
        <div className="bgv-radar-ring r1" />
        <div className="bgv-radar-ring r2" />
        <div className="bgv-radar-ring r3" />
        <div className="bgv-radar-sweep" />
      </div>
      <div className="bgv-scan" />
      <div className="bgv-overlay" />
    </div>
  )
}
