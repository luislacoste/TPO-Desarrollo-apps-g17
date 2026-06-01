# Frontend — SubastAR (Expo / React Native)

App móvil del sistema de subastas. Stack: **Expo (managed) + React Native + TypeScript**, navegación con **Expo Router** (file-based).

## Estructura

```
frontend/
├── app/                       # Expo Router — cada archivo = ruta
│   ├── (auth)/                # Login, registro multi-paso, forgot
│   ├── (tabs)/                # Home, catálogo, favoritos, perfil, notifs
│   ├── auction/[id].tsx       # Detalle de subasta + pujas
│   ├── item/[id].tsx          # Detalle de ítem
│   ├── sell/                  # Flujo de vendedor (solicitar, condiciones, rechazo)
│   ├── fines/                 # Multas del usuario y pago
│   ├── admin/                 # Pantallas internas (gate por rol)
│   ├── payment-methods/       # Alta/listado de medios de pago
│   └── _layout.tsx            # Stack/Tabs root
│
├── src/
│   ├── api/                   # Cliente HTTP + módulos por recurso (auth, auctions, bids, fines, sell, admin…)
│   ├── components/
│   │   ├── ui/                # Botones, inputs, modales, badges genéricos
│   │   ├── auction/           # AuctionCard, BidInput, CountdownTimer…
│   │   └── forms/             # Wrappers de formularios reutilizables
│   ├── hooks/                 # useAuth, useAuction, useWebSocket…
│   ├── store/                 # Estado global (sesión, sockets, notifs)
│   ├── theme/                 # Paleta (`#146C94`, `#19A7CE`, `#AFD3E2`, `#F6F1F1`), tipografía
│   ├── types/                 # Tipos TS espejo del swagger (o desde `shared/types`)
│   ├── constants/             # URLs, enums, copys
│   └── utils/                 # Helpers (fechas, formatos, validaciones)
│
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
```

## Bootstrap inicial

Cuando alguien arme el proyecto:

```bash
cd frontend
npx create-expo-app@latest . --template tabs
# o un template TS vacío y mover los archivos a `app/`
```

Asegurarse de usar **Expo Router** y **TypeScript**.
