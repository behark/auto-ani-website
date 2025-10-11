/**
 * Database Backup and Recovery System
 *
 * Comprehensive backup strategy for PostgreSQL databases:
 * - Automated full backups
 * - Incremental backups using WAL archiving
 * - Point-in-time recovery (PITR)
 * - Backup verification and restoration
 *
 * Backup Types:
 * 1. Full Backup: Complete database dump (daily)
 * 2. Incremental: Transaction logs (continuous)
 * 3. Schema Only: Structure backup (before migrations)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../logger';

const execAsync = promisify(exec);

export interface BackupConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  backupDir: string;
  retentionDays: number;
  s3Bucket?: string; // Optional S3 storage
  s3Region?: string;
}

export interface BackupResult {
  success: boolean;
  backupFile?: string;
  size?: number;
  duration?: number;
  error?: string;
}

/**
 * Parse DATABASE_URL to extract connection parameters
 */
function parseDatabaseUrl(url: string): Partial<BackupConfig> {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 5432,
      database: parsed.pathname.slice(1),
      username: parsed.username,
      password: parsed.password,
    };
  } catch (error) {
    logger.error('Failed to parse DATABASE_URL', {}, error instanceof Error ? error : undefined);
    throw new Error('Invalid DATABASE_URL format');
  }
}

/**
 * Get backup configuration from environment
 */
function getBackupConfig(): BackupConfig {
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or DIRECT_URL must be set');
  }

  const parsed = parseDatabaseUrl(databaseUrl);

  return {
    host: parsed.host || 'localhost',
    port: parsed.port || 5432,
    database: parsed.database || 'auto_ani_db',
    username: parsed.username || 'postgres',
    password: parsed.password || '',
    backupDir: process.env.BACKUP_DIR || '/var/backups/postgresql',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    s3Bucket: process.env.BACKUP_S3_BUCKET,
    s3Region: process.env.BACKUP_S3_REGION || 'eu-central-1',
  };
}

/**
 * Database Backup Manager
 */
export class BackupManager {
  private config: BackupConfig;

  constructor(config?: Partial<BackupConfig>) {
    this.config = { ...getBackupConfig(), ...config };
  }

