# MaMenu

A full-stack restaurant management platform with digital menu, QR-based table ordering, and real-time order tracking. Built with a Go backend and Next.js frontend, MaMenu enables multi-hotel operations with role-based access, WebSocket-powered live updates, and a public-facing digital menu for customers.

---

## Features

- **Multi-Role Authentication** - Super Admin and Hotel Admin roles with JWT-based auth
- **Multi-Hotel Support** - Single owner can manage multiple hotels and switch between them
- **Digital Menu Management** - Hierarchical categories, veg/non-veg tags, pricing, availability toggling
- **QR Code Table System** - Auto-generated QR codes per table linking to the public digital menu
- **Real-Time Order Tracking** - WebSocket-powered live order status updates for both admins and customers
- **Public Ordering** - Customers scan a QR code, browse the menu, and place orders without logging in
- **Order Workflow** - Full lifecycle: Pending > Confirmed > Preparing > Ready > Completed / Cancelled
- **Table Management** - Bulk creation, capacity tracking, occupied/vacant status
- **Soft Deletes** - Resources are deactivated rather than permanently deleted

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Go 1.25, Gin, Gorilla WebSocket |
| **Database** | MongoDB |
| **Auth** | JWT (HMAC-SHA256) + bcrypt |
| **Real-Time** | WebSocket |
| **QR Generation** | qrcode (npm) |
| **Icons** | Lucide React |
| **Logging** | Zap (structured logging) |
| **Containerization** | Docker (multi-stage build) |

---

## Project Structure

```
ma-menu/
├── MaMenu_FE/                       # Next.js Frontend
│   ├── app/
│   │   ├── login/                   # Login page
│   │   ├── admin/                   # Super admin dashboard
│   │   │   ├── hotel-owners/        # Manage hotel owners
│   │   │   └── hotels/              # Manage hotels
│   │   ├── hotel/                   # Hotel admin dashboard
│   │   │   └── [hotel_id]/
│   │   │       ├── menu/            # Menu items CRUD
│   │   │       ├── tables/          # Table management + QR codes
│   │   │       ├── categories/      # Category management
│   │   │       └── orders/          # Order management
│   │   └── menu/[hotel_id]/         # Public menu (customer-facing)
│   ├── components/                  # Shared UI components
│   ├── lib/
│   │   ├── api.ts                   # API client
│   │   └── auth.ts                  # JWT token management
│   └── types/                       # TypeScript interfaces
│
└── MaMenu_BE/                       # Go Backend
    ├── cmd/server/main.go           # Entry point
    ├── models/                      # MongoDB data models
    ├── components/
    │   ├── middleware/auth.go        # JWT auth middleware
    │   ├── router/                  # Route definitions
    │   └── services/                # Business logic
    │       ├── auth/
    │       ├── admin/
    │       └── hotelowner/
    ├── pkg/
    │   ├── storage/
    │   │   ├── mongodb/             # MongoDB connection
    │   │   └── database/            # Database operations
    │   ├── ws/                      # WebSocket hub
    │   ├── logger/                  # Structured logging
    │   └── utils/
    ├── config/config.go             # Config loader
    └── Dockerfile
```

---

## Getting Started

### Prerequisites

- Go 1.25+
- Node.js 18+
- npm
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd MaMenu_BE

# Install dependencies
go mod tidy

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Run the server
go run cmd/server/main.go
```

Backend runs on `http://localhost:8080`

### Frontend Setup

```bash
cd MaMenu_FE

# Install dependencies
npm install

# Configure environment
# Create .env.local with:
# BACKEND_URL=http://localhost:8080
# NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Run the dev server
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## Environment Variables

### Backend `.env`

```env
PORT=8080

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority
MONGO_MAX_POOL_SIZE=50
MONGO_CONNECT_TIMEOUT=10
MONGO_MAX_IDLE_TIME=30

# Auth
JWT_SECRET=your_strong_secret_here

# Logging
LOG_ENABLED=true
APP_LOG_FILE=logs/app.log
AUDIT_LOG_FILE=logs/audit.log
APP_LOG_LEVEL=2
AUDIT_LOG_LEVEL=3
```

### Frontend `.env.local`

```env
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login with email/phone + password |

### Public (No Auth)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/public/menu/:hotel_id` | Get hotel menu, categories, and tables |
| POST | `/api/v1/public/orders/:hotel_id` | Place an order |

### WebSocket
| Endpoint | Description |
|---|---|
| `/api/v1/ws/hotel/:hotel_id?token=<jwt>` | Hotel admin - receive real-time order updates |
| `/api/v1/ws/order/:order_id` | Customer - track order status |

### Super Admin (Protected)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/admin/hotel-owners` | Create hotel owner |
| GET | `/api/v1/admin/hotel-owners` | List hotel owners |
| PUT | `/api/v1/admin/hotel-owners/:id` | Update hotel owner |
| DELETE | `/api/v1/admin/hotel-owners/:id` | Deactivate hotel owner |
| POST | `/api/v1/admin/hotels` | Create hotel |
| GET | `/api/v1/admin/hotels` | List hotels |
| PUT | `/api/v1/admin/hotels/:id` | Update hotel |
| DELETE | `/api/v1/admin/hotels/:id` | Deactivate hotel |

### Hotel Admin (Protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/hotel/profile` | Get profile and active hotel |
| PUT | `/api/v1/hotel/switch` | Switch active hotel |
| GET | `/api/v1/hotel/my-hotels` | List owned hotels |
| POST | `/api/v1/hotel/tables` | Create table |
| POST | `/api/v1/hotel/tables/bulk` | Bulk create tables |
| GET | `/api/v1/hotel/tables` | List tables |
| PUT | `/api/v1/hotel/tables/:id` | Update table |
| DELETE | `/api/v1/hotel/tables/:id` | Deactivate table |
| PUT | `/api/v1/hotel/tables/:id/status` | Set occupied status |
| POST | `/api/v1/hotel/categories` | Create category |
| GET | `/api/v1/hotel/categories` | Get category tree |
| PUT | `/api/v1/hotel/categories/:id` | Update category |
| DELETE | `/api/v1/hotel/categories/:id` | Deactivate category |
| POST | `/api/v1/hotel/menu` | Create menu item |
| GET | `/api/v1/hotel/menu` | List menu items |
| PUT | `/api/v1/hotel/menu/:id` | Update menu item |
| DELETE | `/api/v1/hotel/menu/:id` | Deactivate menu item |
| PUT | `/api/v1/hotel/menu/:id/availability` | Toggle availability |
| GET | `/api/v1/hotel/orders` | List orders |
| PUT | `/api/v1/hotel/orders/:id/status` | Update order status |

---

## Docker

### Build and run the backend

```bash
cd MaMenu_BE
docker build -t mamenu-backend .
docker run -p 8080:8080 --env-file .env mamenu-backend
```

---

## How It Works

1. **Super Admin** creates hotel owners and assigns hotels to them
2. **Hotel Admin** logs in, sets up tables, categories, and menu items
3. **QR codes** are generated for each table - printed and placed on physical tables
4. **Customers** scan the QR code, browse the digital menu, and place orders
5. **Hotel Admin** receives orders in real-time via WebSocket and updates order status
6. **Customers** can track their order status live

---

## Roadmap

- [ ] Redis caching layer
- [ ] Image upload for menu items
- [ ] Analytics dashboard
- [ ] Payment gateway integration
- [ ] Push notifications
- [ ] Docker Compose for full-stack deployment
- [ ] CI/CD pipeline

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Author

**Sirisolla Jaya Surya**

Backend Engineer | Go, Kafka, Microservices | Passionate about scalable systems and distributed architecture
