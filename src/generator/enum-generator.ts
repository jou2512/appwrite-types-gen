// src/generator/enum-generator.ts
import { AppwriteAttribute } from './type-converters.js';

/**
 * Represents configuration for enum generation
 */
export interface EnumGenerationConfig {
  /** Whether to generate standard enums */
  generateEnums?: boolean;
  /** Whether to generate union type definitions */
  generateUnionTypes?: boolean;
  /** Naming strategy for generated enums/types */
  namingStrategy?: 'pascal' | 'camel' | 'snake';
}

/**
 * Comprehensive enum and type generation utility
 * Handles complex enum type generation for Appwrite schemas
 */
export class EnumGenerator {
  /** Default configuration for enum generation */
  private static DEFAULT_CONFIG: EnumGenerationConfig = {
    generateEnums: true,
    generateUnionTypes: true,
    namingStrategy: 'pascal'
  };

  /**
   * Generates enum and type definitions from Appwrite collection attributes
   * 
   * @param collections - Appwrite collections to extract enum types from
   * @param config - Optional configuration for enum generation
   * @returns Generated enum and type definitions
   */
  static generateEnumDefinitions(
    collections: Array<{
      name: string;
      attributes: AppwriteAttribute[];
    }>,
    config: EnumGenerationConfig = {}
  ): {
    enumDefinitions: string;
    typeDefinitions: string;
  } {
    // Merge provided config with default configuration
    const fullConfig = { 
      ...this.DEFAULT_CONFIG, 
      ...config 
    };

    // Collect unique enum types across collections
    const enumTypes = this.extractEnumTypes(collections);

    // Generate enum and type definitions
    const generatedDefinitions = {
      enumDefinitions: '',
      typeDefinitions: ''
    };

    // Process each unique enum type
    enumTypes.forEach((elements, typeName) => {
      // Generate enum definition
      if (fullConfig.generateEnums) {
        generatedDefinitions.enumDefinitions += this.generateEnum(
          typeName, 
          elements, 
          fullConfig.namingStrategy
        );
      }

      // Generate union type definition
      if (fullConfig.generateUnionTypes) {
        generatedDefinitions.typeDefinitions += this.generateUnionType(
          typeName, 
          elements
        );
      }
    });

    return generatedDefinitions;
  }

  /**
   * Extracts unique enum types from collection attributes
   * 
   * @param collections - Collections to process
   * @returns Map of enum type names to their values
   */
  private static extractEnumTypes(
    collections: Array<{
      name: string;
      attributes: AppwriteAttribute[];
    }>
  ): Map<string, string[]> {
    const enumTypes = new Map<string, string[]>();

    collections.forEach(collection => {
      collection.attributes.forEach(attr => {
        // Identify enum attributes
        if (attr.format === 'enum' && attr.elements && attr.elements.length > 0) {
          // Generate unique type name
          const typeName = this.generateTypeName(
            collection.name, 
            attr.key
          );

          // Store unique enum values
          enumTypes.set(typeName, attr.elements);
        }
      });
    });

    return enumTypes;
  }

  /**
   * Generates a type-safe enum definition
   * 
   * @param typeName - Name of the enum
   * @param elements - Enum values
   * @param namingStrategy - Naming convention for enum
   * @returns Formatted enum definition
   */
  private static generateEnum(
    typeName: string, 
    elements: string[], 
    namingStrategy: EnumGenerationConfig['namingStrategy'] = 'pascal'
  ): string {
    // Generate enum values with proper naming
    const enumValues = elements.map(element => {
      const formattedKey = this.formatEnumKey(element, namingStrategy);
      return `  /** Represents the ${element} option */
  ${formattedKey} = "${element}"`;
    }).join(',\n');

    return `
/**
 * Enum representing ${typeName}
 * Provides type-safe representation of possible values
 */
export enum ${typeName} {
${enumValues}
}
`;
  }

  /**
   * Generates a union type definition
   * 
   * @param typeName - Name of the type
   * @param elements - Type values
   * @returns Formatted union type definition
   */
  private static generateUnionType(
    typeName: string, 
    elements: string[]
  ): string {
    const unionType = elements.map(e => `"${e}"`).join(' | ');

    return `
/**
 * Union type representing ${typeName}
 * Provides flexible type definition for possible values
 */
export type ${typeName}Type = ${unionType};
`;
  }

  /**
   * Generates a standardized type name
   * 
   * @param collectionName - Name of the collection
   * @param attributeName - Name of the attribute
   * @returns Formatted type name
   */
  private static generateTypeName(
    collectionName: string, 
    attributeName: string
  ): string {
    // Remove plurals and convert to pascal case
    const formattedCollection = collectionName
      .replace(/s$/, '')
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    const formattedAttribute = attributeName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return `${formattedCollection}${formattedAttribute}`;
  }

  /**
   * Formats enum keys according to specified naming strategy
   * 
   * @param value - Original enum value
   * @param strategy - Naming strategy to apply
   * @returns Formatted enum key
   */
  private static formatEnumKey(
    value: string, 
    strategy: EnumGenerationConfig['namingStrategy']
  ): string {
    // Remove non-alphanumeric characters and convert to uppercase
    const sanitizedKey = value
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase();

    switch (strategy) {
      case 'pascal':
        return sanitizedKey;
      case 'camel':
        return sanitizedKey.charAt(0).toLowerCase() + sanitizedKey.slice(1);
      case 'snake':
        return sanitizedKey.toLowerCase();
      default:
        return sanitizedKey;
    }
  }
}