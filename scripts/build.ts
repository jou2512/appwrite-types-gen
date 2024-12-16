// scripts/build.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

async function build() {
  try {
    // Ensure clean build directory
    const distPath = path.resolve(process.cwd(), 'dist');
    await fs.rm(distPath, { recursive: true, force: true });
    await fs.mkdir(distPath);

    // Compile TypeScript
    execSync('npx tsc', { stdio: 'inherit' });

    // Copy package.json (for npm publishing)
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    await fs.copyFile(packageJsonPath, path.resolve(distPath, 'package.json'));

    // Copy README
    const readmePath = path.resolve(process.cwd(), 'README.md');
    await fs.copyFile(readmePath, path.resolve(distPath, 'README.md'));

    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();