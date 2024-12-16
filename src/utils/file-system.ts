// src/utils/file-system.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileSystemError } from './errors.js';

/**
 * Utility class for file system operations with robust error handling
 * Provides type-safe, comprehensive file system interactions
 */
export class FileSystemUtils {
  /**
   * Validates that a file exists
   * @param filePath - Path to the file to validate
   * @throws {FileSystemError} If file does not exist or is not accessible
   */
  static async validateFileExists(filePath: string): Promise<void> {
    try {
      const resolvedPath = path.resolve(process.cwd(), filePath);
      await fs.access(resolvedPath, fs.constants.R_OK);
    } catch (error) {
      throw new FileSystemError(`File not found or not readable: ${filePath}`);
    }
  }

  /**
   * Reads a file with comprehensive error handling
   * @param filePath - Path to the file to read
   * @param encoding - File encoding (default: utf8)
   * @returns File contents as a string
   * @throws {FileSystemError} For any file reading issues
   */
  static async readFile(
    filePath: string, 
    encoding: BufferEncoding = 'utf8'
  ): Promise<string> {
    try {
      const resolvedPath = path.resolve(process.cwd(), filePath);
      return await fs.readFile(resolvedPath, { encoding });
    } catch (error) {
      throw new FileSystemError(`Unable to read file: ${filePath}`);
    }
  }

  /**
   * Writes content to a file with comprehensive path handling
   * @param filePath - Destination file path
   * @param content - Content to write
   * @param options - Write options
   * @throws {FileSystemError} For any file writing issues
   */
  static async writeFile(
    filePath: string, 
    content: string, 
    options: fs.CreateWriteStreamOptions = { encoding: 'utf8' }
  ): Promise<void> {
    try {
      const resolvedPath = path.resolve(process.cwd(), filePath);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
      
      await fs.writeFile(resolvedPath, content, options);
    } catch (error) {
      throw new FileSystemError(`Unable to write file: ${filePath}`);
    }
  }

  /**
   * Safely creates a directory with recursive option
   * @param dirPath - Directory path to create
   * @throws {FileSystemError} For directory creation issues
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      const resolvedPath = path.resolve(process.cwd(), dirPath);
      await fs.mkdir(resolvedPath, { recursive: true });
    } catch (error) {
      throw new FileSystemError(`Unable to create directory: ${dirPath}`);
    }
  }

  /**
   * Checks if a path is a directory
   * @param dirPath - Path to check
   * @returns Boolean indicating if path is a directory
   */
  static async isDirectory(dirPath: string): Promise<boolean> {
    try {
      const resolvedPath = path.resolve(process.cwd(), dirPath);
      const stats = await fs.stat(resolvedPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

    /**
     * Performs a deep merge of two JSON objects.
     * @param target - Target object to merge into.
     * @param source - Source object to merge from.
     * @returns Deeply merged object.
     */
    static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
        const output = { ...target };

        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
            const sourceValue = source[key as keyof T];
            const targetValue = target[key as keyof T];

            if (this.isObject(sourceValue) && this.isObject(targetValue)) {
                // Type assertion to avoid type conflict
                output[key as keyof T] = this.deepMerge(targetValue, sourceValue as any);
            } else {
                output[key as keyof T] = sourceValue as T[keyof T];
            }
            });
        }

        return output;
    }

  /**
   * Checks if a value is a plain object
   * @param item - Value to check
   * @returns Boolean indicating if value is an object
   */
  private static isObject(item: any): item is Record<string, any> {
    return (
      item && 
      typeof item === 'object' && 
      !Array.isArray(item)
    );
  }
}