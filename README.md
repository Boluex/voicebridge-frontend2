# VoiceBridge Frontend

React 19 + Vite 6 + TypeScript + Tailwind CSS v3 + shadcn/ui

## Setup

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
```

## Structure

```
src/
├── App.tsx              ← Root with routing (React Router v6)
├── main.tsx             ← Entry point
├── index.css            ← Tailwind + CSS variables
├── App.css              ← App-specific styles
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── DashboardPage.tsx
├── store/
│   └── authStore.ts     ← Zustand auth state
├── services/
│   └── api.ts           ← Axios API client
├── types/
│   └── index.ts         ← TypeScript interfaces
├── lib/
│   └── utils.ts         ← cn() utility
└── components/
    └── ui/              ← shadcn/ui components
```

## Environment

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=VoiceBridge
```

## Adding shadcn components

```bash
npx shadcn@latest add button card dialog form input label toast
```
