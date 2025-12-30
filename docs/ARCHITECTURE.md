# Architecture Documentation

## Overview
This project follows Clean Architecture principles with clear separation of concerns.

## Layers

### Domain Layer
- **Entities**: Core business objects (User, Call, Contact)
- **Value Objects**: Immutable objects (Email, UserId)
- **Repositories**: Interfaces for data access

### Application Layer
- **Use Cases**: Business logic orchestration
- **DTOs**: Data transfer objects with validation

### Infrastructure Layer
- **Database**: PostgreSQL repositories
- **Cache**: Redis client
- **Queue**: Bull job manager
- **External Services**: Email, storage, etc.

### Presentation Layer
- **HTTP**: Express controllers and routes
- **Middleware**: Auth, validation, error handling

## Technology Stack
- **Runtime**: Node.js 20+
- **Framework**: Next.js 14
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Bull
- **Testing**: Vitest, Playwright

## Security
- JWT authentication
- RBAC authorization
- Input validation (Zod)
- Security headers (Helmet)
- Rate limiting
- Audit logging
