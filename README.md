# Корпоративный портал сотрудников

Готовый к production портал сотрудников на Next.js 15, React 19, TypeScript, Redux Toolkit, RTK Query, Radix/Shadcn-style UI, React Hook Form, Zod, ESLint, Prettier, Husky, lint-staged, Commitlint, Docker и Docker Compose.

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:3000.

Если в Windows PowerShell заблокировано выполнение скриптов, используйте:

```powershell
npm.cmd run dev
```

## Проверки качества

```bash
npm run typecheck
npm run lint
npm run build
```

## Docker

```bash
copy .env.example .env
docker compose up --build
```
