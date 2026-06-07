/**
 * WebSocket server para subastas en vivo.
 *
 * URL:        ws://localhost:4000/ws/auction/:auctionId
 * Swagger:    wss://api.subastar.com/ws/auction/{auctionId}
 *
 * Cada conexión "se suscribe" a una sala identificada por `auctionId`.
 * Cuando los services emiten eventos de dominio (vía `services/events`),
 * los traducimos y los broadcasteamos a todos los clientes de esa sala.
 *
 * No requiere auth: los eventos son públicos. Auth y validaciones siguen
 * estando en los endpoints REST (POST /v1/bids, etc.).
 */
import type { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { events } from '../services/events';
import type {
  BidPlacedEvent,
  ItemSoldEvent,
  AuctionEndedEvent,
  ItemChangedEvent,
} from '../services/events';
import type { WsServerMessage } from './types';

// auctionId → set de clientes conectados a esa sala
const rooms = new Map<number, Set<WebSocket>>();

function joinRoom(auctionId: number, ws: WebSocket) {
  let room = rooms.get(auctionId);
  if (!room) {
    room = new Set();
    rooms.set(auctionId, room);
  }
  room.add(ws);
}

function leaveRoom(auctionId: number, ws: WebSocket) {
  const room = rooms.get(auctionId);
  if (!room) return;
  room.delete(ws);
  if (room.size === 0) rooms.delete(auctionId);
}

function broadcast(auctionId: number, msg: WsServerMessage) {
  const room = rooms.get(auctionId);
  if (!room || room.size === 0) return;
  const payload = JSON.stringify(msg);
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function parseAuctionId(url: string | undefined): number | null {
  if (!url) return null;
  const match = url.match(/^\/ws\/auction\/(\d+)(\?.*)?$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Engancha el WebSocket al server HTTP existente. Se llama desde
 * `server.ts` después de crear el `http.Server`.
 */
export function setupWebSocket(httpServer: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request: IncomingMessage, socket, head) => {
    const auctionId = parseAuctionId(request.url);
    if (auctionId === null) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, auctionId);
    });
  });

  wss.on('connection', (ws: WebSocket, _req, auctionId: number) => {
    joinRoom(auctionId, ws);

    const hello: WsServerMessage = {
      type: 'hello',
      at: new Date().toISOString(),
      auctionId,
      message: `Conectado a subasta ${auctionId}`,
    };
    ws.send(JSON.stringify(hello));

    ws.on('close', () => leaveRoom(auctionId, ws));
    ws.on('error', () => leaveRoom(auctionId, ws));
  });

  // ─── Suscripciones a eventos de dominio ───────────────────────────

  events.on('bid_placed', (e: BidPlacedEvent) => {
    const at = new Date().toISOString();
    broadcast(e.auctionId, { type: 'bid_placed',   at, ...e });
    broadcast(e.auctionId, { type: 'bid_accepted', at, ...e });
  });

  events.on('item_sold', (e: ItemSoldEvent) => {
    broadcast(e.auctionId, { type: 'item_sold', at: new Date().toISOString(), ...e });
  });

  events.on('auction_ended', (e: AuctionEndedEvent) => {
    broadcast(e.auctionId, { type: 'auction_ended', at: new Date().toISOString(), ...e });
  });

  events.on('item_changed', (e: ItemChangedEvent) => {
    broadcast(e.auctionId, { type: 'item_changed', at: new Date().toISOString(), ...e });
  });

  console.log('[ws] listo: ws://...:port/ws/auction/:auctionId');
}

// Helpers exportados sólo para tests / debugging
export const _internals = { rooms, broadcast };
