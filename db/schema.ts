import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// Everything shown inside the members-only vault. The creator manages these
// rows from /admin; members read them on /vault.
export const vaultEntries = pgTable('vault_entries', {
  id: serial().primaryKey(),
  title: text().notNull(),
  // Free-form text / description shown on the card.
  body: text().notNull().default(''),
  // Optional password, code or key — shown hidden with reveal + copy.
  secret: text().notNull().default(''),
  // Optional download / external link.
  link: text().notNull().default(''),
  pinned: boolean().notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type VaultEntry = typeof vaultEntries.$inferSelect
