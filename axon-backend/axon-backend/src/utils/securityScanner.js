const fs = require('fs');
const path = require('path');

// Configurations for directories to explicitly ignore
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);

// Filenames/Patterns that are strictly forbidden to commit
const DANGEROUS_FILES = [
  { regex: /^\.env(\..+)?$/, name: 'Environment Variables File' },
  { regex: /\.pem$/, name: 'Private Key (.pem)' },
  { regex: /^id_rsa$/, name: 'SSH Private Key (id_rsa)' },
  { regex: /\.map$/, name: 'Source Map File' }
];

// Regular expressions to catch hardcoded secrets
const SECRET_PATTERNS = [
  { regex: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
  { regex: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Access Token' },
  { regex: /sk_live_[a-zA-Z0-9]{24}/g, name: 'Stripe Live Secret Key' },
  { regex: /(?:password|client_secret|api_key)\s*=\s*['"](.{4,})['"]/gi, name: 'Hardcoded Generic Secret' }
];

/**
 * Perform offline security and secret scanning
 * @param {string} rootPath - The absolute path of the repository root
 * @returns {Array} - Array of structured security findings
 */
function scanRepository(rootPath) {
  const issues = [];

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      console.warn(`[SecurityScanner] Could not read directory: ${dir}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          walk(fullPath);
        }
      } else {
        // A) Filename-based Checks
        let isDangerousFile = false;
        for (const pattern of DANGEROUS_FILES) {
          if (pattern.regex.test(entry.name)) {
            issues.push({
              type: 'file',
              severity: 'CRITICAL',
              file: relPath,
              message: `Exposed ${pattern.name} found`
            });
            isDangerousFile = true;
            break;
          }
        }

        // B) Content-based Checks (Only perform if it's not a giant binary/map file to save speed)
        // Check text files or specifically source files
        if (!isDangerousFile && /\.(js|jsx|ts|tsx|py|json|yml|yaml|md|txt)$/.test(entry.name)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            for (const pattern of SECRET_PATTERNS) {
              const matches = content.match(pattern.regex);
              if (matches && matches.length > 0) {
                issues.push({
                  type: 'secret',
                  severity: 'CRITICAL',
                  file: relPath,
                  message: `Detected ${pattern.name} hardcoded in file`
                });
              }
            }
          } catch (err) {
            console.warn(`[SecurityScanner] Could not read file content: ${fullPath}`);
          }
        }
      }
    }
  }

  walk(rootPath);
  return issues;
}

module.exports = { scanRepository };
