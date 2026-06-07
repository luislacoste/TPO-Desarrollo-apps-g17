"use client"

import { Home, LayoutGrid, User, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

export type NavItem = 'home' | 'catalog' | 'notifications' | 'profile'

interface BottomNavProps {
  active: NavItem
  onNavigate?: (item: NavItem) => void
  notificationCount?: number
}

const navItems: { id: NavItem; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'catalog', label: 'Catalogo', icon: LayoutGrid },
  { id: 'notifications', label: 'Alertas', icon: Bell },
  { id: 'profile', label: 'Perfil', icon: User },
]

export function BottomNav({ active, onNavigate, notificationCount = 0 }: BottomNavProps) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 border-t pb-[34px]" style={{ background: '#FAFAFA', borderColor: '#E5E5E5' }}>
      <div className="flex items-center justify-around h-[56px]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1 relative transition-colors",
              )}
              style={{ color: isActive ? '#3E73EE' : '#737373' }}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {item.id === 'notifications' && notificationCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={{ background: '#E7000B', color: '#FFFFFF' }}
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px]",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
