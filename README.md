# BOVAP – Emailové rozhranie

Emailová aplikácia pre občianske združenie BOVAP (klient: p. Pavol Kalmár).
Nahrádza súčasné posielanie „na kôpku" z troch schránok @centrum.sk: admin sa
prihlási, otvorí šablónu, prepíše nadpis/text, vyberie príjemcov a odošle sám.

- **Produkcia:** mail.bovap.sk (Coolify + VPS)
- **Architektúra:** [docs/ARCHITEKTURA.md](docs/ARCHITEKTURA.md)

## Tech stack

| Vrstva | Voľba |
|---|---|
| Framework | Next.js 16 (App Router, Node runtime, TypeScript) |
| UI | Tailwind CSS v3 + [Sailboat UI](https://sailboatui.com/) (primary = blue, secondary = slate, Inter) |
| DB | PostgreSQL + Prisma v7 (`prisma-client` generátor, `@prisma/adapter-pg`) |
| Auth | vlastná session: httpOnly cookie, HMAC-SHA256 (Web Crypto), bcrypt |
| Odosielanie | Brevo API (fáza 1) |
| Nasadenie | Docker + Coolify, build = `prisma generate && next build` |

## Rýchly štart (dev)

Predpoklady: Node 22+, Docker.

```bash
npm install
# lokálny Postgres (port 15432 – 5432/5433 zaberá supabase stack)
docker run -d --name bovap-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bovap \
  -p 15432:5432 -v bovap-pg-data:/var/lib/postgresql/data postgres:16-alpine

cp .env.example .env   # vyplň DATABASE_URL a SESSION_SECRET
npx prisma migrate dev
npx prisma db seed     # admin + nastavenia + vzorky
npm run dev            # http://localhost:3000
```

**Dev prístup:** `admin@bovap.sk` / `bovap-admin-2026` (po nasadení zmeňte).

## Štruktúra projektu

```
src/
├── app/
│   ├── (app)/               # chránená časť so sidebarom
│   │   ├── page.tsx         # prehľad (štatistiky, posledné kampane)
│   │   ├── kampane/         # zoznam + nová + detail kampane
│   │   ├── odberatelia/     # zoznam + pridanie odoberateľa
│   │   └── nastavenia/      # odosielateľ + pätička
│   ├── login/               # prihlásenie
│   └── odhlasenie/[token]/  # verejné odhlásenie z odberu
├── components/
│   ├── ui/                  # Button, Badge, Card, Input (Sailboat štýl)
│   └── forms/               # client formuláre (useActionState)
├── lib/
│   ├── prisma.ts            # Prisma v7 + adapter (pg)
│   ├── session-token.ts     # HMAC token (Web Crypto, funguje v proxy)
│   ├── session.ts           # server-side session helper
│   ├── actions.ts           # server actions (login, kampane, odoberatelia…)
│   └── utils.ts             # cn(), formátovanie, stavové štítky SK
├── proxy.ts                 # Next 16 proxy (nahradzuje middleware) – auth guard
└── generated/prisma/        # vygenerovaný client (gitignored)
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
docs/ARCHITEKTURA.md         # technické riešenie a architektúra projektu
```

## Stav podľa fáz (z docs/ARCHITEKTURA.md §10)

| Fáza | Obsah | Stav |
|---|---|---|
| 0 | Predfaktúra 50 % | čaká na úhradu |
| 1 | Scaffold, auth, editor + šablóna, testovacie odoslanie | **scaffold + auth hotové**; editor/odosielanie (Brevo) ďalej |
| 2 | Migrácia kontaktov (IMAP z centrum.sk) | pending |
| 3 | Schránky @bovap.sk + DNS + Outlook | pending |
| 4 | Produkcia na mail.bovap.sk | pending |
| 5 | QoL | pending |

## Poznámky / pitfalls

- **Prisma v7:** `prisma-client` generátor vyžaduje `output`; client sa importuje
  z `@/generated/prisma/client` a do `PrismaClient` sa musí odovzdať `adapter`
  (`PrismaPg`). Bez neho TS/build zlyhá.
- **Next.js 16:** namiesto `middleware.ts` je konvencia `proxy.ts`.
- **Tailwind v3 + Sailboat:** konfigurácia v `tailwind.config.ts` (primary/secondary),
  pluginy `@tailwindcss/typography` + `@tailwindcss/forms`.
- Dev Postgres beží na **15432** (5432/5433 obsadené lokálnym supabase stackom).
