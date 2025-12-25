# Architecture Overview

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State:** React Context + Hooks
- **Routing:** React Router v6

### Backend
- **Platform:** Supabase
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth (JWT)
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime

### Infrastructure
- **Hosting:** Vercel (Frontend)
- **Database:** Supabase Cloud
- **CDN:** Cloudflare
- **Monitoring:** Sentry + Grafana
- **CI/CD:** GitHub Actions

## Data Flow
1. User interacts with React UI
2. UI calls Supabase client
3. Supabase handles auth, data, storage
4. Real-time updates via WebSocket
5. Edge Functions for serverless compute

## Key Design Decisions
- **ADR-001:** React + TypeScript for type safety
- **ADR-002:** Supabase for managed backend
- **ADR-003:** Vite for fast dev experience

## Security Layers
1. HTTPS/TLS encryption
2. JWT authentication
3. Row Level Security (RLS)
4. API rate limiting
5. Input validation

## Scalability
- Horizontal scaling via Supabase
- CDN for static assets
- Database connection pooling
- Lazy loading and code splitting

For detailed decisions, see [Decision Log](docs/architecture/DECISION_LOG.md)
