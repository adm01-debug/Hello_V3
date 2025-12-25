# Environment Setup

## Required Tools
- Node.js 18.x LTS
- npm 9.x or pnpm 8.x
- Git 2.x
- VS Code or similar

## Optional Tools
- Docker Desktop
- Postman or Insomnia
- PostgreSQL client

## Setup Steps

### 1. Clone Repository
```bash
git clone https://github.com/adm01-debug/hello.git
cd hello
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your settings:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- Other API keys

### 4. Start Development Server
```bash
npm run dev
```

## VS Code Extensions
- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense

## Troubleshooting
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm run clean`
