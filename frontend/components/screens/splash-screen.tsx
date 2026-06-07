"use client"

import { useEffect } from "react"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 5500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div style={styles.container}>
      <style>{css}</style>

      <div style={styles.ring1} />
      <div style={styles.ring2} />
      <div style={styles.ring3} />

      <div style={styles.logoWrap}>
        <img src="/icono-png.png" alt="SubastAR logo" style={styles.logoImg} />
        <div style={styles.appName}>SubastAR</div>
        <div style={styles.tagline}>Subastas en tiempo real</div>
      </div>

      <div style={styles.spinner} />
    </div>
  )
}

const css = `
  @keyframes bgFade {
    from { background-color: #0a3d54; }
    to   { background-color: #146C94; }
  }

  @keyframes ring1Expand {
    from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    to   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  }
  @keyframes ring2Expand {
    from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    to   { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  }
  @keyframes ring3Expand {
    from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    to   { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  }

  @keyframes logoDrop {
    0%   { transform: translateY(-80px) scale(0.4) rotate(-15deg); opacity: 0; }
    70%  { transform: translateY(0)     scale(1)   rotate(0deg);   opacity: 1; }
    82%  { transform: translateY(6px); }
    100% { transform: translateY(0); }
  }

  @keyframes nameReveal {
    from { clip-path: inset(0 100% 0 0); }
    to   { clip-path: inset(0 0%   0 0); }
  }

  @keyframes taglineFade {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  @keyframes spinnerFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes spinnerSpin {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
`

const styles = {
  container: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#146C94',
    animation: 'bgFade 1.2s ease-out both',
  },
  ring1: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 220,
    height: 220,
    borderRadius: '50%',
    border: '2px solid rgba(175, 211, 226, 0.25)',
    animation: 'ring1Expand 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both',
  },
  ring2: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 360,
    height: 360,
    borderRadius: '50%',
    border: '2px solid rgba(175, 211, 226, 0.25)',
    animation: 'ring2Expand 1.8s cubic-bezier(0.34, 1.2, 0.64, 1) 0.5s both',
  },
  ring3: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 520,
    height: 520,
    borderRadius: '50%',
    border: '2px solid rgba(175, 211, 226, 0.25)',
    animation: 'ring3Expand 2.2s cubic-bezier(0.34, 1, 0.64, 1) 0.8s both',
  },
  logoWrap: {
    position: 'relative' as const,
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 20,
  },
  logoImg: {
    width: 120,
    height: 120,
    objectFit: 'contain' as const,
    filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))',
    animation: 'logoDrop 2s cubic-bezier(0.34, 1.4, 0.64, 1) 0.6s both',
  },
  appName: {
    color: '#F6F1F1',
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    whiteSpace: 'nowrap' as const,
    clipPath: 'inset(0 100% 0 0)',
    animation: 'nameReveal 1.1s ease-out 2.8s both',
  },
  tagline: {
    color: '#AFD3E2',
    fontSize: '0.75rem',
    letterSpacing: '0.3em',
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    opacity: 0,
    animation: 'taglineFade 0.9s ease-out 3.6s both',
  },
  spinner: {
    position: 'absolute' as const,
    bottom: 48,
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '3px solid rgba(175, 211, 226, 0.2)',
    borderTopColor: '#AFD3E2',
    opacity: 0,
    animation: 'spinnerFadeIn 0.6s ease-out 4.2s both, spinnerSpin 2.2s linear 4.3s infinite',
  },
}
