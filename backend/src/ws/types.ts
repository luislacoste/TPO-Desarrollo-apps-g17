/**
 * Tipos de los mensajes que el server envía a los clientes WebSocket.
 *
 * Alineados con la lista del swagger:
 *   bid_placed, bid_accepted, item_sold, auction_ended, item_changed.
 *
 * Todos llevan `at` (timestamp ISO) y el `auctionId` para que el cliente
 * pueda filtrar si está suscripto a varias salas.
 */
export type WsServerMessage =
  | {
      type: 'bid_placed';
      at: string;
      auctionId: number;
      itemId: number;
      bidId: number;
      importe: number;
      clienteId: number;
    }
  | {
      type: 'bid_accepted';
      at: string;
      auctionId: number;
      itemId: number;
      bidId: number;
      importe: number;
      clienteId: number;
    }
  | {
      type: 'item_sold';
      at: string;
      auctionId: number;
      itemId: number;
      clienteId: number;
      importe: number;
    }
  | {
      type: 'auction_ended';
      at: string;
      auctionId: number;
    }
  | {
      type: 'item_changed';
      at: string;
      auctionId: number;
      itemId: number;
      change: string;
    }
  | {
      type: 'hello';
      at: string;
      auctionId: number;
      message: string;
    };
