/**
 * FileWriter - Handle file output with configurable directory and format
 */

import * as fs from 'fs';
import * as path from 'path';
import { OutputConfig, FileWriteOptions } from './types';

export class FileWriter {
  private config: OutputConfig;

  constructor(config: OutputConfig) {
    this.config = config;
    this.ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.config.dir)) {
      fs.mkdirSync(this.config.dir, { recursive: true });
    }
  }

  /**
   * Generate filename with optional timestamp
   */
  private generateFilename(options: FileWriteOptions): string {
    if (options.filename) {
      // Ensure .json extension
      if (!options.filename.endsWith('.json')) {
        return options.filename + '.json';
      }
      return options.filename;
    }

    if (options.timestamp) {
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '');
      return `output-${timestamp}.json`;
    }

    return 'output.json';
  }

  /**
   * Format data based on output format
   */
  private formatData(data: any, format: 'json' | 'pretty'): string {
    if (format === 'pretty') {
      return JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data);
  }

  /**
   * Write data to file
   */
  public async write(data: any, options: FileWriteOptions): Promise<string> {
    try {
      const filename = this.generateFilename(options);
      const filePath = this.getFilePath(filename);
      const format = options.format || this.config.format;
      const content = this.formatData(data, format);

      // Write file
      await fs.promises.writeFile(filePath, content, 'utf8');

      return filename;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to write file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get full file path
   */
  public getFilePath(filename: string): string {
    return path.join(this.config.dir, filename);
  }

  /**
   * Check if file exists
   */
  public fileExists(filename: string): boolean {
    return fs.existsSync(this.getFilePath(filename));
  }

  /**
   * Read file contents
   */
  public async read(filename: string): Promise<any> {
    const filePath = this.getFilePath(filename);
    const content = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * List all files in output directory
   */
  public listFiles(): string[] {
    if (!fs.existsSync(this.config.dir)) {
      return [];
    }
    return fs.readdirSync(this.config.dir);
  }

  /**
   * Delete a file
   */
  public async delete(filename: string): Promise<void> {
    const filePath = this.getFilePath(filename);
    await fs.promises.unlink(filePath);
  }

  /**
   * Get output directory path
   */
  public getOutputDir(): string {
    return this.config.dir;
  }
}
