// src/generator/interface-generator.ts
import { TypeConverter, AppwriteAttribute } from './type-converters.js';

/**
 * Configuration interface for interface generation
 */
export interface InterfaceGenerationConfig {
  /** Whether to include metadata fields like $id, $createdAt, etc. */
  includeMetadata: boolean;
  
  /** Whether to make metadata fields optional */
  optionalMetadata: boolean;
  
  /** Prefix to add to generated interface names */
  interfacePrefix: string;
  
  /** Suffix to add to generated interface names */
  interfaceSuffix: string;
}

/**
 * Represents a relationship attribute with additional metadata
 */
interface RelationshipAttribute extends AppwriteAttribute {
  relatedCollection: string;
  relationType: 'oneToMany' | 'manyToOne' | 'oneToOne' | 'manyToMany';
  twoWay: boolean;
  twoWayKey?: string;
  side: 'parent' | 'child';
  onDelete: 'cascade' | 'setNull' | 'restrict';
}

/**
 * Comprehensive interface generation utility
 * Generates TypeScript interfaces from Appwrite collection configurations
 */
export class InterfaceGenerator {
  /** Default configuration for interface generation */
  private static DEFAULT_CONFIG: InterfaceGenerationConfig = {
    includeMetadata: true,
    optionalMetadata: true,
    interfacePrefix: '',
    interfaceSuffix: ''
  };

  /**
   * Generates TypeScript interfaces from Appwrite collections
   * 
   * @param collections - Collections to generate interfaces for
   * @param config - Optional configuration for interface generation
   * @returns Generated interface definitions
   */
  static generateInterfaces(
    collections: Array<{
      name: string;
      attributes: AppwriteAttribute[];
    }>,
    config: Partial<InterfaceGenerationConfig> = this.DEFAULT_CONFIG
  ): string {
    // Merge provided config with default configuration
    const fullConfig = { 
      ...this.DEFAULT_CONFIG, 
      ...config 
    };

    // Generate interfaces for each collection
    return collections
      .map(collection => this.generateCollectionInterface(collection, fullConfig))
      .join('\n');
  }

  /**
   * Generates an interface for a specific collection
   * 
   * @param collection - Collection to generate interface for
   * @param config - Interface generation configuration
   * @returns Generated interface definition
   */
  private static generateCollectionInterface(
    collection: { 
      name: string; 
      attributes: AppwriteAttribute[]; 
    },
    config: InterfaceGenerationConfig
  ): string {
    // Generate interface name with prefix/suffix
    const interfaceName = this.generateInterfaceName(
      collection.name, 
      config.interfacePrefix, 
      config.interfaceSuffix
    );

    // Generate attribute definitions
    const attributes = this.generateAttributeDefinitions(
      collection.attributes, 
      config
    );

    // Combine metadata and attributes
    const interfaceContent = config.includeMetadata 
      ? this.addMetadataFields(attributes, config.optionalMetadata)
      : attributes;

    // Generate full interface definition
    return `
/**
 * Represents a ${collection.name} document in the Appwrite database
 * @interface
 */
export interface ${interfaceName} {
${interfaceContent}
}
`;
  }

  /**
   * Generates attribute definitions for an interface
   * 
   * @param attributes - Collection attributes
   * @param config - Interface generation configuration
   * @returns Formatted attribute definitions
   */
  private static generateAttributeDefinitions(
    attributes: AppwriteAttribute[], 
    config: Required<InterfaceGenerationConfig>
  ): string {
    return attributes
      .map(attr => this.generateAttributeDefinition(attr))
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Generates a single attribute definition
   * 
   * @param attribute - Attribute to generate definition for
   * @returns Formatted attribute definition
   */
  private static generateAttributeDefinition(
    attribute: AppwriteAttribute
  ): string {
    // Generate type and optionality
    const optional = !attribute.required ? '?' : '';
    
    // Convert attribute to TypeScript type
    const typeName = TypeConverter.convertToTSType(attribute, {
      attributeName: attribute.key
    });

    // Generate comprehensive comments
    const comments = this.generateAttributeComments(attribute);

    return `${comments}  ${attribute.key}${optional}: ${typeName};`;
  }

  /**
   * Generates comprehensive comments for an attribute
   * 
   * @param attribute - Attribute to generate comments for
   * @returns Formatted comment block
   */
  private static generateAttributeComments(
    attribute: AppwriteAttribute
  ): string {
    const comments: string[] = [];

    // Size-related comment
    if (attribute.size) {
      comments.push(`/** Maximum size: ${attribute.size} characters */`);
    }

    // Enum-specific comments
    if (attribute.format === 'enum' && attribute.elements) {
      comments.push(`/** Possible values: ${attribute.elements.join(', ')} */`);
    }

    // Relationship-specific comments
    if (attribute.type === 'relationship') {
      const relationAttr = attribute as RelationshipAttribute;
      comments.push(`/** Relationship type: ${relationAttr.relationType} */`);
      comments.push(`/** Related collection: ${relationAttr.relatedCollection} */`);
      
      if (relationAttr.twoWay) {
        comments.push(`/** Two-way relationship with key: ${relationAttr.twoWayKey} */`);
      }
      
      comments.push(`/** Deletion behavior: ${relationAttr.onDelete} */`);
    }

    // Format comments
    return comments.length > 0 
      ? comments.map(comment => `  ${comment}\n`).join('') 
      : '';
  }

  /**
   * Adds metadata fields to interface attributes
   * 
   * @param attributes - Existing attribute definitions
   * @param optional - Whether metadata fields should be optional
   * @returns Updated attribute definitions with metadata
   */
  private static addMetadataFields(
    attributes: string, 
    optional: boolean
  ): string {
    const optionalMarker = optional ? '?' : '';
    
    const metadataFields = `
  /** Unique document identifier */
  $id${optionalMarker}: string;

  /** Document creation timestamp */
  $createdAt${optionalMarker}: string;

  /** Document last update timestamp */
  $updatedAt${optionalMarker}: string;

  /** Database identifier */
  $databaseId${optionalMarker}: string;

  /** Collection identifier */
  $collectionId${optionalMarker}: string;

  /** Document-level permissions */
  $permissions${optionalMarker}: string[];
`;

    return `${metadataFields}${attributes ? '\n' + attributes : ''}`;
  }

  /**
   * Generates a standardized interface name
   * 
   * @param collectionName - Original collection name
   * @param prefix - Optional prefix to add
   * @param suffix - Optional suffix to add
   * @returns Formatted interface name
   */
  private static generateInterfaceName(
    collectionName: string, 
    prefix: string = '', 
    suffix: string = ''
  ): string {
    // Remove plurals and convert to pascal case
    const formattedName = collectionName
      .replace(/s$/, '')
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return `${prefix}${formattedName}${suffix}`;
  }
}