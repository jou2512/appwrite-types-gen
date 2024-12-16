/**
 * Configuration for ID constant generation
 */
export interface IDConstantsGenerationConfig {
  /** If the Database IDConstants should be Generated */
  generateDatabaseConstants?: boolean;
  /** If the Collection IDConstants should be Generated */
  generateCollectionConstants?: boolean;
  /** Prefix to add to generated constant names */
  constantPrefix?: string;

  /** Suffix to add to generated constant names */
  constantSuffix?: string;

  /** Custom naming transformation function */
  namingTransform?: (name: string) => string;

  /** Whether to include comments for each constant */
  includeComments?: boolean;
}

/**
 * Comprehensive ID constants generation utility
 * Provides robust and flexible generation of database and collection ID constants
 */
export class IDConstantsGenerator {
  /** Default configuration for ID constant generation */
  private static DEFAULT_CONFIG: Required<IDConstantsGenerationConfig> = {
    generateDatabaseConstants: true,
    generateCollectionConstants: true,
    constantPrefix: '',
    constantSuffix: '',
    namingTransform: IDConstantsGenerator.defaultNamingTransform,
    includeComments: true
  };

  /**
   * Generates ID constants from Appwrite configuration
   * 
   * @param inputConfig - Parsed Appwrite configuration
   * @param config - Optional configuration for ID constant generation
   * @returns Generated ID constant definitions
   */
  static generateIDConstants(
    inputConfig: any, 
    config: IDConstantsGenerationConfig = {}
  ): string {
    // Merge provided config with default configuration
    const fullConfig = { 
      ...this.DEFAULT_CONFIG, 
      ...config 
    };

    // Validate input configuration
    this.validateInputConfig(inputConfig);

    // Generate database ID constants
    const databaseConstants = this.generateDatabaseConstants(
      inputConfig.databases || [], 
      fullConfig
    );

    // Generate collection ID constants
    const collectionConstants = this.generateCollectionConstants(
      inputConfig.collections || [], 
      fullConfig
    );

    // Combine and format constants
    return `
      ${fullConfig.generateDatabaseConstants ?? `/** Database identifiers for the project */
      export const DATABASE_IDS = {
      ${databaseConstants}
      };`}

      ${fullConfig.generateCollectionConstants ?? `/** Collection identifiers for the project */
      export const COLLECTION_IDS = {
      ${collectionConstants}
      };`}
    `;
  }

  /**
   * Validates the input configuration
   * 
   * @param inputConfig - Appwrite configuration to validate
   * @throws {Error} If configuration is invalid
   */
  private static validateInputConfig(inputConfig: any): void {
    if (!inputConfig || typeof inputConfig !== 'object') {
      throw new Error('Invalid input configuration: Must be a non-null object');
    }
  }

  /**
   * Generates database ID constants
   * 
   * @param databases - Array of database configurations
   * @param config - ID constants generation configuration
   * @returns Formatted database ID constants
   */
  private static generateDatabaseConstants(
    databases: Array<{ $id: string; name: string }>, 
    config: Required<IDConstantsGenerationConfig>
  ): string {
    return databases
      .map(db => {
        const constantName = this.formatConstantName(
          db.name, 
          config.constantPrefix, 
          config.constantSuffix,
          config.namingTransform
        );

        const comment = config.includeComments 
          ? `  /** Database ID for ${db.name} */\n` 
          : '';

        return `${comment}  ${constantName}: '${db.$id}',`;
      })
      .join('\n');
  }

  /**
   * Generates collection ID constants
   * 
   * @param collections - Array of collection configurations
   * @param config - ID constants generation configuration
   * @returns Formatted collection ID constants
   */
  private static generateCollectionConstants(
    collections: Array<{ $id: string; name: string }>, 
    config: Required<IDConstantsGenerationConfig>
  ): string {
    return collections
      .map(collection => {
        const constantName = this.formatConstantName(
          collection.name, 
          config.constantPrefix, 
          config.constantSuffix,
          config.namingTransform
        );

        const comment = config.includeComments 
          ? `  /** Collection ID for ${collection.name} */\n` 
          : '';

        return `${comment}  ${constantName}: '${collection.$id}',`;
      })
      .join('\n');
  }

  /**
   * Formats a constant name with optional prefix, suffix, and custom transformation
   * 
   * @param name - Original name to transform
   * @param prefix - Prefix to add
   * @param suffix - Suffix to add
   * @param transform - Custom naming transformation function
   * @returns Formatted constant name
   */
  private static formatConstantName(
    name: string, 
    prefix: string, 
    suffix: string,
    transform: (name: string) => string
  ): string {
    // Apply custom naming transformation
    const transformedName = transform(name);

    // Sanitize name (remove non-alphanumeric characters, ensure starts with letter)
    const sanitizedName = transformedName
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^(\d)/, '_$1');

    return `${prefix}${sanitizedName.toUpperCase()}${suffix}`;
  }

  /**
   * Default naming transformation function
   * Removes special characters and converts to uppercase
   * 
   * @param name - Name to transform
   * @returns Transformed name
   */
  private static defaultNamingTransform(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
  }
}