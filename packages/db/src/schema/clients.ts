import { createId } from '@paralleldrive/cuid2'
import { mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { users } from './users'

export const clients = mysqlTable('clients', {
  id: varchar('id', { length: 25 })
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  cpf: varchar('cpf', { length: 11 }).unique().notNull(),
  phone: varchar('phone', { length: 11 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: varchar('user_id', { length: 25 })
    .references(() => users.id) // Cannot cascade here because it would break business logic
    .notNull(),
})

/**
 * Here we override the createdAt with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const clientSelectSchema = createSelectSchema(clients, {
  createdAt: z.coerce.date(),
})
