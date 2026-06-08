# Sistema de Subastas – SubastAr

En esta primera entrega presentamos el desarrollo conceptual y visual de SubastAr, una aplicación móvil orientada a la participación en subastas en tiempo real. El objetivo del proyecto es ofrecer una plataforma intuitiva que permita a los usuarios explorar subastas, realizar ofertas, gestionar sus métodos de pago y recibir notificaciones relevantes dentro de un mismo ecosistema digital.

A nivel funcional, la aplicación contempla un flujo completo de usuario que inicia con el proceso de registro, el cual incluye la carga de datos personales, verificación de identidad y configuración de credenciales. Este proceso se diseñó de manera progresiva en múltiples pasos con el fin de mejorar la experiencia del usuario y reducir la fricción inicial.

Una vez dentro del sistema, el usuario accede a una pantalla principal donde puede visualizar distintas categorías, subastas activas y próximas, así como también sus favoritos. Se prioriza la visibilidad de las subastas en curso para incentivar la participación en tiempo real. A su vez, se incluye un catálogo que permite explorar todas las subastas disponibles mediante búsqueda y filtrado.

Cada subasta cuenta con una pantalla de detalle en la cual se presenta información relevante como descripción del producto, estado del artículo, precio actual, cantidad de ofertas y tiempo restante. Desde esta vista, el usuario puede realizar pujas de manera directa, utilizando incrementos predefinidos o ingresando un valor personalizado.

En cuanto a funcionalidades complementarias, el sistema incluye:

- Gestión de métodos de pago
- Perfil de usuario con métricas (participaciones, subastas ganadas, efectividad)
- Sistema de notificaciones en tiempo real

La arquitectura técnica del sistema se apoya en Swagger para la gestión de sus endpoints. A través de esta herramienta, definimos y documentamos la interfaz de la API, permitiendo una validación eficiente de los flujos de datos, desde el registro de usuarios hasta la actualización de pujas en tiempo real.

En esta etapa inicial, el enfoque estuvo puesto en la definición del flujo de usuario, la estructura de navegación y la experiencia de uso, sentando las bases para futuras iteraciones donde se profundizará en la implementación técnica y optimización del sistema.

## Documentación API (Swagger)

La API cubre los siguientes módulos: autenticación y registro de usuarios, gestión de perfil y categorías, medios de pago, subastas e ítems, pujas en tiempo real, solicitudes de venta, notificaciones, métricas y pagos. Todos los endpoints protegidos utilizan JWT y se documentan con sus request/response bodies, códigos de respuesta y esquemas de datos.

Para visualizarla localmente, requiere tener [Docker](https://www.docker.com/get-started) instalado y corriendo.

```bash
./start-swagger.sh
```

Una vez iniciado, abrir en el navegador: [http://localhost:8080](http://localhost:8080)

## Testing de la API

El script `test-all.sh` (en la raíz del proyecto) recorre todos los endpoints del backend de forma automatizada y reporta cuántos pasan y cuántos fallan.

### Requisitos previos

- El backend debe estar corriendo (`npm run dev` dentro de `backend/`).
- Tener instalado [`jq`](https://jqlang.github.io/jq/) para parsear respuestas JSON.
- `psql` en el PATH (solo necesario con `--reset`).

### Uso

**Opción A — primera vez o para resetear la base de datos:**

```bash
./test-all.sh --reset
```

Hace `DROP SCHEMA public CASCADE`, recrea las tablas, corre el seed de admin y carga datos de prueba antes de ejecutar los tests.

**Opción B — base de datos ya inicializada:**

```bash
./test-all.sh
```

Asume que ya existen las tablas y datos base. Recomendado para correr los tests repetidamente sin limpiar la DB.

### Qué hace el script

Ejecuta 15 fases en orden: registro de usuario, completado de perfil, login, gestión de subastas, pujas, solicitudes de venta, métodos de pago, multas, módulo admin, métricas, favoritos y WebSocket. Al final imprime un resumen con el total de pruebas pasadas y fallidas. El exit code es igual a la cantidad de fallos (0 = todo ok).

### Cargar solo datos de prueba

Si querés insertar los datos de prueba sin correr los tests (martillero demo, dueño demo, subasta abierta, producto e ítem con precio base 10 000):

```bash
cd backend
npm run seed:test
```

## Diseño

**Figma:** [Ver prototipo](https://www.figma.com/design/MilTc5kyxGngKFrA9C6VPs/Untitled?node-id=0-1&p=f&t=lVeUcUocRy4KpKcf-0)
