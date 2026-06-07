/**
 * Bus de eventos de dominio.
 *
 * Lo usan los services para anunciar cambios sin acoplarse al WebSocket
 * (ni a ninguna otra capa). El módulo `ws` se suscribe a estos eventos y
 * los traduce en mensajes que se broadcasteán a los clientes conectados.
 *
 * Mantener el shape de los datos cerca del modelo del dominio
 * (en camelCase) — no devolver `pg.Row` crudos.
 */
import { EventEmitter } from 'events';

export interface BidPlacedEvent {
  auctionId: number;
  itemId: number;
  bidId: number;
  importe: number;
  clienteId: number;
  asistenteId: number;
}

export interface BidAcceptedEvent extends BidPlacedEvent {
  // En esta API toda puja insertada está aceptada (pasó las validaciones
  // del service). Emitimos `bid_accepted` junto con `bid_placed` para
  // mantener el shape del swagger.
}

export interface ItemSoldEvent {
  auctionId: number;
  itemId: number;
  clienteId: number;
  importe: number;
}

export interface AuctionEndedEvent {
  auctionId: number;
}

export interface ItemChangedEvent {
  auctionId: number;
  itemId: number;
  change: 'price' | 'status' | 'description' | string;
}

export type DomainEvents = {
  bid_placed: BidPlacedEvent;
  bid_accepted: BidAcceptedEvent;
  item_sold: ItemSoldEvent;
  auction_ended: AuctionEndedEvent;
  item_changed: ItemChangedEvent;
};

/**
 * Singleton del bus. Los services emiten con `events.emit('bid_placed', {...})`.
 */
export const events = new EventEmitter();
events.setMaxListeners(50);
