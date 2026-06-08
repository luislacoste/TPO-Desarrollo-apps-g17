"use client"

import { MobileScreen } from "@/components/mobile-frame"
import { BottomNav } from "@/components/bottom-nav"
import type { NavItem } from "@/components/bottom-nav"
import { Search, Bell, ChevronRight, Flame, Clock, Gavel } from "lucide-react"
import { auctions, currentUser, notifications, formatRelativeDate } from "@/lib/mock-data"

interface HomeScreenProps {
  activeNav: NavItem
  onNavigate: (item: NavItem) => void
  onViewAuction: (auctionId: string) => void
  userName?: string
}

const ICON_GRADIENTS = [
  'linear-gradient(135deg, #FF6900 0%, #FB2C36 100%)',
  'linear-gradient(135deg, #FE9A00 0%, #F54900 100%)',
  'linear-gradient(135deg, #FB2C36 0%, #E60076 100%)',
  'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
  'linear-gradient(135deg, #06D6A0 0%, #118577 100%)',
]

export function HomeScreen({ activeNav, onNavigate, onViewAuction, userName }: HomeScreenProps) {
  const liveAuctions = auctions.filter(a => a.status === 'live')
  const upcomingAuctions = auctions.filter(a => a.status === 'upcoming').slice(0, 5)
  const unreadNotifications = notifications.filter(n => !n.read).length
  const displayName = userName ? userName : currentUser.name.split(' ').slice(0, 2).join(' ')

  return (
    <MobileScreen safeAreaTop={false}>
      <div className="h-full flex flex-col" style={{ background: '#FFFFFF' }}>

        {/* Header */}
        <div style={{ padding: '24px 16px 16px', background: '#AFD3E2', borderBottom: '1px solid #8BBDD0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#146C94', fontWeight: 400 }}>Hola,</p>
              <h1 style={{ fontSize: 20, lineHeight: '28px', color: '#0a3d54', fontWeight: 700 }}>{displayName}</h1>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label={`Notificaciones (${unreadNotifications})`}
            >
              <Bell style={{ width: 20, height: 20, color: '#0a3d54' }} />
              {unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 16, height: 16, background: '#E7000B', borderRadius: '50%',
                  fontSize: 10, fontWeight: 700, color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#737373' }} />
            <input
              type="text"
              placeholder="Buscar subastas, articulos..."
              style={{
                width: '100%', height: 44, paddingLeft: 44, paddingRight: 16,
                background: '#F5F5F5', borderRadius: 14, border: 'none',
                fontSize: 14, color: '#0A0A0A', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 91 }}>

          {/* Categorias row */}
          <button
            onClick={() => onNavigate('catalog')}
            style={{
              width: '100%', padding: '12px 16px',
              borderBottom: '1px solid #E5E5E5', background: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', lineHeight: '24px' }}>Categorias</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#737373', lineHeight: '16px' }}>5</span>
              <ChevronRight style={{ width: 16, height: 16, color: '#737373' }} />
            </div>
          </button>

          {/* En Vivo Ahora row */}
          {liveAuctions.length > 0 && (
            <button
              onClick={() => onViewAuction(liveAuctions[0].id)}
              style={{
                width: '100%', padding: '12px 16px',
                borderBottom: '1px solid #E5E5E5', background: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flame style={{ width: 20, height: 20, color: '#FB2C36' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', lineHeight: '24px' }}>En Vivo Ahora</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '2px 8px', background: '#FB2C36', borderRadius: 999,
                  fontSize: 12, fontWeight: 700, color: '#FFFFFF', lineHeight: '16px',
                }}>
                  {liveAuctions.length} activas
                </span>
                <ChevronRight style={{ width: 16, height: 16, color: '#737373' }} />
              </div>
            </button>
          )}

          {/* Proximas Subastas */}
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock style={{ width: 20, height: 20, color: '#171717' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', lineHeight: '24px' }}>Proximas Subastas</span>
              </div>
              <button
                onClick={() => onNavigate('catalog')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500, color: '#171717', cursor: 'pointer' }}
              >
                Ver todas
                <ChevronRight style={{ width: 16, height: 16, color: '#171717' }} />
              </button>
            </div>

            {/* Auction list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingAuctions.map((auction, i) => (
                <button
                  key={auction.id}
                  onClick={() => onViewAuction(auction.id)}
                  style={{
                    display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
                    padding: 12, gap: 12,
                    background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 14,
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Gradient icon area */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 10,
                      background: ICON_GRADIENTS[i % ICON_GRADIENTS.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Gavel style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.8)' }} />
                    </div>
                    <span style={{
                      position: 'absolute', bottom: -4, right: -4,
                      width: 19, height: 19,
                      background: '#171717', borderRadius: '50%',
                      fontSize: 10, fontWeight: 700, color: '#FAFAFA',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {auction.itemCount}
                    </span>
                  </div>

                  {/* Text info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A', lineHeight: '20px' }}>
                      {auction.title}
                    </span>
                    <span style={{ fontSize: 12, color: '#737373', lineHeight: '16px' }}>
                      Inicia: {formatRelativeDate(auction.startDate)}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#171717', lineHeight: '20px', paddingTop: 2 }}>
                      Desde $ {auction.startingPrice.toLocaleString('es-AR')}
                    </span>
                  </div>

                  {/* Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', height: 64, flexShrink: 0 }}>
                    <ChevronRight style={{ width: 20, height: 20, color: '#737373' }} />
                  </div>
                </button>
              ))}
            </div>
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
