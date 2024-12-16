// src/generator/type-converters.ts

/**
 * Comprehensive type mapping for Appwrite primitive types
 * Provides precise type conversion with exhaustive type checking
 */
const PRIMITIVE_TYPE_MAP: Record<string, string> = {
  'string': 'string',
  'integer': 'number',
  'float': 'number',
  'boolean': 'boolean',
  'datetime': 'string'
};

/**
 * Interface representing an Appwrite attribute with comprehensive type information
 */
export interface AppwriteAttribute {
  key: string;
  type: string;
  required: boolean;
  array: boolean;
  size?: number;
  elements?: string[];
  format?: string;
  relatedCollection?: string;
}

/**
 * Enhanced interface for relationship attributes
 * Provides comprehensive type information for Appwrite relationships
 */
interface RelationshipAttribute extends AppwriteAttribute {
  relatedCollection: string;
  relationType: 'oneToMany' | 'manyToOne' | 'oneToOne' | 'manyToMany';
  twoWay: boolean;
  twoWayKey?: string;
  side: 'parent' | 'child';
  onDelete: RelationshipDeletionBehavior;
}

/**
 * Represents the possible deletion behaviors for relationships in Appwrite
 */
type RelationshipDeletionBehavior = 
  | 'cascade'   // Delete related documents
  | 'setNull'   // Set related field to null
  | 'restrict'  // Prevent deletion if related documents exist
  | 'noAction'; // Do nothing (default)

/**
 * Comprehensive type conversion utility for Appwrite attributes
 * Provides robust, type-safe conversion with extensive error handling
 */
export class TypeConverter {
  /**
   * Converts an Appwrite attribute to a TypeScript type
   * Handles complex scenarios including enums, arrays, and primitive types
   * 
   * @param attribute - The Appwrite attribute to convert
   * @param context - Optional context for more detailed error reporting
   * @returns Converted TypeScript type representation
   * @throws {Error} For unsupported or invalid attribute types
   */
  static convertToTSType(
    attribute: AppwriteAttribute, 
    context?: { 
      collectionName?: string; 
      attributeName?: string 
    }
  ): string {
    // Validate input attribute
    this.validateAttribute(attribute);

    // Handle enum types with precise type generation
    if (attribute.format === 'enum' && attribute.elements?.length) {
      return this.handleEnumType(attribute);
    }

    // Add explicit relationship type handling
    if (attribute.type === 'relationship') {
      const relationAttr = attribute as RelationshipAttribute;
      
      // Convert related collection name to interface name
      const relatedTypeName = relationAttr.relatedCollection
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
        .replace(/s$/, '');

      // Handle different relationship types
      switch (relationAttr.relationType) {
        case 'oneToMany':
          return relationAttr.side === 'parent'
            ? `${relatedTypeName}[]`
            : `${relatedTypeName} | null`;
        
        case 'manyToOne':
          return relationAttr.side === 'parent'
            ? `${relatedTypeName} | null`
            : `${relatedTypeName}[]`;
        
        case 'oneToOne':
        case 'manyToMany':
          return `${relatedTypeName}[]`;
        
        default:
          return 'string | RelationshipReference';
      }
    }

    // Validate primitive type
    if (!PRIMITIVE_TYPE_MAP.hasOwnProperty(attribute.type)) {
      this.handleUnsupportedType(attribute, context);
    }

    const baseType = PRIMITIVE_TYPE_MAP[attribute.type];

    // Handle array types
    if (attribute.array) {
      return this.handleArrayType(attribute, baseType);
    }

    return baseType;
  }

  /**
   * Generates a type guard function for a given attribute
   * Provides runtime type checking capabilities
   * 
   * @param attribute - The Appwrite attribute to create a type guard for
   * @returns A type guard function for runtime type checking
   */
  static createTypeGuard(attribute: AppwriteAttribute): (value: unknown) => boolean {
    // Handle enum types
    if (attribute.format === 'enum' && attribute.elements) {
      const validValues = new Set(attribute.elements);
      
      return attribute.array 
        ? (value): value is unknown[] => 
            Array.isArray(value) && value.every(v => validValues.has(v))
        : (value): value is string => 
            validValues.has(value as string);
    }

    // Handle primitive types
    return this.getPrimitiveTypeGuard(attribute);
  }

  /**
   * Validates the input attribute structure
   * Ensures the attribute meets basic requirements
   * 
   * @param attribute - The attribute to validate
   * @throws {Error} If attribute is invalid
   */
  private static validateAttribute(attribute: AppwriteAttribute): void {
    if (!attribute || typeof attribute !== 'object') {
      throw new Error('Invalid attribute: Must be a non-null object');
    }

    // Validate key requirements
    if (!attribute.key || typeof attribute.key !== 'string') {
      throw new Error('Attribute must have a valid string key');
    }

    // Validate type
    if (!attribute.type || typeof attribute.type !== 'string') {
      throw new Error('Attribute must have a valid string type');
    }
  }

  /**
   * Handles enum type conversion
   * Generates precise union types for enum attributes
   * 
   * @param attribute - The enum attribute to convert
   * @returns Converted enum type representation
   */
  private static handleEnumType(attribute: AppwriteAttribute): string {
    const enumValues = (attribute.elements || [])
      .map(e => `"${e}"`)
      .join(' | ');
    
    return attribute.array 
      ? `(${enumValues})[]`   // Array of enum values
      : enumValues;           // Single enum value
  }

  /**
   * Handles array type conversion
   * Supports both typed and untyped arrays
   * 
   * @param attribute - The array attribute
   * @param baseType - Base type for the array
   * @returns Converted array type representation
   */
  private static handleArrayType(
    attribute: AppwriteAttribute, 
    baseType: string
  ): string {
    // Handle explicitly typed arrays (like enums)
    if (attribute.elements && attribute.elements.length > 0) {
      const elementType = attribute.elements
        .map(e => `"${e}"`)
        .join(' | ');
      return `(${elementType})[]`;
    }

    // Standard array of primitive type
    return `Array<${baseType}>`;
  }

  /**
   * Handles unsupported attribute types
   * Provides detailed error information
   * 
   * @param attribute - The unsupported attribute
   * @param context - Additional context for error reporting
   * @throws {Error} With detailed type conversion error
   */
  private static handleUnsupportedType(
    attribute: AppwriteAttribute, 
    context?: { 
      collectionName?: string; 
      attributeName?: string 
    }
  ): never {
    const errorContext = context 
      ? `in ${context.collectionName ?? 'unknown'} collection, attribute ${context.attributeName ?? 'unknown'}` 
      : '';
    
    throw new Error(`Unsupported attribute type: ${attribute.type} ${errorContext}`);
  }

  /**
   * Generates a type guard for primitive types
   * Supports array and non-array primitive types
   * 
   * @param attribute - The attribute to create a type guard for
   * @returns A type guard function for the primitive type
   */
  private static getPrimitiveTypeGuard(attribute: AppwriteAttribute): (value: unknown) => boolean {
    const primitiveTypeChecks: Record<string, (value: unknown) => boolean> = {
      'string': (value) => typeof value === 'string',
      'integer': (value) => typeof value === 'number' && Number.isInteger(value),
      'float': (value) => typeof value === 'number',
      'boolean': (value) => typeof value === 'boolean',
      'datetime': (value) => typeof value === 'string'
    };

    const typeCheck = primitiveTypeChecks[attribute.type] ?? (() => true);

    return attribute.array
      ? (value): value is unknown[] => 
          Array.isArray(value) && value.every(typeCheck)
      : typeCheck;
  }
}