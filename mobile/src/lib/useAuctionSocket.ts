import { useState, useEffect, useRef } from 'react'
import { getWsBaseUrl } from './api'

export type WsMessage =
  | { type: 'hello'; at: string; auctionId: number; message: string }
  | { type: 'bid_placed'; at: string; auctionId: number; itemId: number; bidId: number; importe: number; clienteId: number }
  | { type: 'bid_accepted'; at: string; auctionId: number; itemId: number; bidId: number; importe: number; clienteId: number }
  | { type: 'item_sold'; at: string; auctionId: number; itemId: number; clienteId: number; importe: number }
  | { type: 'auction_ended'; at: string; auctionId: number }
  | { type: 'item_changed'; at: string; auctionId: number; itemId: number; change: string }

export function useAuctionSocket(auctionId: number) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WsMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    function connect() {
      if (!mountedRef.current) return
      const ws = new WebSocket(`${getWsBaseUrl()}/ws/auction/${auctionId}`)
      wsRef.current = ws

      ws.onopen = () => {
        if (mountedRef.current) setConnected(true)
      }
      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        retryRef.current = setTimeout(connect, 3000)
      }
      ws.onerror = () => { ws.close() }
      ws.onmessage = (e) => {
        if (!mountedRef.current) return
        try {
          setLastEvent(JSON.parse(e.data) as WsMessage)
        } catch {}
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [auctionId])

  return { connected, lastEvent }
}
