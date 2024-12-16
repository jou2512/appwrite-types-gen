#!/usr/bin/env node
import * as path from 'path';
import { program } from 'commander';
import { ConfigManager } from './config.js';
import { TypesGenerator } from './generator/index.js';
import { FileSystemUtils } from './utils/file-system.js';
import { GeneratorError } from './utils/errors.js';

/**
 * Command-line interface for Appwrite Types Generator
 */
export class CLI {
  /**
   * Initialize and configure CLI parser
   */
  static configure() {
    program
      .name('appwrite-types-gen')
      .description('Generate TypeScript types from Appwrite project configuration')
      .version('0.1.0')
      .option('-c, --config <path>', 'Path to custom configuration file')
      .option('-o, --output <path>', 'Custom output path for generated types')
      .option('--no-enums', 'Disable enum generation')
      .option('--no-interfaces', 'Disable interface generation')
      .option('--no-database', 'Disable Database constant generation')
      .option('--no-collections', 'Disable Collection constants generation')
      .parse(process.argv);

    return program.opts();
  }

  /**
   * Run the types generation process
   */
  static async run() {
    try {
      // In CLI.run()
      // Parse CLI options
      const options = this.configure();

      console.log(options)
      
      // Load configuration
      const config = await ConfigManager.loadConfig(options.config);
      
      // Override config with CLI options
      if (options.output) config.outputPath = options.output;
      config.generateEnums = options.enums ?? config.generateEnums;
      config.generateInterfaces = options.interfaces ?? config.generateInterfaces;

      // Validate input file exists
      await FileSystemUtils.validateFileExists(config.inputPath);

      // Generate types
      const generator = new TypesGenerator(config);
      const generatedTypes = await generator.generate();

      // Write generated types
      await FileSystemUtils.writeFile(
        path.resolve(process.cwd(), config.outputPath), 
        generatedTypes
      );

      console.log(`✅ Types generated successfully at ${config.outputPath}`);
    } catch (error) {
      if (error instanceof GeneratorError) {
        console.error(`❌ Generation Error: ${error.message}`);
      } else {
        console.error(`❌ Unexpected Error: ${error instanceof Error ? error.message : error}`);
      }
      process.exit(1);
    }
  }
}

CLI.run().catch(error => {
  console.error('CLI Error:', error);
  process.exit(1);
});