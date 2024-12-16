/**
 * Base error class for Appwrite Types Generator
 */
export class GeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeneratorError';
  }
}

/**
 * Error for configuration-related issues
 */
export class ConfigurationError extends GeneratorError {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error for file system-related issues
 */
export class FileSystemError extends GeneratorError {
  constructor(message: string) {
    super(`File System Error: ${message}`);
    this.name = 'FileSystemError';
  }
}