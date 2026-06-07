// OpenAPI 3.0 Specification for SubastApp

export const apiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SubastApp API",
    description: `
# API REST de SubastApp

Sistema completo de subastas en tiempo real. Esta API permite gestionar usuarios, subastas, pujas, articulos y pagos.

## Autenticacion

La API utiliza JWT (JSON Web Tokens) para autenticacion. Incluye el token en el header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Categorias de Usuario

- **Comun**: Acceso basico a subastas publicas
- **Especial**: Acceso a subastas especiales
- **Plata**: Beneficios adicionales, limite de pujas aumentado
- **Oro**: Acceso a cheques certificados, subastas exclusivas
- **Platino**: Acceso completo, sin limites

## WebSocket - Tiempo Real

Para pujas en tiempo real, conectar a:
\`\`\`
wss://api.subastapp.com/ws/auction/{auctionId}
\`\`\`
    `,
    version: "1.0.0",
    contact: {
      name: "SubastApp Support",
      email: "api@subastapp.com"
    }
  },
  servers: [
    {
      url: "https://api.subastapp.com/v1",
      description: "Produccion"
    },
    {
      url: "https://staging-api.subastapp.com/v1",
      description: "Staging"
    }
  ],
  tags: [
    { name: "Auth", description: "Autenticacion y registro de usuarios" },
    { name: "Users", description: "Gestion de perfil de usuario" },
    { name: "Categories", description: "Categorias de usuario" },
    { name: "Payment Methods", description: "Medios de pago" },
    { name: "Auctions", description: "Gestion de subastas" },
    { name: "Items", description: "Articulos/Piezas" },
    { name: "Bids", description: "Pujas" },
    { name: "Sell Requests", description: "Solicitudes de venta" },
    { name: "My Items", description: "Articulos del usuario" },
    { name: "Favorites", description: "Favoritos" },
    { name: "Notifications", description: "Notificaciones" },
    { name: "Metrics", description: "Metricas de usuario" },
    { name: "Payments", description: "Pagos y facturacion" },
    { name: "WebSocket", description: "Eventos en tiempo real" }
  ],
  paths: {
    // AUTH
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesion",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "usuario@email.com" },
                  password: { type: "string", format: "password", example: "Password123!" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Login exitoso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                    expiresIn: { type: "integer", example: 3600 },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          401: { description: "Credenciales invalidas" }
        }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registro inicial de usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "lastName", "email", "address", "country"],
                properties: {
                  firstName: { type: "string", example: "Carlos" },
                  lastName: { type: "string", example: "Rodriguez" },
                  email: { type: "string", format: "email" },
                  address: { type: "string", example: "Av. Corrientes 1234" },
                  country: { type: "string", example: "Argentina" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Registro iniciado, pendiente documentacion",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: { type: "string" },
                    status: { type: "string", enum: ["pending_documents"] },
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/register/document": {
      post: {
        tags: ["Auth"],
        summary: "Subir documento de identidad",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["userId", "documentFront", "documentBack"],
                properties: {
                  userId: { type: "string" },
                  documentFront: { type: "string", format: "binary" },
                  documentBack: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Documentos recibidos, en revision",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["pending_verification"] },
                    estimatedTime: { type: "string", example: "24-48 horas" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/register/complete": {
      post: {
        tags: ["Auth"],
        summary: "Completar registro con contrasena",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "password", "confirmPassword"],
                properties: {
                  userId: { type: "string" },
                  password: { type: "string", format: "password", minLength: 8 },
                  confirmPassword: { type: "string", format: "password" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Registro completado exitosamente" }
        }
      }
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Solicitar recuperacion de contrasena",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Email de recuperacion enviado" }
        }
      }
    },
    "/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Renovar token de acceso",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Token renovado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string" },
                    expiresIn: { type: "integer" }
                  }
                }
              }
            }
          }
        }
      }
    },

    // USERS
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Obtener perfil del usuario actual",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Perfil del usuario",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          }
        }
      },
      put: {
        tags: ["Users"],
        summary: "Actualizar perfil del usuario",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  address: { type: "string" },
                  phone: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Perfil actualizado" }
        }
      }
    },
    "/users/me/metrics": {
      get: {
        tags: ["Users"],
        summary: "Obtener metricas del usuario",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Metricas del usuario",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserMetrics" }
              }
            }
          }
        }
      }
    },
    "/users/me/category": {
      get: {
        tags: ["Users"],
        summary: "Obtener categoria actual del usuario",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Categoria del usuario",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    category: { $ref: "#/components/schemas/UserCategory" },
                    nextCategory: { $ref: "#/components/schemas/UserCategory" },
                    progress: { type: "number", example: 75 }
                  }
                }
              }
            }
          }
        }
      }
    },

    // CATEGORIES
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "Listar categorias de usuario disponibles",
        responses: {
          200: {
            description: "Lista de categorias",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Category" }
                }
              }
            }
          }
        }
      }
    },
    "/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Detalle de una categoria",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Detalle de categoria",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Category" }
              }
            }
          }
        }
      }
    },

    // PAYMENT METHODS
    "/payment-methods": {
      get: {
        tags: ["Payment Methods"],
        summary: "Listar medios de pago del usuario",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de medios de pago",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/PaymentMethod" }
                }
              }
            }
          }
        }
      }
    },
    "/payment-methods/bank-account": {
      post: {
        tags: ["Payment Methods"],
        summary: "Registrar cuenta bancaria",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bankName", "accountNumber", "accountType", "holderName"],
                properties: {
                  bankName: { type: "string", example: "Banco Nacion" },
                  accountNumber: { type: "string" },
                  accountType: { type: "string", enum: ["checking", "savings"] },
                  holderName: { type: "string" },
                  cbu: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Cuenta bancaria registrada, pendiente verificacion" }
        }
      }
    },
    "/payment-methods/credit-card": {
      post: {
        tags: ["Payment Methods"],
        summary: "Registrar tarjeta de credito",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cardNumber", "expiryMonth", "expiryYear", "cvv", "holderName"],
                properties: {
                  cardNumber: { type: "string" },
                  expiryMonth: { type: "integer", minimum: 1, maximum: 12 },
                  expiryYear: { type: "integer" },
                  cvv: { type: "string" },
                  holderName: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Tarjeta registrada exitosamente" }
        }
      }
    },
    "/payment-methods/certified-check": {
      post: {
        tags: ["Payment Methods"],
        summary: "Registrar cheque certificado (Solo Oro/Platino)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bankName", "checkNumber", "amount"],
                properties: {
                  bankName: { type: "string" },
                  checkNumber: { type: "string" },
                  amount: { type: "number" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Cheque certificado registrado" },
          403: { description: "Solo usuarios Oro/Platino" }
        }
      }
    },
    "/payment-methods/{id}": {
      delete: {
        tags: ["Payment Methods"],
        summary: "Eliminar medio de pago",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          204: { description: "Medio de pago eliminado" }
        }
      }
    },
    "/payment-methods/{id}/status": {
      get: {
        tags: ["Payment Methods"],
        summary: "Obtener estado de verificacion",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Estado de verificacion",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["pending", "verified", "rejected"] },
                    verifiedAt: { type: "string", format: "date-time" },
                    rejectionReason: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    // AUCTIONS
    "/auctions": {
      get: {
        tags: ["Auctions"],
        summary: "Listar subastas",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["upcoming", "live", "ended"] } },
          { name: "category", in: "query", schema: { $ref: "#/components/schemas/UserCategory" } },
          { name: "currency", in: "query", schema: { type: "string", enum: ["USD", "EUR", "ARS"] } },
          { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: {
            description: "Lista de subastas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Auction" } },
                    pagination: { $ref: "#/components/schemas/Pagination" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auctions/active": {
      get: {
        tags: ["Auctions"],
        summary: "Obtener subastas en vivo",
        responses: {
          200: {
            description: "Subastas activas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Auction" }
                }
              }
            }
          }
        }
      }
    },
    "/auctions/upcoming": {
      get: {
        tags: ["Auctions"],
        summary: "Obtener proximas subastas",
        responses: {
          200: {
            description: "Proximas subastas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Auction" }
                }
              }
            }
          }
        }
      }
    },
    "/auctions/{id}": {
      get: {
        tags: ["Auctions"],
        summary: "Detalle de subasta",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Detalle de subasta",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuctionDetail" }
              }
            }
          }
        }
      }
    },
    "/auctions/{id}/catalog": {
      get: {
        tags: ["Auctions"],
        summary: "Catalogo de la subasta",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Catalogo de articulos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Item" }
                }
              }
            }
          }
        }
      }
    },
    "/auctions/{id}/join": {
      post: {
        tags: ["Auctions"],
        summary: "Unirse a una subasta",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Usuario unido a la subasta",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sessionId: { type: "string" },
                    wsUrl: { type: "string", example: "wss://api.subastapp.com/ws/auction/auc_001" }
                  }
                }
              }
            }
          },
          403: { description: "Usuario no tiene acceso a esta categoria" }
        }
      }
    },
    "/auctions/{id}/stream": {
      get: {
        tags: ["Auctions"],
        summary: "Obtener URL de streaming",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "URL de streaming",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    streamUrl: { type: "string" },
                    expiresAt: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    },

    // ITEMS
    "/items": {
      get: {
        tags: ["Items"],
        summary: "Listar articulos",
        parameters: [
          { name: "auctionId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "live", "sold", "unsold"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: {
            description: "Lista de articulos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Item" } },
                    pagination: { $ref: "#/components/schemas/Pagination" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/items/{id}": {
      get: {
        tags: ["Items"],
        summary: "Detalle de articulo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Detalle del articulo (incluye precio base solo para usuarios registrados)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ItemDetail" }
              }
            }
          }
        }
      }
    },
    "/items/{id}/images": {
      get: {
        tags: ["Items"],
        summary: "Galeria de imagenes del articulo",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Lista de imagenes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                      thumbnail: { type: "string" },
                      order: { type: "integer" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/items/{id}/history": {
      get: {
        tags: ["Items"],
        summary: "Historial de propietarios",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Historial del articulo",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      owner: { type: "string" },
                      fromDate: { type: "string", format: "date" },
                      toDate: { type: "string", format: "date" },
                      event: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // BIDS
    "/bids": {
      post: {
        tags: ["Bids"],
        summary: "Realizar una puja",
        description: `
**Reglas de puja:**
- Monto minimo: 1% sobre la oferta actual
- Monto maximo: 20% sobre el precio base
- Usuario debe tener al menos un medio de pago verificado
        `,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["auctionId", "itemId", "amount"],
                properties: {
                  auctionId: { type: "string" },
                  itemId: { type: "string" },
                  amount: { type: "number", example: 7500 }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Puja registrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Bid" }
              }
            }
          },
          400: { description: "Monto fuera del rango permitido" },
          403: { description: "Usuario sin medio de pago verificado" }
        }
      }
    },
    "/bids/auction/{auctionId}": {
      get: {
        tags: ["Bids"],
        summary: "Pujas de una subasta",
        parameters: [
          { name: "auctionId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Lista de pujas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Bid" }
                }
              }
            }
          }
        }
      }
    },
    "/bids/auction/{auctionId}/item/{itemId}/current": {
      get: {
        tags: ["Bids"],
        summary: "Puja actual de un articulo",
        parameters: [
          { name: "auctionId", in: "path", required: true, schema: { type: "string" } },
          { name: "itemId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Puja actual",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Bid" }
              }
            }
          }
        }
      }
    },
    "/bids/my": {
      get: {
        tags: ["Bids"],
        summary: "Mis pujas",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["accepted", "outbid", "won"] } }
        ],
        responses: {
          200: {
            description: "Lista de mis pujas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Bid" }
                }
              }
            }
          }
        }
      }
    },
    "/bids/my/won": {
      get: {
        tags: ["Bids"],
        summary: "Pujas ganadas",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de pujas ganadas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Bid" }
                }
              }
            }
          }
        }
      }
    },

    // SELL REQUESTS
    "/sell/request": {
      post: {
        tags: ["Sell Requests"],
        summary: "Solicitar venta de un articulo",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "description", "images", "ownershipDeclaration"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  artistName: { type: "string" },
                  year: { type: "integer" },
                  images: { type: "array", items: { type: "string", format: "binary" }, minItems: 6 },
                  ownershipDeclaration: { type: "boolean" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Solicitud creada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellRequest" }
              }
            }
          }
        }
      }
    },
    "/sell/my-requests": {
      get: {
        tags: ["Sell Requests"],
        summary: "Mis solicitudes de venta",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de solicitudes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SellRequest" }
                }
              }
            }
          }
        }
      }
    },
    "/sell/my-requests/{id}": {
      get: {
        tags: ["Sell Requests"],
        summary: "Detalle de solicitud",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Detalle de la solicitud",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellRequestDetail" }
              }
            }
          }
        }
      }
    },
    "/sell/my-requests/{id}/accept": {
      put: {
        tags: ["Sell Requests"],
        summary: "Aceptar condiciones de venta",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  acceptTerms: { type: "boolean" },
                  suggestedBasePrice: { type: "number" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Condiciones aceptadas" }
        }
      }
    },

    // MY ITEMS
    "/my-items": {
      get: {
        tags: ["My Items"],
        summary: "Mis articulos",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "in_auction", "sold", "rejected"] } }
        ],
        responses: {
          200: {
            description: "Lista de mis articulos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/MyItem" }
                }
              }
            }
          }
        }
      }
    },
    "/my-items/{id}": {
      get: {
        tags: ["My Items"],
        summary: "Detalle de mi articulo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Detalle del articulo",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MyItemDetail" }
              }
            }
          }
        }
      }
    },
    "/my-items/{id}/location": {
      get: {
        tags: ["My Items"],
        summary: "Ubicacion en deposito",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Ubicacion del articulo",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    warehouse: { type: "string" },
                    section: { type: "string" },
                    shelf: { type: "string" },
                    receivedAt: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/my-items/{id}/insurance": {
      get: {
        tags: ["My Items"],
        summary: "Poliza de seguro",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Informacion de la poliza",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    policyNumber: { type: "string" },
                    insurer: { type: "string" },
                    coverage: { type: "number" },
                    validFrom: { type: "string", format: "date" },
                    validTo: { type: "string", format: "date" }
                  }
                }
              }
            }
          }
        }
      }
    },

    // FAVORITES
    "/favorites": {
      get: {
        tags: ["Favorites"],
        summary: "Mis favoritos",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de favoritos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Item" }
                }
              }
            }
          }
        }
      }
    },
    "/favorites/{itemId}": {
      post: {
        tags: ["Favorites"],
        summary: "Agregar a favoritos",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "itemId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          201: { description: "Agregado a favoritos" }
        }
      },
      delete: {
        tags: ["Favorites"],
        summary: "Quitar de favoritos",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "itemId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          204: { description: "Eliminado de favoritos" }
        }
      }
    },

    // NOTIFICATIONS
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Listar notificaciones",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "read", in: "query", schema: { type: "boolean" } }
        ],
        responses: {
          200: {
            description: "Lista de notificaciones",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Notification" }
                }
              }
            }
          }
        }
      }
    },
    "/notifications/{id}/read": {
      put: {
        tags: ["Notifications"],
        summary: "Marcar notificacion como leida",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Notificacion marcada como leida" }
        }
      }
    },
    "/notifications/settings": {
      get: {
        tags: ["Notifications"],
        summary: "Configuracion de notificaciones",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Configuracion actual",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotificationSettings" }
              }
            }
          }
        }
      },
      put: {
        tags: ["Notifications"],
        summary: "Actualizar configuracion",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationSettings" }
            }
          }
        },
        responses: {
          200: { description: "Configuracion actualizada" }
        }
      }
    },

    // METRICS
    "/metrics/user/{userId}": {
      get: {
        tags: ["Metrics"],
        summary: "Metricas de un usuario",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Metricas del usuario",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserMetrics" }
              }
            }
          }
        }
      }
    },
    "/metrics/user/{userId}/auctions": {
      get: {
        tags: ["Metrics"],
        summary: "Participacion en subastas",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
          { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "toDate", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: {
          200: {
            description: "Historial de participacion",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      auctionId: { type: "string" },
                      auctionTitle: { type: "string" },
                      participatedAt: { type: "string", format: "date-time" },
                      bidsPlaced: { type: "integer" },
                      itemsWon: { type: "integer" },
                      totalSpent: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // PAYMENTS
    "/payments/pending": {
      get: {
        tags: ["Payments"],
        summary: "Pagos pendientes",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de pagos pendientes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Payment" }
                }
              }
            }
          }
        }
      }
    },
    "/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Detalle de pago",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Detalle del pago",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentDetail" }
              }
            }
          }
        }
      }
    },
    "/payments/{id}/pay": {
      post: {
        tags: ["Payments"],
        summary: "Realizar pago",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["paymentMethodId"],
                properties: {
                  paymentMethodId: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Pago procesado exitosamente" }
        }
      }
    },
    "/payments/invoices": {
      get: {
        tags: ["Payments"],
        summary: "Mis facturas",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de facturas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Invoice" }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      UserCategory: {
        type: "string",
        enum: ["comun", "especial", "plata", "oro", "platino"],
        description: "Categoria del usuario que determina acceso a subastas"
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
          address: { type: "string" },
          country: { type: "string" },
          category: { $ref: "#/components/schemas/UserCategory" },
          verified: { type: "boolean" },
          documentVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      UserMetrics: {
        type: "object",
        properties: {
          totalAuctions: { type: "integer" },
          wonAuctions: { type: "integer" },
          totalBids: { type: "integer" },
          totalSpent: { type: "number" },
          rating: { type: "number" },
          successRate: { type: "number" }
        }
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          benefits: { type: "array", items: { type: "string" } },
          requirements: { type: "string" }
        }
      },
      PaymentMethod: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["credit_card", "bank_account", "certified_check"] },
          name: { type: "string" },
          lastFour: { type: "string" },
          bank: { type: "string" },
          verified: { type: "boolean" },
          expiryDate: { type: "string" }
        }
      },
      Auction: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          category: { $ref: "#/components/schemas/UserCategory" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["upcoming", "live", "ended"] },
          currency: { type: "string", enum: ["USD", "EUR", "ARS"] },
          itemCount: { type: "integer" },
          thumbnail: { type: "string" }
        }
      },
      AuctionDetail: {
        allOf: [
          { $ref: "#/components/schemas/Auction" },
          {
            type: "object",
            properties: {
              auctioneer: { type: "string" },
              currentItem: { type: "integer" },
              streamUrl: { type: "string" },
              viewerCount: { type: "integer" }
            }
          }
        ]
      },
      Item: {
        type: "object",
        properties: {
          id: { type: "string" },
          auctionId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          basePrice: { type: "number" },
          currentBid: { type: "number" },
          thumbnailUrl: { type: "string" },
          status: { type: "string", enum: ["pending", "live", "sold", "unsold"] }
        }
      },
      ItemDetail: {
        allOf: [
          { $ref: "#/components/schemas/Item" },
          {
            type: "object",
            properties: {
              images: { type: "array", items: { type: "string" } },
              artist: { type: "string" },
              year: { type: "integer" },
              owner: { type: "string" },
              history: { type: "string" },
              winner: { type: "string" }
            }
          }
        ]
      },
      Bid: {
        type: "object",
        properties: {
          id: { type: "string" },
          itemId: { type: "string" },
          userId: { type: "string" },
          userName: { type: "string" },
          amount: { type: "number" },
          timestamp: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["pending", "accepted", "rejected", "outbid"] }
        }
      },
      SellRequest: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          status: { type: "string", enum: ["pending", "under_review", "accepted", "rejected"] },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      SellRequestDetail: {
        allOf: [
          { $ref: "#/components/schemas/SellRequest" },
          {
            type: "object",
            properties: {
              description: { type: "string" },
              images: { type: "array", items: { type: "string" } },
              suggestedPrice: { type: "number" },
              commission: { type: "number" },
              reviewNotes: { type: "string" }
            }
          }
        ]
      },
      MyItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          status: { type: "string", enum: ["pending", "in_auction", "sold", "rejected"] },
          thumbnailUrl: { type: "string" }
        }
      },
      MyItemDetail: {
        allOf: [
          { $ref: "#/components/schemas/MyItem" },
          {
            type: "object",
            properties: {
              auctionId: { type: "string" },
              soldPrice: { type: "number" },
              commission: { type: "number" },
              netAmount: { type: "number" },
              location: { type: "string" },
              insurancePolicy: { type: "string" }
            }
          }
        ]
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["bid", "auction", "payment", "system"] },
          title: { type: "string" },
          message: { type: "string" },
          read: { type: "boolean" },
          timestamp: { type: "string", format: "date-time" }
        }
      },
      NotificationSettings: {
        type: "object",
        properties: {
          email: { type: "boolean" },
          push: { type: "boolean" },
          bidOutbid: { type: "boolean" },
          auctionReminders: { type: "boolean" },
          paymentReminders: { type: "boolean" }
        }
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string" },
          itemId: { type: "string" },
          itemTitle: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string" },
          status: { type: "string", enum: ["pending", "paid", "overdue"] },
          dueDate: { type: "string", format: "date" }
        }
      },
      PaymentDetail: {
        allOf: [
          { $ref: "#/components/schemas/Payment" },
          {
            type: "object",
            properties: {
              breakdown: {
                type: "object",
                properties: {
                  hammerPrice: { type: "number" },
                  buyersPremium: { type: "number" },
                  taxes: { type: "number" },
                  total: { type: "number" }
                }
              }
            }
          }
        ]
      },
      Invoice: {
        type: "object",
        properties: {
          id: { type: "string" },
          number: { type: "string" },
          date: { type: "string", format: "date" },
          amount: { type: "number" },
          pdfUrl: { type: "string" }
        }
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          totalItems: { type: "integer" },
          totalPages: { type: "integer" }
        }
      },
      WebSocketEvent: {
        type: "object",
        description: "Eventos WebSocket para tiempo real",
        properties: {
          event: {
            type: "string",
            enum: ["bid_placed", "bid_accepted", "item_sold", "auction_ended", "item_changed"]
          },
          data: { type: "object" },
          timestamp: { type: "string", format: "date-time" }
        }
      }
    }
  }
}
