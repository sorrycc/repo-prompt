# repo-prompt

A CLI tool to generate AI prompts from GitHub repositories using [repomix](https://github.com/yamadashy/repomix).

## Features

- 🔄 Clone any GitHub repository (supports both HTTPS and SSH URLs)
- 🌲 Support for specific branches or tags
- 🔍 Filter files using glob patterns
- 🚫 Ignore unwanted files and directories
- 📝 Generate structured prompts for AI consumption
- 🧹 Automatic cleanup of temporary files

## Usage

The easiest way to use repo-prompt is with npx:

```bash
npx -y repo-prompt --repo <github-repo-url> [options]
```

### Examples

Basic usage with default settings:

```bash
npx -y repo-prompt --repo https://github.com/username/repo
```

Clone a specific branch and include only TypeScript files:

```bash
npx -y repo-prompt --repo https://github.com/username/repo/tree/dev --include "**/*.ts" "**/*.tsx"
```

Include specific files and ignore test files:

```bash
npx -y repo-prompt --repo https://github.com/username/repo \
  --include "**/*.js" "**/*.jsx" \
  --ignore "**/test/**" "**/node_modules/**"
```

### Options

- `--repo <url>` (required): GitHub repository URL (HTTPS or SSH)
- `--output [filename]` (optional): Output file name (default: repo-prompt.txt)
- `--include <glob...>` (optional): Files to include (can specify multiple patterns)
- `--ignore <glob...>` (optional): Files to ignore (can specify multiple patterns)

## Installation

While npx is recommended, you can also install globally:

```bash
npm install -g repo-prompt
```

Then use it as:

```bash
repo-prompt --repo <github-repo-url> [options]
```

## License

MIT © [ChenCheng](sorrycc@gmail.com)
