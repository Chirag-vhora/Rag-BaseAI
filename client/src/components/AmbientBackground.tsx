import React from 'react';

/**
 * AmbientBackground — pure presentational layer.
 * Renders the fixed liquid "aurora" backdrop (flowing gradient orbs,
 * engineering grid and vignette). It never touches app state or APIs.
 */
export const AmbientBackground: React.FC = () => (
  <div className="aurora-shell" aria-hidden="true">
    <div className="aurora-orb aurora-orb-1" />
    <div className="aurora-orb aurora-orb-2" />
    <div className="aurora-orb aurora-orb-3" />
    <div className="aurora-orb aurora-orb-4" />
    <div className="aurora-cube-scene">
      <div className="aurora-cube">
        <div className="aurora-cube__face aurora-cube__face--front" />
        <div className="aurora-cube__face aurora-cube__face--back" />
        <div className="aurora-cube__face aurora-cube__face--right" />
        <div className="aurora-cube__face aurora-cube__face--left" />
        <div className="aurora-cube__face aurora-cube__face--top" />
        <div className="aurora-cube__face aurora-cube__face--bottom" />
      </div>
    </div>
    <div className="aurora-grid" />
    <div className="aurora-vignette" />
  </div>
);

export default AmbientBackground;
