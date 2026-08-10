# BOVAP — Technické riešenie a architektúra projektu

> **Klient:** p. Pavol Kalmár (OZ, doména bovap.sk) · **Produkt:** SynthBit/Enroll „Jednoduché emaily pre vaše združenie"
> **Cena:** 390 € jednorazovo + 35 €/mesiac (do 5 000 emailov/mesiac)
> **Stav:** komunikácia potvrdená emailom klienta (10. 8. 2026) — realizácia sa spúšťa po úhrade zálohy 50 %

---

## 0. Východiská z emailovej komunikácie (potvrdené klientom)

| Bod dohody | Stav |
|---|---|
| **Predfaktúra ako záloha 50 %** | ✓ klient súhlasí („v poriadku") |
| **Testovací link** na priebežné sledovanie zmien | ✓ v pláne — staging, pripomienky klienta |
| **Migrácia kontaktov** z aktuálnych emailov | ✓ — klient **nemá adresár**: adresy sa kopírujú priamo do mailu / správy sa preposielajú → kontakty treba **extrahovať z odoslaných správ** |
| **Hosting + emailové schránky + Outlook** | ✓ — web združenia beží na **webnode.sk**; prístupy k hostingu klient pošle („tie vám zašlem") |
| **Produkčné nasadenie na mail.bovap.sk** | ✓ — rozhranie na odosielanie mailov + menežment odoberateľov |
| **QoL úpravy** po produkčnej prevádzke | ✓ v rámci prvotného nastavenia |
| **Súčasné schránky** | **3 × @centrum.sk** — prístupy poskytne klient |

> Realizácia: predfaktúra (50 %) → testovací link → migrácia kontaktov → hosting/schránky/Outlook → produkcia na mail.bovap.sk → QoL.

---

## 1. Cieľ a rozsah

Postaviť pre združenie malú slovenskú emailovú aplikáciu, ktorá nahradí súčasné posielanie
„na kôpku" z troch schránok @centrum.sk. Administrátor OZ sa prihlási, otvorí pripravenú
šablónu, prepíše nadpis/text, prípadne pridá fotku, vyberie príjemcov a email odošle sám —
bez anglického rozhrania a bez posielania textov nám na manuálne odoslanie.

### Čo klient dostane (v skratke)

- **Vlastné emailové schránky @bovap.sk** (2 ks) + návod do Outlooku — náhrada za @centrum.sk.
- **Zoznam odoberateľov** zmigrovaný z doterajších odoslaných emailov (bez duplicít, s odhlásením).
- **Jednoduché rozhranie** (mail.bovap.sk) na odosielanie emailov zo šablóny: nadpis, titulok, text, fotka.
- **Štatistiky** (doručené/otvorené/kliky/odhlásenia) a prehľad o stave odberateľov.
- **Slovenský návod + zaškolenie** a priebežné QoL úpravy v rámci paušálu.

### Dodávka podľa ponuky (kontrolný zoznam)

| Položka | Stav |
|---|---|
| ✓ 2 emailové schránky na doméne bovap.sk | fáza 3 |
| ✓ jedna vlastná emailová šablóna (nadpis + text + fotka) | fáza 1 |
| ✓ nastavenie SPF, DKIM, DMARC v DNS | fáza 3–4 |
| ✓ zoznam kontaktov a odhlásenie z odberu | fáza 2 |
| ✓ krátky návod a zaškolenie v slovenčine | fáza 4 |
| ✓ test doručiteľnosti pred prvým rozoslaním | fáza 4 |

### Fakty z konverzácie s klientom

- **Web:** webnode.sk (meniť nebudeme; maximálne odkaz/embed na odber — QoL).
  Webnode je web builder a **neposkytuje emailové schránky** → schránky @bovap.sk vzniknú
  na hostingu poskytovateľa (pravdepodobne Websupport; presné prístupy klient pošle).
- **Súčasné schránky:** 3 × @centrum.sk — klient poskytne prístup (IMAP).
- **Adresár kontaktov neexistuje** — adresy sa doteraz kopírovali priamo do emailu
  alebo sa správy preposielali. **Kontakty treba získať z odoslaných správ.**
- **Hosting:** klient pošle prístupy („tie vám zašlem") — tam vzniknú 2 schránky @bovap.sk.
- **Produkčná adresa aplikácie:** mail.bovap.sk.

---

## 2. Architektúra riešenia

```
┌───────────────────────────────────────────────────────────────┐
│                 mail.bovap.sk  (VPS + Coolify)                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Next.js 16 aplikácia (App Router, Node runtime, TS)     │ │
│  │  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌───────────┐ │ │
│  │  │ /login   │ │ /kampane  │ │ /odberatelia│ │ /nastavenia│ │ │
│  │  └──────────┘ └───────────┘ └────────────┘ └───────────┘ │ │
│  │        ┌───────────────────┐      ┌───────────────────┐   │ │
│  │        │ API routes (REST) │      │ Sending engine    │   │ │
│  │        └───────────────────┘      │ (dávky + webhooky)│   │ │
│  │        ┌───────────────────┐      └───────────────────┘   │ │
│  │        │ Prisma ORM        │                              │ │
│  │        └───────────────────┘                              │ │
│  └──────────────────────────┬────────────────────────────────┘ │
│              ┌──────────────▼──────────────┐                   │
│              │  PostgreSQL (dáta OZ)       │                   │
│              └─────────────────────────────┘                   │
└──────────────────────────┬─────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌───────────────────────┐
│  Brevo API     │  │  Websupport    │  │  DNS bovap.sk         │
│  (odosielanie, │  │  2 schránky    │  │  SPF · DKIM · DMARC   │
│  webhooky,     │  │  @bovap.sk     │  │  MX → Websupport      │
│  štatistiky)   │  │  (Outlook)     │  │  A/CNAME mail.* → VPS │
└────────────────┘  └────────────────┘  └───────────────────────┘
```

**Tok odoslania kampane:** editor → uloženie draftu → „Odoslať" → vytvorenie záznamov
príjemcov → dávkové odoslanie cez Brevo API (sender: info@bovap.sk, overená doména) →
webhooky Brevo (doručené/otvorené/klik/bounce/sťažnosť) aktualizujú stav odberateľov
a štatistiky kampane.

---

## 3. Technologický stack a odôvodnenie

| Vrstva | Voľba | Prečo |
|---|---|---|
| Framework | **Next.js 16**, App Router, Node runtime | firemný štandard (Enroll, NKV Front, FitJam); jednotný stack pre web aj API |
| Jazyk | TypeScript | typová bezpečnosť, zdieľané typy |
| DB | PostgreSQL + Prisma | štandard naprieč projektmi, migrácie |
| UI | Tailwind CSS, jednoduchý dizajn | slovenské rozhranie, žiadny cudzí systém |
| Auth | vlastná session (credentials, httpOnly cookie, bcrypt) | 1–2 admin účty, nechceme ťažký NextAuth |
| Odosielanie | **Brevo API** (doména bovap.sk overená) | doručiteľnosť, DKIM, bounce management, webhooky; free tier 300/deň pokrýva 5 000/mes; BREVO_API už používame v iných projektoch |
| Queue | jednoduchá job tabuľka + dávky v API route (cron) | 5 000/mes nepotrebuje BullMQ/Redis; YAGNI |
| Migrácia kontaktov | jednorazový skript (Node, IMAP → CSV → import) | klient nemá adresár — extrakcia z odoslaných správ |
| Nasadenie | Coolify na VPS (Docker), Postgres managed | firemná infraštruktúra, HTTPS auto |

> **Prečo nie SMTP z Websupport schránok:** hromadné odosielanie z bežnej schránky končí
> v spame a má limity. Schránky @bovap.sk slúžia ľuďom (Outlook); hromadné správy idú cez
> Brevo, ktoré odosiela v mene overenej domény bovap.sk. To je aj argument z ponuky
> („Prečo nestačí posielať hromadne z bežného emailu").

> **Prečo Next.js a nie hotové riešenie (Mailchimp/Listmonk):** vlastná aplikácia = slovenské
> rozhranie, presne požadované funkcie, žiadne per-email poplatky nad rámec paušálu,
> dáta OZ ostávajú u nás, jednoduché QoL úpravy v Next.js.

---

## 4. Dátový model (Prisma)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  role         String   @default("admin")   // admin (1–2 účty)
  createdAt    DateTime @default(now())
}

model Subscriber {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String?
  status         String   @default("ACTIVE") // ACTIVE | UNSUBSCRIBED | BOUNCED | COMPLAINED
  source         String   @default("IMPORT") // IMPORT | MANUAL | WEB
  unsubscribedAt DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Group {
  id          String               @id @default(cuid())
  name        String               @unique
  subscribers SubscriberGroup[]
}

model SubscriberGroup {
  subscriberId String
  groupId      String
  @@id([subscriberId, groupId])
}

model Campaign {
  id               String   @id @default(cuid())
  name             String
  subject          String   // nadpis (subject)
  title            String   // titulok v tele
  bodyText         String   // text správy
  imageUrl         String?  // fotka (upload/URL)
  status           String   @default("DRAFT") // DRAFT | SENDING | SENT | FAILED
  recipientsTarget Int      @default(0)
  recipientsSent   Int      @default(0)
  statsOpened      Int      @default(0)
  statsClicked     Int      @default(0)
  statsBounced     Int      @default(0)
  statsUnsub       Int      @default(0)
  scheduledAt      DateTime?
  sentAt           DateTime?
  createdAt        DateTime @default(now())
  recipients       CampaignRecipient[]
}

model CampaignRecipient {
  id           String    @id @default(cuid())
  campaignId   String
  subscriberId String
  status       String    @default("PENDING") // PENDING | SENT | DELIVERED | OPENED | CLICKED | BOUNCED | FAILED
  error        String?
  sentAt       DateTime?
  openedAt     DateTime?
  clickedAt    DateTime?
  @@index([campaignId])
}

model Setting {
  key   String @id
  value String
  // senderName, senderEmail, footerText, templateBody, unsubscribeUrl...
}
```

---

## 5. Aplikačné moduly a trasy

| Trasa | Funkcia |
|---|---|
| `/login` | prihlásenie admina (bcrypt + session cookie) |
| `/` (dashboard) | počet odberateľov, posledné kampane, rýchle akcie |
| `/kampane` | zoznam kampaní + stav/štatistiky |
| `/kampane/nova` | editor: nadpis, titulok, text, fotka, výber skupín, **náhľad**, testovací email, odoslanie |
| `/kampane/[id]` | detail: štatistiky, stavy príjemcov |
| `/odberatelia` | zoznam + vyhľadávanie, pridanie, **import (CSV / vložený zoznam / skript z IMAP)**, skupiny |
| `/nastavenia` | sender (meno + info@bovap.sk), pätička, šablóna, heslo |
| `/odhlasenie/[token]` | **verejná** stránka odhlásenia (odkaz v pätičke každého emailu) |

**Šablóna:** jedna responzívna HTML šablóna (vykreslená z DB, `Setting.templateBody`),
ktorá sa pred každým odoslaním naplní: nadpis, titulok, text, fotka, pätička
(sender, odkaz na odhlásenie). Náhľad v editore = to, čo príde do schránky.

**Odhlásenie:** token → `Subscriber.status = UNSUBSCRIBED` + `List-Unsubscribe` hlavička
pri odoslaní (cez Brevo). Súlad s GDPR: zoznam = osobné údaje, odhlásenie sa rešpektuje
okamžite, prípadne výmaz na požiadanie.

---

## 6. Odosielanie a doručiteľnosť

1. **Brevo účet** (SynthBit vlastní; sender = bovap.sk) — overenie domény: DKIM + SPF.
2. **Odoslanie:** API dávkami (napr. 100/mín.), stav per príjemca v `CampaignRecipient`.
3. **Webhooky Brevo** → aktualizácia statusov (bounce → odberateľ BOUNCED, sťažnosť → COMPLAINED, otvorenie/klik → štatistiky).
4. **Test doručiteľnosti** pred prvým ostrým rozoslaním (fáza 4): test na vlastné adresy
   (aj Gmail), kontrola SPF/DKIM/DMARC pas, zápis do denníka testu.

### DNS zmeny na bovap.sk (pripravíme my, klient/registrár aplikuje alebo schváli)

| Typ | Hodnota (orientačne; presné hodnoty od poskytovateľov) |
|---|---|
| `MX` | Websupport mail servery (pre 2 schránky @bovap.sk) |
| `TXT @` | SPF: `v=spf1 include:<websupport> include:spf.brevo.com ~all` |
| `TXT brevo._domainkey` | DKIM kľúč Brevo |
| `TXT <websupport>._domainkey` | DKIM Websupport (ak vyžaduje) |
| `TXT _dmarc` | DMARC: `v=DMARC1; p=quarantine; rua=...` |
| `A mail.bovap.sk` | IP VPS (aplikácia) |

> **Otvorená otázka:** kde je DNS domény bovap.sk (registrátor / webnode / Websupport)?
> Zistíme pri fáze 3 podľa prístupov od klienta.

---

## 7. Migrácia kontaktov (fáza 2) — najdôležitejší špecifický bod

Klient **nemá adresár** — kontakty sú roztrúsené v odoslaných správach na 3 × centrum.sk.
Postup:

1. **IMAP pripojenie** na 3 schránky @centrum.sk (klient poskytne prístupy).
2. **Skript na extrakciu** adries z priečinka *Odoslané* (Node, IMAP + parsing
   hlavičiek To/Cc/Bcc): získa unikátne adresy, očistí (malé písmená, dedup, validácia
   formátu, vyhodenie vlastných adries a jednorazových).
3. **Ručný prehľad klienta:** export CSV → klient odškrtne/upraví → import do aplikácie.
4. **Náhradná cesta:** manuálny import — vložený zoznam adries (copy-paste) alebo CSV
   upload priamo v `/odberatelia`.
5. Cieľ: čistý zoznam **aktívnych odberateľov** (odhad 100–2 000) + voliteľné skupiny.

> Skript je jednorazový nástroj do `scripts/` v repozitári; výsledok vždy potvrdí klient.

---

## 8. E-mailové schránky a Outlook (fáza 3)

- Na hostingu klienta (podľa prístupov, ktoré pošle) vytvoríme **2 schránky @bovap.sk**
  (napr. `info@bovap.sk`, `oznamy@bovap.sk`). Ak sú v balíku, bez ďalšieho nákladu.
- Nastavíme MX (ak ešte nie sú) a overíme doručenie na ne.
- **Návod v slovenčine** (PDF/HTML): nastavenie IMAP/SMTP v Outlooku (Windows/Mac),
  webmail, presmerovanie, podpis. Príloha k mailu klientovi.

---

## 9. Nasadenie a infraštruktúra

- Repozitár: `/root/bovap` → GitHub → Coolify (VPS, Docker).
- Doména: `mail.bovap.sk` (A record → VPS; HTTPS Let's Encrypt automaticky).
- Postgres: managed cez Coolify, denné zálohy.
- Monitorovanie: healthcheck + notifikácie (35 €/mes = prevádzka, dohľad, zálohy,
  doručiteľnosť, bezpečnostné aktualizácie, podpora).
- **Testovacie prostredie:** staging na `test.bovap.sk` alebo dočasnej subdoméne
  (fáza 1 — „testovací link" z emailu), produkcia na `mail.bovap.sk` (fáza 4).

---

## 10. Fázy projektu (mapované na štruktúru z emailu klienta)

| Fáza | Obsah (z emailu) | Čo robíme | Čo potrebujeme od klienta | Výstup |
|---|---|---|---|---|
| **0** | Predfaktúra 50 % | vystavenie predfaktúry/zálohy; po úhrade štart | úhrada zálohy | zaplatená záloha, štart realizácie |
| **1** | Testovací link | scaffold aplikácie, auth, editor + šablóna, testovacie odoslanie na vlastné adresy | pripomienky k testovaciemu linku | staging, funkčný editor + 1 testovací email |
| **2** | Migrácia kontaktov | IMAP extrakcia z centrum.sk, dedup, import, odhlásenie | prístupy k 3 schránkam centrum.sk, schválenie zoznamu | čistý zoznam odberateľov |
| **3** | Hosting + schránky + Outlook | 2 schránky @bovap.sk, MX, DNS záznamy, návod do Outlooku | prístupy k hostingu + DNS | funkčné schránky + návod |
| **4** | Produkcia na mail.bovap.sk | DNS → mail.bovap.sk, Brevo verifikácia domény, test doručiteľnosti, ostré rozoslanie, zaškolenie | potvrdenie testov | produkčná aplikácia + 1. ostrý email |
| **5** | QoL úpravy | doladenia po ostrej prevádzke (napr. odberový formulár na webnode, štatistiky, skupiny, vzhľad) | spätná väzba | vyladené riešenie |

**Predpokladaná réžia:** fázy 1–4 ≈ 3–5 pracovných dní rozložených podľa dostupnosti
prístupov od klienta; QoL (5) priebežne v rámci paušálu.

---

## 11. Riziká a otvorené otázky

1. **Kde je DNS bovap.sk?** (registrátor / webnode / Websupport) — určuje, ako rýchlo
   a kto aplikuje MX/SPF/DKIM/DMARC. Zistíme vo fáze 3.
2. **Rozsah zoznamu kontaktov** — neznámy počet; IMAP extrakcia môže priniesť veľa šumu
   (jednorazové adresy), nutný dedup a ľudská kontrola klientom.
3. **Súhlas s odosielaním (GDPR)** — kontakty z minulej komunikácie; do prvého ostrého
   emailu vložíme odkaz na odhlásenie a informáciu o spracovaní (postačuje pre malé OZ).
4. **Brevo free tier (300/deň)** — 5 000/mes pokrýva, ale jednorazový rozosiel na 2 000+
   ľudí prekročí denný limit → dávkovanie na 2+ dní alebo krátkodobý platený tier
   (rozhodnutie pri prvom veľkom rozosielaní, riešime interne, klienta to nestojí).
5. **Webnode embed** — ak chce klient odberový formulár priamo na webe, je to QoL
   (iframe/odkaz na `/prihlasenie`), nie je v rozsahu ponuky.
6. **Vlastníctvo Brevo účtu** — drží SynthBit; v prípade ukončenia paušálu export dát
   (CSV) vždy patrí klientovi.

---

## 12. Definícia hotového diela (DoD)

- [ ] Klient má prístup na mail.bovap.sk a vie sám odoslať email zo šablóny (nadpis/text/fotka)
- [ ] Zoznam odberateľov migrovaný z centrum.sk, bez duplicít, s funkčným odhlásením
- [ ] 2 schránky @bovap.sk funkčné + návod do Outlooku odovzdaný
- [ ] SPF/DKIM/DMARC aktívne, test doručiteľnosti prešiel, 1. ostrý rozosiel doručený
- [ ] Návod + zaškolenie v slovenčine (screencast/PDF + krátky call)
- [ ] Zdrojový kód v repozitári, nasadenie cez Coolify, zálohy DB bežia