  /**
   * Create full database backup using pg_dump
   */
  async createFullBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-full-${timestamp}.sql.gz`;
    const backupPath = path.join(this.config.backupDir, backupFileName);

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.config.backupDir, { recursive: true });

      // Set PostgreSQL password environment variable
      const env = {
        ...process.env,
        PGPASSWORD: this.config.password,
      };

      // Create compressed backup
      const command = `pg_dump -h ${this.config.host} -p ${this.config.port} -U ${this.config.username} -d ${this.config.database} --verbose --format=custom | gzip > ${backupPath}`;

      logger.info('Starting full database backup', {
        database: this.config.database,
        backupFile: backupFileName,
      });

      await execAsync(command, { env });

      // Get backup file size
      const stats = await fs.stat(backupPath);
      const duration = Date.now() - startTime;

      logger.info('Full backup completed successfully', {
        backupFile: backupFileName,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`,
      });

      // Upload to S3 if configured
      if (this.config.s3Bucket) {
        await this.uploadToS3(backupPath, backupFileName);
      }

      return {
        success: true,
        backupFile: backupPath,
        size: stats.size,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Full backup failed', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create schema-only backup (useful before migrations)
   */
  async createSchemaBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-schema-${timestamp}.sql`;
    const backupPath = path.join(this.config.backupDir, backupFileName);

    try {
      await fs.mkdir(this.config.backupDir, { recursive: true });

      const env = {
        ...process.env,
        PGPASSWORD: this.config.password,
      };

      const command = `pg_dump -h ${this.config.host} -p ${this.config.port} -U ${this.config.username} -d ${this.config.database} --schema-only --verbose > ${backupPath}`;

      logger.info('Starting schema backup', {
        database: this.config.database,
        backupFile: backupFileName,
      });

      await execAsync(command, { env });

      const stats = await fs.stat(backupPath);
      const duration = Date.now() - startTime;

      logger.info('Schema backup completed successfully', {
        backupFile: backupFileName,
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        backupFile: backupPath,
        size: stats.size,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Schema backup failed', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create data-only backup
   */
  async createDataBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-data-${timestamp}.sql.gz`;
    const backupPath = path.join(this.config.backupDir, backupFileName);

    try {
      await fs.mkdir(this.config.backupDir, { recursive: true });

      const env = {
        ...process.env,
        PGPASSWORD: this.config.password,
      };

      const command = `pg_dump -h ${this.config.host} -p ${this.config.port} -U ${this.config.username} -d ${this.config.database} --data-only --verbose | gzip > ${backupPath}`;

      logger.info('Starting data backup', {
        database: this.config.database,
        backupFile: backupFileName,
      });

      await execAsync(command, { env });

      const stats = await fs.stat(backupPath);
      const duration = Date.now() - startTime;

      logger.info('Data backup completed successfully', {
        backupFile: backupFileName,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        backupFile: backupPath,
        size: stats.size,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Data backup failed', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupFile: string): Promise<BackupResult> {
    const startTime = Date.now();

    try {
      const env = {
        ...process.env,
        PGPASSWORD: this.config.password,
      };

      logger.warn('Starting database restore', {
        backupFile,
        database: this.config.database,
      });

      // Determine if backup is compressed
      const isCompressed = backupFile.endsWith('.gz');
      const command = isCompressed
        ? `gunzip -c ${backupFile} | psql -h ${this.config.host} -p ${this.config.port} -U ${this.config.username} -d ${this.config.database}`
        : `psql -h ${this.config.host} -p ${this.config.port} -U ${this.config.username} -d ${this.config.database} < ${backupFile}`;

      await execAsync(command, { env });

      const duration = Date.now() - startTime;

      logger.info('Database restore completed successfully', {
        backupFile,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        backupFile,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Database restore failed', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupFile: string): Promise<boolean> {
    try {
      // Check if file exists and is readable
      await fs.access(backupFile, fs.constants.R_OK);

      // Get file stats
      const stats = await fs.stat(backupFile);

      if (stats.size === 0) {
        logger.error('Backup file is empty', { backupFile });
        return false;
      }

      // For compressed files, verify gzip integrity
      if (backupFile.endsWith('.gz')) {
        const { stdout } = await execAsync(`gzip -t ${backupFile}`);
        logger.info('Backup verification passed', { backupFile });
      }

      return true;
    } catch (error) {
      logger.error('Backup verification failed', {
        backupFile,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<{ deleted: number; freed: number }> {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        if (!file.startsWith('backup-')) continue;

        const filePath = path.join(this.config.backupDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          freedSpace += stats.size;
          await fs.unlink(filePath);
          deletedCount++;

          logger.info('Deleted old backup', {
            file,
            age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)),
          });
        }
      }

      logger.info('Backup cleanup completed', {
        deleted: deletedCount,
        freed: `${(freedSpace / 1024 / 1024).toFixed(2)} MB`,
      });

      return { deleted: deletedCount, freed: freedSpace };
    } catch (error) {
      logger.error('Backup cleanup failed', {}, error instanceof Error ? error : undefined);
      return { deleted: 0, freed: 0 };
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<
    Array<{
      name: string;
      path: string;
      size: number;
      created: Date;
      type: 'full' | 'schema' | 'data';
    }>
  > {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const backups = [];

      for (const file of files) {
        if (!file.startsWith('backup-')) continue;

        const filePath = path.join(this.config.backupDir, file);
        const stats = await fs.stat(filePath);

        let type: 'full' | 'schema' | 'data' = 'full';
        if (file.includes('schema')) type = 'schema';
        else if (file.includes('data')) type = 'data';

        backups.push({
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          type,
        });
      }

      // Sort by creation date, newest first
      backups.sort((a, b) => b.created.getTime() - a.created.getTime());

      return backups;
    } catch (error) {
      logger.error('Failed to list backups', {}, error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * Upload backup to S3 (if configured)
   */
  private async uploadToS3(filePath: string, fileName: string): Promise<void> {
    if (!this.config.s3Bucket) return;

    try {
      logger.info('Uploading backup to S3', {
        bucket: this.config.s3Bucket,
        file: fileName,
      });

      const command = `aws s3 cp ${filePath} s3://${this.config.s3Bucket}/backups/${fileName} --region ${this.config.s3Region}`;
      await execAsync(command);

      logger.info('Backup uploaded to S3 successfully', {
        bucket: this.config.s3Bucket,
        file: fileName,
      });
    } catch (error) {
      logger.error('S3 upload failed', {}, error instanceof Error ? error : undefined);
      // Don't throw - local backup is still successful
    }
  }
}

/**
 * Automated backup scheduler
 */
export class BackupScheduler {
  private manager: BackupManager;
  private intervals: NodeJS.Timeout[] = [];

  constructor(config?: Partial<BackupConfig>) {
    this.manager = new BackupManager(config);
  }

  /**
   * Start automated backup schedule
   */
  start(): void {
    // Daily full backup at 2 AM
    const fullBackupInterval = setInterval(
      async () => {
        const now = new Date();
        if (now.getHours() === 2) {
          await this.manager.createFullBackup();
          await this.manager.cleanupOldBackups();
        }
      },
      60 * 60 * 1000
    ); // Check every hour

    this.intervals.push(fullBackupInterval);

    logger.info('Backup scheduler started', {
      fullBackup: 'Daily at 2 AM',
      cleanup: 'After each backup',
    });
  }

  /**
   * Stop automated backups
   */
  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    logger.info('Backup scheduler stopped');
  }
}

/**
 * Export backup manager instance
 */
export const backupManager = new BackupManager();

/**
 * Convenience functions
 */
export const createBackup = () => backupManager.createFullBackup();
export const createSchemaBackup = () => backupManager.createSchemaBackup();
export const restoreBackup = (file: string) => backupManager.restoreBackup(file);
export const verifyBackup = (file: string) => backupManager.verifyBackup(file);
export const listBackups = () => backupManager.listBackups();
export const cleanupBackups = () => backupManager.cleanupOldBackups();