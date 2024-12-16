// src/index.ts
import { TypesGenerator, TypeGeneratorConfig } from './generator/index.js';
import { FileSystemUtils } from './utils/file-system.js';
import { GeneratorError } from './utils/errors.js';

/**
 * Main entry point for the Appwrite Types Generator
 * Provides a flexible, configurable type generation interface
 */
export async function generateTypes(
  config?: Partial<TypeGeneratorConfig>
): Promise<string> {
  try {
    // Create generator instance with optional configuration
    const generator = new TypesGenerator(config || {});

    // Generate types
    const generatedTypes = await generator.generate();

    // Optional: Write types to file if output path is specified
    if (config?.outputPath) {
      await FileSystemUtils.writeFile(
        config.outputPath, 
        generatedTypes
      );
    }

    return generatedTypes;
  } catch (error) {
    // Wrap and rethrow errors
    if (error instanceof GeneratorError) {
      throw error;
    }
    throw new GeneratorError(
      `Type generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Export key types and utilities for external use
export { 
  TypesGenerator, 
  TypeGeneratorConfig, 
  FileSystemUtils, 
  GeneratorError 
};