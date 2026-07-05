import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const config = pgTable('config', {
  id: serial('id').primaryKey(),
  data: jsonb('data').notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  data: jsonb('data'),
});

export const mails = pgTable('mails', {
  id: text('id').primaryKey(),
  metadata: jsonb('metadata').notNull(),
  pdfPath: text('pdf_path'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  versionId: text('version_id'),
});
