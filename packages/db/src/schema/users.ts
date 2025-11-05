import { createId } from '@paralleldrive/cuid2'
import { boolean, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const users = mysqlTable('users', {
  id: varchar('id', { length: 25 })
    .$defaultFn(() => createId())
    .primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 128 }).notNull(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  verified: boolean('verified').default(false).notNull(),
})

/**
 * Here we override the createdAt with a coerce so a date coming, for example, as a string, gets converted into a real Date()
 */
export const userSelectSchema = createSelectSchema(users, {
  createdAt: z.coerce.date(),
})
