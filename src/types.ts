export type ColumnType = 'text' | 'date' | 'number';

export interface ColumnDefinition {
  key: string;
  label: string;
  type: ColumnType;
  required: boolean;
  order: number;
}

export interface AppConfig {
  appName: string;
  logoUrl?: string;
  backgroundUrl?: string;
  themeColor: string; // hex or tailwind base color
  autoCompressPdf: boolean;
  pdfCompressionLevel: 'low' | 'medium' | 'high';
  maxUploadSizeMb: number;
  backupRetentionDays: number;
  backupRetentionWeeks: number;
  columns: ColumnDefinition[];
  showNoColumn?: boolean;
}

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'operator';
  password?: string; // only on backend, stripped in responses
}

export interface MailRecord {
  id: string;
  type: 'Masuk' | 'Keputusan';
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
  versionId: number; // For optimistic locking
  metadata: Record<string, any>; // key-value for dynamic columns
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface ServerInfo {
  ips: string[];
  port: number;
}

export interface OnlineUser {
  username: string;
  name: string;
  role: string;
  lastActive: string;
}
