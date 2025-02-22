#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

const program = new Command();

program
  .name('repo-prompt')
  .description('CLI tool to generate prompts from GitHub repositories')
  .requiredOption('--repo <url>', 'GitHub repository URL')
  .option('--output [filename]', 'Output file name', 'repo-prompt.txt')
  .option('--include <glob...>', 'Files to include')
  .option('--ignore <glob...>', 'Files to ignore');

program.parse(process.argv);
const options = program.opts();

function getRepoUrl(repoOption: string): { url: string; branch?: string } {
  // If already SSH URL, return as is
  if (repoOption.startsWith('git@')) {
    return { url: repoOption };
  }

  // Parse HTTPS URL
  const urlPattern =
    /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\/(?:tree|blob)\/([^/]+))?(?:\/(.+))?$/;
  const match = repoOption.match(urlPattern);

  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }

  const [, owner, repo, branch] = match;
  // Remove .git suffix if present
  const cleanRepo = repo.replace(/\.git$/, '');
  const sshUrl = `git@github.com:${owner}/${cleanRepo}.git`;

  return { url: sshUrl, branch };
}

async function cloneRepo(
  repoInfo: { url: string; branch?: string },
  tempDir: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['clone'];
    if (repoInfo.branch) {
      args.push('-b', repoInfo.branch);
    }
    args.push(repoInfo.url, tempDir);

    const gitProcess = spawn('git', args, {
      stdio: 'inherit',
    });

    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`git clone failed with code ${code}`));
      }
    });

    gitProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function runRepomix(
  tempDir: string,
  repomixArgs: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['repomix', ...repomixArgs];
    const repomixProcess = spawn('npx', args, {
      cwd: tempDir,
      stdio: 'inherit',
    });

    repomixProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`repomix failed with code ${code}`));
      }
    });

    repomixProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function copyOutput(tempDir: string, outputFile: string): Promise<void> {
  try {
    const sourcePath = path.join(tempDir, 'repomix-output.txt');
    await fs.copyFile(sourcePath, outputFile);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to copy output file: ${error.message}`);
    }
    throw new Error('Failed to copy output file: Unknown error');
  }
}

async function main(): Promise<void> {
  const tempDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'repo-prompt-'));

  try {
    // Transform repo URL
    const repoInfo = getRepoUrl(options.repo);

    // Clone repository
    await cloneRepo(repoInfo, tempDir);

    // Prepare repomix arguments
    const repomixArgs: string[] = [];
    if (options.include) {
      options.include.forEach((pattern: string) => {
        repomixArgs.push('--include', pattern);
      });
    }
    if (options.ignore) {
      options.ignore.forEach((pattern: string) => {
        repomixArgs.push('--ignore', pattern);
      });
    }

    // Add any other passthrough arguments
    repomixArgs.push(...program.args);

    // Run repomix
    await runRepomix(tempDir, repomixArgs);

    // Copy output file
    await copyOutput(tempDir, options.output);

    console.log(`Successfully generated prompt in ${options.output}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error: Unknown error occurred');
    }
    process.exit(1);
  } finally {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
