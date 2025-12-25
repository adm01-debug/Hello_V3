# Setup Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

## Installation
1. Clone: `git clone https://github.com/adm01-debug/hello.git`
2. Install: `npm install`
3. Environment: Create `.env` with required variables
4. Database: Run migrations with `npm run migrate`
5. Start: `npm run dev`

## Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `JWT_ACCESS_SECRET` - JWT secret for access tokens
- `ENCRYPTION_MASTER_KEY` - Master encryption key
