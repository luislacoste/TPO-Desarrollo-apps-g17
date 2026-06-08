"use client"

import { useState, useEffect } from "react"
import { MobileScreen } from "@/components/mobile-frame"
import { ArrowLeft, Flame, Gavel, Users, Star, ChevronRight, Image as ImageIcon } from "lucide-react"
import { auctions, auctionItems } from "@/lib/mock-data"

interface AuctionLiveScreenProps {
  auctionId: string
  onBack: () => void
  onViewItem: (itemId: string) => void
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${seconds % 60}s`
}

export function AuctionLiveScreen({ auctionId, onBack, onViewItem }: AuctionLiveScreenProps) {
  const auction = auctions.find(a => a.id === auctionId) || auctions[0]
  const items = auctionItems.filter(item => item.auctionId === auction.id)
  const [timeRemaining, setTimeRemaining] = useState(8100) // 2h 15m

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const totalBids = items.reduce((acc, item) => acc + (item.bidCount ?? 0), 0)
  const auctioneerInitial = auction.auctioneer.charAt(0).toUpperCase()

  return (
    <MobileScreen safeAreaTop={false} safeAreaBottom={false}>
      <div style={{ position: 'relative', height: '100%', background: '#FFFFFF', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 69,
          background: '#AFD3E2', display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 12, zIndex: 10,
          borderBottom: '1px solid #8BBDD0',
        }}>
          <button
            onClick={onBack}
            style={{ padding: '8px 8px 8px 0', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            aria-label="Volver"
          >
            <ArrowLeft style={{ width: 20, height: 20, color: '#0a3d54' }} />
          </button>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0a3d54', lineHeight: '24px' }}>
            {auction.title}
          </span>
          <span style={{
            padding: '2px 8px', background: '#FB2C36', borderRadius: 999,
            fontSize: 13, fontWeight: 700, color: '#FFFFFF', flexShrink: 0,
          }}>
            EN VIVO
          </span>
        </div>

        {/* Auctioneer info bar */}
        <div style={{
          position: 'absolute', top: 69, left: 0, right: 0, height: 121,
          background: 'rgba(245,245,245,0.3)', padding: '16px 16px 0',
          display: 'flex', flexDirection: 'column', gap: 13,
        }}>
          {/* Row 1: avatar + name + rating + badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: 'rgba(23,23,23,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#171717' }}>{auctioneerInitial}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 19, fontWeight: 500, color: '#0A0A0A', lineHeight: '20px' }}>
                  {auction.auctioneer}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star style={{ width: 12, height: 12, fill: '#FD9A00', color: '#FD9A00' }} />
                  <span style={{ fontSize: 14, color: '#737373' }}>4.8</span>
                </div>
              </div>
            </div>
            <span style={{
              padding: '2px 8px',
              background: '#FEF3C6', border: '1px solid #FEE685', borderRadius: 999,
              fontSize: 13, fontWeight: 500, color: '#BB4D00',
            }}>
              Oro
            </span>
          </div>

          {/* Row 2: meta info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame style={{ width: 16, height: 16, color: '#FB2C36' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FB2C36' }}>
                Termina en {formatCountdown(timeRemaining)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gavel style={{ width: 16, height: 16, color: '#737373' }} />
              <span style={{ fontSize: 13, color: '#737373' }}>{items.length} items</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users style={{ width: 16, height: 16, color: '#737373' }} />
              <span style={{ fontSize: 13, color: '#737373' }}>{totalBids} ofertas</span>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ position: 'absolute', top: 190, left: 0, right: 0, bottom: 0, overflowY: 'auto' }}>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 32 }}>

            {/* Section heading */}
            <span style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>
              Items en esta subasta ({items.length})
            </span>

            {/* Item cards */}
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewItem(item.id)}
                style={{
                  display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
                  padding: 14, gap: 12,
                  background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 14,
                  width: '100%', textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box',
                }}
              >
                {/* Product image placeholder */}
                <div style={{
                  width: 80, height: 80, borderRadius: 10,
                  background: '#F5F5F5', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ImageIcon style={{ width: 28, height: 28, color: '#D4D4D4' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, alignSelf: 'stretch' }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#0A0A0A', lineHeight: '20px' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: 13, color: '#737373', lineHeight: '20px' }}>
                    {item.description}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#0A0A0A', lineHeight: '15px' }}>Oferta actual</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#171717', lineHeight: '20px' }}>
                        $ {(item.currentBid ?? item.basePrice).toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users style={{ width: 12, height: 12, color: '#737373' }} />
                      <span style={{ fontSize: 12, color: '#737373' }}>{item.bidCount ?? 0} ofertas</span>
                    </div>
                  </div>
                </div>

                {/* Chevron */}
                <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
                  <ChevronRight style={{ width: 20, height: 20, color: '#737373' }} />
                </div>
              </button>
            ))}

            {/* Como participar */}
            <div style={{
              padding: 16, background: '#AFD3E2', borderRadius: 14,
              display: 'flex', flexDirection: 'column', gap: 8,
              border: '1px solid #8BBDD0',
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0a3d54', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Como participar</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Selecciona el item por el que quieres pujar',
                  'Ingresa tu oferta (debe ser mayor a la actual)',
                  'Confirma tu puja y espera el resultado',
                  'Puedes pujar por multiples items simultaneamente',
                ].map((text, i) => (
                  <span key={i} style={{ fontSize: 13, color: '#146C94', lineHeight: '20px' }}>
                    {i + 1}. {text}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </MobileScreen>
  )
}
