# Avenyx - Technical Specification

## Project Overview

Avenyx is a production-ready SaaS VPN platform with custom Android app powered by Marzban (Xray). The platform provides stealth access for restricted networks with automatic configuration handling.

---

## Domain Configuration

- **Customer Frontend**: https://avenyx.qzz.io
- **Admin Panel**: https://admin.avenyx.qzz.io

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend API | Node.js + Fastify |
| Database | PostgreSQL + Prisma ORM |
| Customer Frontend | Next.js 14 + TailwindCSS |
| Admin Frontend | Next.js 14 + TailwindCSS |
| VPN Panel | Marzban (Xray) |
| Android App | Kotlin + Xray Core (V2RayNG fork) |
| Email | Resend |
| Authentication | JWT |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login user |
| POST | /auth/verify-email | Verify email token |
| GET | /auth/me | Get current user |

### Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /plans | List all active plans (public) |
| POST | /plans | Create plan (admin) |
| PUT | /plans/:id | Update plan (admin) |
| DELETE | /plans/:id | Delete plan (admin) |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /subscriptions/me | Get my subscription |
| POST | /subscriptions | Create subscription request |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /payments | List payments (admin) |
| POST | /payments | Create payment request |
| PUT | /payments/:id/approve | Approve payment (admin) |
| PUT | /payments/:id/reject | Reject payment (admin) |

### Nodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /nodes | List nodes |
| POST | /nodes | Add node (admin) |
| PUT | /nodes/:id | Update node (admin) |
| DELETE | /nodes/:id | Delete node (admin) |

### VPN
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /vpn/config | Get VPN config (authenticated) |
| POST | /vpn/connect | Connect (create Marzban user) |
| POST | /vpn/disconnect | Disconnect (delete Marzban user) |

### APK
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /apk/latest | Get latest APK info |
| GET | /apk/download | Download APK file |

### Location
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | /location | Update preferred location |

---

## Environment Variables

### API
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/avenyx
JWT_SECRET=your-jwt-secret
RESEND_API_KEY=re_xxx
FRONTEND_URL=https://avenyx.qzz.io
ADMIN_URL=https://admin.avenyx.qzz.io
APK_STORAGE_PATH=/storage/apk
```

### Frontend
```
NEXT_PUBLIC_API_URL=https://api.avenyx.qzz.io
```

### Admin
```
NEXT_PUBLIC_API_URL=https://api.avenyx.qzz.io
```