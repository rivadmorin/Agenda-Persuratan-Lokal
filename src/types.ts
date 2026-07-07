/**
 * Supported data types for dynamic column fields in the mail agenda.
 */
export type ColumnType = 'text' | 'date' | 'number';

/**
 * Definition schema for a dynamic column.
 */
export interface ColumnDefinition {
  /** The unique key identifier for the column in metadata records */
  key: string;
  /** The localized display label shown in headers */
  label: string;
  /** The data type of the field for proper rendering and validation */
  type: ColumnType;
  /** If true, this field must be populated when creating/editing records */
  required: boolean;
  /** Sort order for column positioning in tables */
  order: number;
  /** If true, this field is printed on physical/PDF receipt slips */
  includeInReceipt?: boolean;
}

/**
 * A named grouping profile of columns, allowing custom views.
 */
export interface ColumnProfile {
  /** Unique profile ID */
  id: string;
  /** Display name of the profile */
  name: string;
  /** List of column definitions belonging to this profile */
  columns: ColumnDefinition[];
  /** Flag indicating if this is the system-wide default view */
  isDefault?: boolean;
}

/**
 * Global application configuration, styling rules, and PDF/backup preferences.
 */
export interface AppConfig {
  /** The brand name of the agency/office mail application */
  appName: string;
  /** Selected style for the primary brand logo */
  logoType?: 'lucide' | 'emoji' | 'image';
  /** Remote URL or path to the brand logo image */
  logoUrl?: string;
  /** Background decorative artwork URL for the login canvas */
  backgroundUrl?: string;
  /** Primary brand/theme hex color code or Tailwind utility base */
  themeColor: string;
  /** Custom background color for light mode */
  themeBgColor?: string;
  /** Custom background color for dark mode */
  themeDarkBgColor?: string;
  /** Palette scheme profile style (e.g. vibrant, pastel, deep) */
  themeColorScheme?: string;
  /** Custom color hue value for material system color seed generation */
  themeHue?: number;
  /** Activates automated client-side or server-side compression for PDFs */
  autoCompressPdf: boolean;
  /** Density scale level of PDF size reduction */
  pdfCompressionLevel: 'low' | 'medium' | 'high';
  /** Boundary check for individual upload limits in Megabytes */
  maxUploadSizeMb: number;
  /** Lifecycle days for keeping daily database backups */
  backupRetentionDays: number;
  /** Lifecycle weeks for weekly archival storage */
  backupRetentionWeeks: number;
  /** Fallback collection of default system columns when no profile is active */
  columns: ColumnDefinition[];
  /** Displays a serial order counter column in lists */
  showNoColumn?: boolean;
  /** Beginning offset index for serial order numberings */
  startNo?: number;
  /** All user-configured and customized column profiles */
  columnProfiles?: ColumnProfile[];
  /** Currently active column profile identifier */
  activeProfileId?: string;
  /** Enables custom automatic renaming of attached files based on meta fields */
  autoRenamePdf?: boolean;
  /** Ordered list of metadata keys used to construct the custom filename */
  pdfRenameCols?: string[];
  /** Suggestions list for the penomoran (classification) field */
  penomoranSuggestions?: string[];
}

/**
 * Application user model with access levels and security context.
 */
export interface User {
  /** Unique login name */
  username: string;
  /** Display/full human name */
  name: string;
  /** Privilege level controlling write/admin actions */
  role: 'admin' | 'operator';
  /** Optional password string (only available during authentication/creation) */
  password?: string;
}

/**
 * Record representing an incoming or decision mail document with its metadata.
 */
export interface MailRecord {
  /** Unique record ID */
  id: string;
  /** Primary record category (Masuk for incoming, Keputusan for decision) */
  type: 'Masuk' | 'Keputusan';
  /** Path to the stored PDF file on the server */
  pdfPath?: string;
  /** ISO date-time string when the record was registered */
  createdAt: string;
  /** ISO date-time string when the record was last modified */
  updatedAt: string;
  /** Version counter used for collision check and optimistic concurrency locking */
  versionId: number;
  /** Dynamic dictionary containing key-value metadata for the custom columns */
  metadata: Record<string, any>;
  /** User identifier who created the record */
  createdBy?: string;
  /** Display name of the creator */
  createdByName?: string;
  /** User identifier who last updated the record */
  updatedBy?: string;
  /** Display name of the last updater */
  updatedByName?: string;
}

/**
 * Network details of the active listening server instance.
 */
export interface ServerInfo {
  /** Resolved system IP addresses */
  ips: string[];
  /** Ingress port the backend is running on */
  port: number;
}

/**
 * Representation of a currently authenticated user actively querying the server.
 */
export interface OnlineUser {
  /** Unique login name */
  username: string;
  /** Full name of the user */
  name: string;
  /** User's access permission role */
  role: string;
  /** ISO timestamp of the user's latest recorded API interaction */
  lastActive: string;
}

/**
 * System task state for tracking background workflows like exports or conversions.
 */
export interface SystemTask {
  /** Task ID */
  id: string;
  /** Human-readable task description */
  name: string;
  /** Workflow type */
  type: 'upload' | 'download' | 'export' | 'zip' | 'receipt' | 'pdf-tool' | 'import';
  /** Processing progress percentage (0 - 100) */
  progress: number;
  /** Status of execution */
  status: 'running' | 'completed' | 'error';
  /** Target file name associated with the task */
  fileName?: string;
  /** Error message or contextual status message */
  message?: string;
}

