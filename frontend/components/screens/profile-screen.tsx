"use client"

import { MobileScreen } from "@/components/mobile-frame"
import { BottomNav, NavItem } from "@/components/bottom-nav"
import { CategoryBadge } from "@/components/category-badge"
import { currentUser, notifications, formatCurrency } from "@/lib/mock-data"
import { 
  Settings, 
  CreditCard, 
  Package, 
  Heart, 
  LogOut, 
  ChevronRight,
  Gavel,
  TrendingUp,
  Award,
  Star
} from "lucide-react"

interface ProfileScreenProps {
  activeNav: NavItem
  onNavigate: (item: NavItem) => void
  onViewPayments: () => void
  onSettings: () => void
}

export function ProfileScreen({ activeNav, onNavigate, onViewPayments, onSettings }: ProfileScreenProps) {
  const unreadNotifications = notifications.filter(n => !n.read).length
  
  const menuItems = [
    { icon: CreditCard, label: 'Medios de Pago', action: onViewPayments },
    { icon: Package, label: 'Mis Articulos', action: () => {} },
    { icon: Heart, label: 'Favoritos', action: () => {} },
    { icon: Settings, label: 'Configuracion', action: onSettings },
  ]
  
  return (
    <MobileScreen safeAreaTop={false}>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="px-4 pt-14 pb-6" style={{ background: '#AFD3E2', borderBottom: '1px solid #8BBDD0' }}>
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-xl font-bold" style={{ color: '#0a3d54' }}>Mi Perfil</h1>
            <button onClick={onSettings} className="p-2 hover:bg-white/30 rounded-full transition-colors">
              <Settings className="w-5 h-5" style={{ color: '#0a3d54' }} />
            </button>
          </div>
          
          {/* Profile Card */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 2px 12px rgba(10,61,84,0.10)' }}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: '#0a3d54', color: '#FFFFFF' }}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">{currentUser.name}</h2>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                <div className="mt-2">
                  <CategoryBadge category={currentUser.category} size="sm" />
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.5)' }}>
              <div className="text-center">
                <p className="font-mono text-lg font-bold text-foreground">
                  {currentUser.metrics.totalAuctions}
                </p>
                <p className="text-[10px] text-muted-foreground">Subastas</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-lg font-bold text-primary">
                  {currentUser.metrics.wonAuctions}
                </p>
                <p className="text-[10px] text-muted-foreground">Ganadas</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <p className="font-mono text-lg font-bold text-foreground">
                    {currentUser.metrics.rating}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground">Rating</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto px-4">
          {/* Detailed Metrics */}
          <div className="mb-6 mt-6">
            <h3 className="font-semibold text-foreground mb-3">Tus Metricas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Gavel className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Total Pujas</span>
                </div>
                <p className="font-mono text-2xl font-bold text-foreground">
                  {currentUser.metrics.totalBids}
                </p>
              </div>
              
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Total Gastado</span>
                </div>
                <p className="font-mono text-2xl font-bold text-foreground">
                  {formatCurrency(currentUser.metrics.totalSpent)}
                </p>
              </div>
              
              <div className="bg-card rounded-xl border border-border p-4 col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Award className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tasa de exito</p>
                      <p className="font-mono text-lg font-bold text-foreground">
                        {((currentUser.metrics.wonAuctions / currentUser.metrics.totalAuctions) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(currentUser.metrics.wonAuctions / currentUser.metrics.totalAuctions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="space-y-2 pb-8">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              )
            })}
            
            {/* Logout */}
            <button className="w-full flex items-center gap-4 p-4 bg-destructive/5 rounded-xl border border-destructive/10 hover:bg-destructive/10 transition-colors mt-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <span className="flex-1 text-left font-medium text-destructive">Cerrar Sesion</span>
            </button>
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <BottomNav 
          active={activeNav} 
          onNavigate={onNavigate}
          notificationCount={unreadNotifications}
        />
      </div>
    </MobileScreen>
  )
}
