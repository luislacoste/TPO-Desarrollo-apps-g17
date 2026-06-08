"use client"

import { MobileScreen } from "@/components/mobile-frame"
import { BottomNav, NavItem } from "@/components/bottom-nav"
import { notifications } from "@/lib/mock-data"
import { Bell, Gavel, CreditCard, Settings, CheckCheck, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationsScreenProps {
  activeNav: NavItem
  onNavigate: (item: NavItem) => void
}

export function NotificationsScreen({ activeNav, onNavigate }: NotificationsScreenProps) {
  const unreadNotifications = notifications.filter(n => !n.read).length
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bid': return Gavel
      case 'auction': return Bell
      case 'payment': return CreditCard
      default: return Settings
    }
  }
  
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'bid': return 'bg-amber-500/10 text-amber-600'
      case 'auction': return 'bg-primary/10 text-primary'
      case 'payment': return 'bg-green-500/10 text-green-600'
      default: return 'bg-muted text-muted-foreground'
    }
  }
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Hace un momento'
    if (hours < 24) return `Hace ${hours}h`
    if (days === 1) return 'Ayer'
    return `Hace ${days} dias`
  }
  
  return (
    <MobileScreen safeAreaTop={false}>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="px-4 pt-14 pb-4 border-b" style={{ background: '#AFD3E2', borderColor: '#8BBDD0' }}>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold" style={{ color: '#0a3d54' }}>Notificaciones</h1>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/30 rounded-full transition-colors">
                <CheckCheck className="w-5 h-5" style={{ color: '#146C94' }} />
              </button>
              <button className="p-2 hover:bg-white/30 rounded-full transition-colors">
                <Trash2 className="w-5 h-5" style={{ color: '#146C94' }} />
              </button>
            </div>
          </div>
          {unreadNotifications > 0 && (
            <p className="text-sm" style={{ color: '#146C94' }}>
              {unreadNotifications} sin leer
            </p>
          )}
        </div>
        
        {/* Notifications List */}
        <div className="flex-1 overflow-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                const colorClass = getNotificationColor(notification.type)
                
                return (
                  <button
                    key={notification.id}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors text-left",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      colorClass
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "font-medium text-foreground",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-foreground">No hay notificaciones</p>
              <p className="text-sm text-muted-foreground mt-1">
                Te avisaremos cuando haya novedades en tus subastas
              </p>
            </div>
          )}
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
