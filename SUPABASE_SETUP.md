# Supabase Database Setup Guide

Questa guida ti aiuta a ricreate il database del Partner Installation Portal su Supabase.

## Prerequisiti

- Account Supabase (https://supabase.com)
- Accesso al progetto Supabase
- File `database_schema.sql` (incluso in questo repository)

## Passaggi per l'Importazione

### 1. Accedi a Supabase

1. Vai su https://supabase.com e accedi al tuo account
2. Seleziona il progetto dove vuoi importare il database
3. Vai a **SQL Editor** nel menu laterale

### 2. Crea il Database

#### Opzione A: Importare il file SQL completo

1. Nel **SQL Editor**, clicca su **New Query**
2. Copia tutto il contenuto del file `database_schema.sql`
3. Incolla nel query editor
4. Clicca **Run** per eseguire lo script

#### Opzione B: Eseguire il comando via CLI

Se hai Supabase CLI installato:

```bash
# Login a Supabase
supabase login

# Esegui il file SQL
supabase db push < database_schema.sql
```

### 3. Verifica la Creazione

Dopo l'esecuzione, verifica che tutte le tabelle siano state create:

1. Vai a **Database** → **Tables** nel menu laterale
2. Dovresti vedere le seguenti tabelle:
   - `users`
   - `partners`
   - `teams`
   - `installations`
   - `apiConfig`
   - `technicians`

3. Verifica anche le **Views**:
   - `v_installations_with_details`
   - `v_partner_dashboard`

### 4. Configura le Variabili di Ambiente

Dopo la creazione del database, aggiorna il file `.env` con le credenziali Supabase:

```env
# Supabase Database Connection
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Puoi trovare questi valori in:
# Supabase Dashboard → Settings → Database → Connection String
```

### 5. Aggiorna il Codice (Opzionale)

Se stavi usando MySQL e vuoi passare a PostgreSQL (Supabase):

1. Modifica `drizzle/schema.ts` per usare PostgreSQL:

```typescript
import { pgTable, serial, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// Converti ENUM a pgEnum
export const roleEnum = pgEnum('role', ['user', 'admin']);
export const statusEnum = pgEnum('status', ['pending', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rejected']);

// Usa pgTable invece di mysqlTable
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // ... resto dello schema
});
```

2. Aggiorna `server/db.ts` per usare il driver PostgreSQL:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);
```

3. Installa il driver PostgreSQL:

```bash
pnpm add postgres
pnpm remove mysql2
```

### 6. Sincronizza con Drizzle (Opzionale)

Se vuoi usare Drizzle per gestire le migrazioni future:

```bash
# Genera le migrazioni da Supabase
pnpm drizzle-kit introspect

# Genera le migrazioni dal tuo schema
pnpm drizzle-kit generate

# Applica le migrazioni
pnpm drizzle-kit migrate
```

## Conversione da MySQL a PostgreSQL

Se stavi usando MySQL e vuoi migrare a PostgreSQL (Supabase), ecco le principali differenze:

| MySQL | PostgreSQL |
|-------|-----------|
| `INT AUTO_INCREMENT` | `SERIAL` o `BIGSERIAL` |
| `ENUM('a', 'b')` | `CREATE TYPE ... AS ENUM` |
| `BOOLEAN` | `BOOLEAN` |
| `DATETIME` | `TIMESTAMP` |
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMP DEFAULT NOW()` |
| `TEXT COMMENT` | `COMMENT ON COLUMN` |

## Backup e Restore

### Fare un Backup

```bash
# Backup da Supabase
pg_dump postgresql://[user]:[password]@[host]:[port]/[database] > backup.sql
```

### Ripristinare da Backup

```bash
# Ripristina il backup
psql postgresql://[user]:[password]@[host]:[port]/[database] < backup.sql
```

## Troubleshooting

### Errore: "relation does not exist"

Assicurati che tutte le tabelle siano state create correttamente:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Errore: "permission denied"

Verifica che l'utente Supabase abbia i permessi corretti. Contatta il supporto Supabase se necessario.

### Errore: "syntax error"

Se stai usando PostgreSQL, assicurati che il file SQL sia stato convertito correttamente da MySQL a PostgreSQL.

## Supporto

Per domande o problemi:
- Documentazione Supabase: https://supabase.com/docs
- Community Supabase: https://discord.supabase.io

## Prossimi Passi

1. Configura le variabili di ambiente nel tuo progetto
2. Aggiorna il codice per usare il nuovo database (se necessario)
3. Testa la connessione al database
4. Esegui le migrazioni Drizzle (se necessario)
5. Distribuisci il progetto su Render o Vercel

