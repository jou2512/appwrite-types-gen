import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

/**
 * Schema for validating generator configuration
 */
const ConfigSchema = z.object({
  inputPath: z.string().default('./appwrite.json'),
  outputPath: z.string().default('./src/lib/appwrite/types.ts'),
  generateEnums: z.boolean().default(true),
  generateInterfaces: z.boolean().default(true),
  generateDatabaseConstants: z.boolean().default(true),
  generateCollectionConstants: z.boolean().default(true),
});

/**
 * Configuration type for the Appwrite Types Generator
 */
export type GeneratorConfig = z.infer<typeof ConfigSchema>;

/**
 * Configuration loader and validator
 */
export class ConfigManager {
  /**
   * Load configuration from a specified path or use defaults
   * @param configPath Optional path to configuration file
   * @returns Validated configuration object
   */
  static async loadConfig(configPath?: string): Promise<GeneratorConfig> {
    try {
      // Use provided path or look for default config files
      const searchPaths = [
        configPath,
        './appwrite-types.config.json',
        './appwrite-types.json',
        './types-generator.config.json'
      ].filter(Boolean);

      for (const searchPath of searchPaths) {
        try {
          const configContent = await fs.readFile(
            path.resolve(process.cwd(), searchPath as string), 
            'utf8'
          );
          const rawConfig = JSON.parse(configContent);
          return ConfigSchema.parse(rawConfig);
        } catch {
          // Continue to next path if loading fails
          continue;
        }
      }

      // If no config found, return default configuration
      return ConfigSchema.parse({});
    } catch (error) {
      throw new Error(`Invalid configuration: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Validate and normalize configuration
   * @param config Partial configuration object
   * @returns Fully validated configuration
   */
  static validateConfig(config: Partial<GeneratorConfig>): GeneratorConfig {
    return ConfigSchema.parse(config);
  }
}