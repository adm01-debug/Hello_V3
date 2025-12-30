# Deployment Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

## Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in all environment variables
3. Run `npm run db:migrate`

## Build
```bash
npm run build
```

## Deploy
```bash
npm run start
```

## Health Checks
- `/api/health` - Application health
- `/api/metrics` - Prometheus metrics
