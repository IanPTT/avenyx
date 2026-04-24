# Avenyx VPN Platform

A production-ready SaaS VPN platform with custom Android app powered by Marzban (Xray).

## Features

- **JWT Authentication** - Secure login/register system
- **Plan Management** - Multiple subscription plans
- **Manual Payment** - Admin-approved payment system
- **Node Management** - Multi-location VPN nodes
- **Automatic Config** - One-tap VPN connection
- **Android App** - Custom V2RayNG fork

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL

### 1. Clone and Setup

```bash
cd avenyx
cp api/.env.example api/.env
```

### 2. Configure Environment

Edit `api/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/avenyx"
JWT_SECRET="your-secret-key"
RESEND_API_KEY="re_xxx"
FRONTEND_URL="https://avenyx.qzz.io"
ADMIN_URL="https://admin.avenyx.qzz.io"
```

### 3. Start Docker

```bash
cd docker
docker-compose up -d
```

### 4. Access

- Customer App: http://localhost:3001
- Admin Panel: http://localhost:3002
- API: http://localhost:3000

## Default Admin

Create admin user via API:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@avenyx.com","password":"admin123","name":"Admin"}'
```

Then update role to ADMIN in database.

## Marzban Nodes

Add nodes via Admin panel:
1. Login as admin
2. Go to Nodes
3. Add node with:
   - API URL (Marzban panel URL)
   - API Key
   - Inbound ID
   - Location (India/Germany)

## Plans

Create plans via Admin panel:
- Basic, Standard, Premium plans
- Set price, duration, device limits
- Enable/disable plans

## Android APK

Build APK:
```bash
cd android
./gradlew assembleRelease
```

Upload to `storage/apk/latest.apk`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|------------|
| /auth/login | POST | Login |
| /auth/register | POST | Register |
| /plans | GET | List plans |
| /subscriptions/me | GET | My subscription |
| /vpn/config | GET | VPN config |
| /vpn/connect | POST | Connect VPN |
| /payments | GET/POST | Payments |
| /admin/users | GET | All users |
| /nodes | GET | List nodes |

## Docker Services

- **api** - Backend API (port 3000)
- **db** - PostgreSQL (port 5432)
- **frontend** - Customer frontend (port 3001)
- **admin** - Admin panel (port 3002)

## License

MIT