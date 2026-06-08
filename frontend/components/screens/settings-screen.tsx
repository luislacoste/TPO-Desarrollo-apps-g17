"use client"

import { useState } from "react"
import { MobileScreen } from "@/components/mobile-frame"
import { ArrowLeft, Bell, Moon, Globe, Shield, ChevronRight } from "lucide-react"

interface SettingsScreenProps {
  onBack: () => void
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [bidAlerts, setBidAlerts] = useState(true)

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: value ? '#146C94' : '#D4D4D4',
        position: 'relative', border: 'none', cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF',
        position: 'absolute', top: 3,
        left: value ? 21 : 3,
        transition: 'left 0.2s',
      }} />
    </button>
  )

  return (
    <MobileScreen safeAreaTop={false} safeAreaBottom={false}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-14 pb-4 border-b" style={{ background: '#AFD3E2', borderColor: '#8BBDD0' }}>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/30 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" style={{ color: '#0a3d54' }} />
            </button>
            <h1 className="font-bold text-lg" style={{ color: '#0a3d54' }}>Configuracion</h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
          {/* Notifications section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Notificaciones</p>

          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                  <Bell className="w-4 h-4" style={{ color: '#146C94' }} />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Notificaciones push</p>
                  <p className="text-xs text-muted-foreground">Alertas en tiempo real</p>
                </div>
              </div>
              <Toggle value={notifications} onChange={() => setNotifications(v => !v)} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                  <Shield className="w-4 h-4" style={{ color: '#146C94' }} />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Alertas de pujas</p>
                  <p className="text-xs text-muted-foreground">Cuando te superen una oferta</p>
                </div>
              </div>
              <Toggle value={bidAlerts} onChange={() => setBidAlerts(v => !v)} />
            </div>
          </div>

          {/* Apariencia */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2">Apariencia</p>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#F5F5F5' }}>
                  <Moon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Modo oscuro</p>
                  <p className="text-xs text-muted-foreground">Cambia el tema de la app</p>
                </div>
              </div>
              <Toggle value={darkMode} onChange={() => setDarkMode(v => !v)} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#F5F5F5' }}>
                  <Globe className="w-4 h-4 text-foreground" />
                </div>
                <p className="font-medium text-sm text-foreground">Idioma</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Español</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* About */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2">Acerca de</p>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <p className="font-medium text-sm text-foreground">Version</p>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <p className="font-medium text-sm text-foreground">Terminos y condiciones</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4">
              <p className="font-medium text-sm text-foreground">Politica de privacidad</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </MobileScreen>
  )
}
