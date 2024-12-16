// src/generator/index.ts
import { FileSystemUtils } from '../utils/file-system.js';
import { TypeConverter, AppwriteAttribute } from './type-converters.js';
import { EnumGenerator, EnumGenerationConfig } from './enum-generator.js';
import { InterfaceGenerator, InterfaceGenerationConfig } from './interface-generator.js';
import { 
  IDConstantsGenerator, 
  IDConstantsGenerationConfig 
} from './id-constants-generator.js';
import { GeneratorError } from '../utils/errors.js';

/**
 * Comprehensive configuration for type generation
 * Provides granular control over the entire type generation process
 */
export interface TypeGeneratorConfig {
  /** Path to the input Appwrite configuration file */
  inputPath: string;

  /** Destination path for generated types */
  outputPath: string;

  /** Configuration for enum generation */
  enumConfig?: EnumGenerationConfig;

  /** Configuration for interface generation */
  interfaceConfig?: InterfaceGenerationConfig;

  /** Additional custom transformations */
    transformers?: TypeTransformer[];
    
     /** Configuration for ID constants generation */
  idConstantsConfig?: IDConstantsGenerationConfig;
}

/**
 * Represents a custom type transformation function
 * Allows advanced modifications to generated types
 */
export type TypeTransformer = (
  generatedTypes: string, 
  context: {
    inputConfig: any;
    collections: Array<{
      name: string;
      attributes: AppwriteAttribute[];
    }>;
  }
) => string;

/**
 * Comprehensive Type Generation Utility
 * Provides a robust, flexible system for generating TypeScript types from Appwrite configurations
 */
export class TypesGenerator {
  /** Default configuration for type generation */
  private static DEFAULT_CONFIG: Partial<TypeGeneratorConfig> = {
    enumConfig: {
      generateEnums: true,
      generateUnionTypes: true,
      namingStrategy: 'pascal'
    },
    interfaceConfig: {
      includeMetadata: true,
        optionalMetadata: true,
        interfaceSuffix: '',
      interfacePrefix: ''
    }
  };

  /** Configuration for the current generation process */
  private config: Required<TypeGeneratorConfig>;

  /**
   * Constructs a new TypesGenerator instance
   * 
   * @param config - Configuration for type generation
   */
  constructor(config: Partial<TypeGeneratorConfig>) {
    // Merge provided config with default configuration
    this.config = {
      ...TypesGenerator.DEFAULT_CONFIG,
      ...config,
      enumConfig: {
        ...TypesGenerator.DEFAULT_CONFIG.enumConfig,
        ...config.enumConfig
      },
      interfaceConfig: {
        ...TypesGenerator.DEFAULT_CONFIG.interfaceConfig,
        ...config.interfaceConfig
      },
        transformers: config.transformers || [],
      idConstantsConfig: {
      constantPrefix: '',
      constantSuffix: '',
      includeComments: true,
      ...config.idConstantsConfig
    }
    } as Required<TypeGeneratorConfig>;
  }

  /**
   * Generates TypeScript types from Appwrite configuration
   * 
   * @returns Generated type definitions as a string
   * @throws {GeneratorError} For configuration or generation errors
   */
  async generate(): Promise<string> {
  try {
    // Validate input configuration
    this.validateConfiguration();

    // Read Appwrite configuration
    const inputConfig = await this.readInputConfiguration();

    // Extract collections with processable attributes
    const processableCollections = this.extractProcessableCollections(inputConfig);

    // Generate initial type content, passing both arguments
    let generatedTypes = this.generateInitialTypes(
      processableCollections, 
      inputConfig  // Add this argument
    );

    // Rest of the method remains the same
    generatedTypes = this.applyCustomTransformations(
      generatedTypes, 
      processableCollections, 
      inputConfig
    );

    return this.formatGeneratedTypes(generatedTypes);
  } catch (error) {
    this.handleGenerationError(error);
  }
}

  /**
   * Validates the generator configuration
   * Ensures all required parameters are present and valid
   * 
   * @throws {GeneratorError} If configuration is invalid
   */
  private validateConfiguration(): void {
    if (!this.config.inputPath) {
      throw new GeneratorError('Input path is required for type generation');
    }

    if (!this.config.outputPath) {
      throw new GeneratorError('Output path is required for type generation');
    }
  }

  /**
   * Reads and parses the input Appwrite configuration
   * 
   * @returns Parsed Appwrite configuration
   * @throws {GeneratorError} If configuration cannot be read or parsed
   */
  private async readInputConfiguration(): Promise<any> {
    try {
      const configContent = await FileSystemUtils.readFile(this.config.inputPath);
      return JSON.parse(configContent);
    } catch (error) {
      throw new GeneratorError(
        `Failed to read or parse input configuration: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Extracts collections with processable attributes
   * 
   * @param inputConfig - Parsed Appwrite configuration
   * @returns Array of collections with processable attributes
   */
  private extractProcessableCollections(inputConfig: any): Array<{
    name: string;
    attributes: AppwriteAttribute[];
  }> {
    if (!inputConfig.collections || !Array.isArray(inputConfig.collections)) {
      throw new GeneratorError('No collections found in input configuration');
    }

    return inputConfig.collections.filter((collection: any) => 
      collection.attributes && collection.attributes.length > 0
    ).map((collection: any) => ({
      name: collection.name,
      attributes: collection.attributes
    }));
  }

  /**
   * Generates initial type definitions
   * 
   * @param collections - Collections to generate types for
   * @returns Generated type definitions
   */
  private generateInitialTypes(
    collections: Array<{
      name: string;
      attributes: AppwriteAttribute[];
    }>,
      inputConfig: any
  ): string {
    // Generate header
    let generatedTypes = `// Auto-generated Appwrite Types
// Generated on ${new Date().toISOString()}
// WARNING: This file is auto-generated. Do not modify manually.

`;

    // Generate enum and union types
    const { enumDefinitions, typeDefinitions } = EnumGenerator.generateEnumDefinitions(
      collections, 
      this.config.enumConfig
    );
    generatedTypes += typeDefinitions + '\n';
    generatedTypes += enumDefinitions + '\n';

    // Generate interfaces
    generatedTypes += InterfaceGenerator.generateInterfaces(
      collections, 
      this.config.interfaceConfig
      );
      
      // Generate ID constants with flexible configuration
      generatedTypes += IDConstantsGenerator.generateIDConstants(
        inputConfig, 
        this.config.idConstantsConfig
      ) + '\n';

    return generatedTypes;
  }

  /**
   * Applies custom transformations to generated types
   * 
   * @param generatedTypes - Initial generated types
   * @param collections - Processed collections
   * @param inputConfig - Original input configuration
   * @returns Transformed type definitions
   */
  private applyCustomTransformations(
    generatedTypes: string, 
    collections: Array<{
      name: string;
      attributes: AppwriteAttribute[];
    }>,
    inputConfig: any
  ): string {
    return this.config.transformers.reduce(
      (types, transformer) => transformer(types, { 
        inputConfig, 
        collections 
      }),
      generatedTypes
    );
  }

  /**
   * Formats generated types with additional processing
   * 
   * @param generatedTypes - Generated type definitions
   * @returns Formatted type definitions
   */
  private formatGeneratedTypes(generatedTypes: string): string {
    // Remove excessive newlines
    return generatedTypes.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  /**
   * Handles errors during type generation
   * 
   * @param error - Error encountered during generation
   * @throws {GeneratorError} With detailed error information
   */
  private handleGenerationError(error: unknown): never {
    if (error instanceof GeneratorError) {
      throw error;
    }

    throw new GeneratorError(
      `Unexpected error during type generation: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}