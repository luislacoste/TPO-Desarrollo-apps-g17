"use client"

import { useState, useEffect } from "react"
import { MobileScreen } from "@/components/mobile-frame"
import { ArrowLeft, Flame, Users, Image as ImageIcon, Minus, Plus, Check, X } from "lucide-react"
import { auctions, auctionItems } from "@/lib/mock-data"

interface ItemDetailScreenProps {
  itemId: string
  onBack: () => void
  onGoHome: () => void
}

type BidStatus = 'idle' | 'success' | 'error'

function getMinIncrement(currentBid: number): number {
  if (currentBid >= 2000000) return 100000
  if (currentBid >= 500000) return 50000
  if (currentBid >= 100000) return 25000
  return 5000
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${seconds % 60}s`
}

function formatARS(amount: number): string {
  return '$ ' + amount.toLocaleString('es-AR')
}

export function ItemDetailScreen({ itemId, onBack, onGoHome }: ItemDetailScreenProps) {
  const item = auctionItems.find(i => i.id === itemId) || auctionItems[0]
  const auction = auctions.find(a => a.id === item.auctionId) || auctions[0]
  const currentBid = item.currentBid ?? item.basePrice
  const minIncrement = getMinIncrement(currentBid)

  const [bidAmount, setBidAmount] = useState(currentBid + minIncrement)
  const [timeRemaining, setTimeRemaining] = useState(8100)
  const [bidStatus, setBidStatus] = useState<BidStatus>('idle')

  useEffect(() => {
    const timer = setInterval(() => setTimeRemaining(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleOffer = () => {
    const success = Math.random() > 0.2
    setBidStatus(success ? 'success' : 'error')
  }

  const quickIncrements = [minIncrement, minIncrement * 2, minIncrement * 5]
  const selectedQuickIndex = quickIncrements.indexOf(bidAmount - currentBid)

  const decrement = () => setBidAmount(prev => Math.max(currentBid + minIncrement, prev - minIncrement))
  const increment = () => setBidAmount(prev => prev + minIncrement)
  const applyQuick = (inc: number) => setBidAmount(currentBid + inc)

  const overCurrent = bidAmount - currentBid

  return (
    <MobileScreen safeAreaTop={false} safeAreaBottom={false}>
      <div style={{ position: 'relative', height: '100%', background: '#FFFFFF', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          flexShrink: 0, height: 73, background: '#AFD3E2',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
          borderBottom: '1px solid #8BBDD0',
        }}>
          <button
            onClick={onBack}
            style={{ padding: '8px 8px 8px 0', display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
            aria-label="Volver"
          >
            <ArrowLeft style={{ width: 20, height: 20, color: '#0a3d54' }} />
          </button>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, color: '#146C94', lineHeight: '16px' }}>{auction.title}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#0a3d54', lineHeight: '24px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </span>
          </div>
          <span style={{
            padding: '2px 8px', background: '#FB2C36', borderRadius: 999,
            fontSize: 12, fontWeight: 700, color: '#FFFFFF', flexShrink: 0,
          }}>
            EN VIVO
          </span>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Product image */}
          <div style={{ width: '100%', height: 280, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageIcon style={{ width: 72, height: 72, color: '#D4D4D4' }} />
          </div>

          {/* Info section */}
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Bid count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users style={{ width: 16, height: 16, color: '#737373' }} />
              <span style={{ fontSize: 14, color: '#737373' }}>{item.bidCount ?? 0} ofertas</span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', lineHeight: '28px', margin: 0 }}>
              {item.title}
            </h1>

            {/* Countdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame style={{ width: 20, height: 20, color: '#FB2C36' }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#FB2C36' }}>
                Termina en {formatCountdown(timeRemaining)}
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: 14, color: '#737373', lineHeight: '22px', margin: 0, whiteSpace: 'pre-line' }}>
              {item.longDescription ?? item.description}
            </p>
          </div>

          {/* Current bid bar */}
          <div style={{
            padding: 16, background: 'rgba(245,245,245,0.3)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#737373', lineHeight: '16px' }}>Oferta actual</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', lineHeight: '32px' }}>
                {formatARS(currentBid)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#737373', lineHeight: '16px' }}>Incremento minimo</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', lineHeight: '32px' }}>
                {formatARS(minIncrement)}
              </div>
            </div>
          </div>

          {/* Bid input section */}
          <div style={{ padding: '24px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Heading */}
            <span style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>Tu oferta</span>

            {/* +/- controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, paddingTop: 4 }}>
              <button
                onClick={decrement}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  border: '2px solid #F5F5F5', background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
                aria-label="Disminuir oferta"
              >
                <Minus style={{ width: 20, height: 20, color: '#737373' }} />
              </button>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: '#0A0A0A', lineHeight: '32px', whiteSpace: 'nowrap' }}>
                  {formatARS(bidAmount)}
                </span>
                <span style={{ fontSize: 12, color: '#737373', whiteSpace: 'nowrap' }}>
                  +{formatARS(overCurrent)} sobre actual
                </span>
              </div>

              <button
                onClick={increment}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  border: '2px solid #171717', background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
                aria-label="Aumentar oferta"
              >
                <Plus style={{ width: 20, height: 20, color: '#171717' }} />
              </button>
            </div>

            {/* Quick bid chips */}
            <div style={{ display: 'flex', gap: 8 }}>
              {quickIncrements.map((inc, i) => {
                const isSelected = i === selectedQuickIndex
                return (
                  <button
                    key={i}
                    onClick={() => applyQuick(inc)}
                    style={{
                      flex: 1, height: 36, borderRadius: 10,
                      background: isSelected ? '#171717' : '#F5F5F5',
                      border: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: 500,
                      color: isSelected ? '#FAFAFA' : '#0A0A0A',
                    }}
                  >
                    +{formatARS(inc)}
                  </button>
                )
              })}
            </div>

            {/* Submit button */}
            <button
              onClick={handleOffer}
              style={{
                width: '100%', height: 48, background: '#171717', borderRadius: 8,
                border: 'none', cursor: 'pointer',
                fontSize: 16, fontWeight: 600, color: '#FAFAFA',
              }}
            >
              Ofertar {formatARS(bidAmount)}
            </button>

            {/* Terms */}
            <p style={{ fontSize: 12, color: '#737373', textAlign: 'center', margin: 0 }}>
              Al ofertar aceptas los terminos y condiciones
            </p>
          </div>

        </div>

        {/* Confirmation overlay */}
        {bidStatus !== 'idle' && (
          <div style={{
            position: 'absolute', inset: 0, background: '#FFFFFF', zIndex: 50,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>

              {/* Icon circle */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: bidStatus === 'success' ? '#DCFCE7' : '#FFC4C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
              }}>
                {bidStatus === 'success'
                  ? <Check style={{ width: 40, height: 40, color: '#00A63E', strokeWidth: 3 }} />
                  : <X style={{ width: 40, height: 40, color: '#E7000B', strokeWidth: 3 }} />
                }
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A', textAlign: 'center', margin: 0 }}>
                {bidStatus === 'success' ? 'Oferta realizada' : 'No pudimos realizar tu oferta'}
              </h2>

              {/* Subtitles */}
              {bidStatus === 'success' ? (
                <>
                  <p style={{ fontSize: 16, color: '#737373', textAlign: 'center', margin: 0 }}>
                    Tu oferta de {formatARS(bidAmount)}
                  </p>
                  <p style={{ fontSize: 16, color: '#737373', textAlign: 'center', margin: 0 }}>
                    por {item.title} fue registrada
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 16, color: '#737373', textAlign: 'center', margin: 0 }}>
                  Intente ofertar nuevamente
                </p>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 24 }}>
                <button
                  onClick={onBack}
                  style={{
                    width: '100%', height: 36, background: '#19A7CE', borderRadius: 8,
                    border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 500, color: '#FAFAFA',
                  }}
                >
                  {bidStatus === 'success' ? 'Ver otros items de esta subasta' : 'Ver o ofertar'}
                </button>
                <button
                  onClick={onGoHome}
                  style={{
                    width: '100%', height: 36, background: '#AFD3E2', borderRadius: 8,
                    border: '1px solid #E5E5E5', cursor: 'pointer',
                    fontSize: 14, fontWeight: 500, color: '#0A0A0A',
                    boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  Volver al inicio
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </MobileScreen>
  )
}
