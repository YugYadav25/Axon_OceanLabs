const { callLLM } = require('./llmService');
const { getRepoStructure } = require('./repoService');
// Replace Supabase with Mongoose Models
const OnboardingSession = require('../models/OnboardingSession');
const RepoStructure = require('../models/RepoStructure');
const OnboardingOverview = require('../models/OnboardingOverview');

const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { ESLint } = require('eslint');
const sanitizeCode = require('../utils/sanitizeCode');
const { scanRepository } = require('../utils/securityScanner');

// Role-to-directory mappings
const roleDirs = {
  frontend: ['components', 'pages', 'styles'],
  backend: ['controllers', 'models', 'middleware', 'services']
};
const FLOWS = new Map(); 
const normalizePath = (p) => p.replace(/\\/g, '/');

// Start the onboarding flow
async function startFlow(userId, repoId) {
  const step0 = {
    stepId: 'choose-role',
    prompt: 'Welcome! Do you want to focus on frontend or backend?',
    options: ['frontend', 'backend']
  };
  const flow = { userId, repoId, role: null, history: [step0] };
  FLOWS.set(userId, flow);

  await OnboardingSession.findOneAndUpdate(
    { user_id: userId, repo_id: repoId },
    { $set: { flow } },
    { upsert: true, new: true }
  );

  return step0;
}

// Handle the next step in the flow
async function nextStep(userId, input) {
  let flow = FLOWS.get(userId);
  if (!flow) {
    const sessionDoc = await OnboardingSession.findOne({ user_id: userId });
    if (!sessionDoc || !sessionDoc.flow) throw new Error('No onboarding session found');
    flow = sessionDoc.flow;
    FLOWS.set(userId, flow);
  }

  const repoPath = path.join(os.tmpdir(), 'axon', flow.repoId);
  const last = flow.history[flow.history.length - 1];

  if (last.stepId === 'choose-role') {
    const role = input.trim().toLowerCase();
    if (!['frontend', 'backend'].includes(role)) {
      throw new Error('Invalid role selected');
    }
    flow.role = role;

    let structure;
    const cached = await RepoStructure.findOne({ repo_id: flow.repoId });
    if (cached && cached.structure) {
      structure = cached.structure;
    } else {
      structure = await getRepoStructure(flow.repoId);
      await RepoStructure.create({ repo_id: flow.repoId, structure });
    }

    const relevantModules = structure.filter((s) =>
      roleDirs[role].some((dir) => normalizePath(s.module).toLowerCase().includes(`/${dir.toLowerCase()}`))
    );

    const step1 = {
      stepId: 'show-overview-and-tasks',
      overviewId: null,
      tasks: []
    };

    flow.history.push(step1);
    
    await OnboardingSession.findOneAndUpdate(
      { user_id: userId, repo_id: flow.repoId },
      { $set: { flow } },
      { upsert: true }
    );

    return step1;
  }

  if (last.stepId === 'show-overview-and-tasks') {
    return {
      message: 'You’ve completed onboarding!',
      next: null
    };
  }

  throw new Error(`Unknown stepId: ${last.stepId}`);
}


async function generateDetailedOverview(modules, repoPath, role) {
  let html = `
<html><head><title>${role} Overview</title></head><body>
<h1>${role.charAt(0).toUpperCase() + role.slice(1)} Overview</h1>
<p>This section provides a concise breakdown of the ${role} modules.</p>
`;

  const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx'];
  const maxFilesPerModule = 8;

  for (const module of modules) {
    html += `<h2>${module.module}</h2><p>${module.desc}</p><ul>`;
    const allFiles = await fs.readdir(path.join(repoPath, module.module));
    const targetFiles = allFiles
      .filter(f => allowedExtensions.includes(path.extname(f)))
      .slice(0, maxFilesPerModule);

    for (const file of targetFiles) {
      const filePath = path.join(repoPath, module.module, file);
      const content = await fs.readFile(filePath, 'utf-8');

      if (content.length < 600) continue; // Skip trivial files

      // Create a smart heuristic summary instead of an expensive/slow LLM call
      let summary = '';
      if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        summary = `A React component handling UI logic. Review this to understand how the interface is structured.`;
      } else if (file.endsWith('.js') || file.endsWith('.ts')) {
        if (content.includes('express') || content.includes('router')) {
          summary = `An API route or controller. Review this for backend endpoints and HTTP request handling.`;
        } else if (content.includes('mongoose') || content.includes('Schema')) {
          summary = `A database model definition. Defines the schema and data structure.`;
        } else if (content.includes('process.env')) {
          summary = `A configuration file or setup script managing environment variables and app startup.`;
        } else {
          summary = `A utility or service file containing core logic. Contains helper functions or business logic used across modules.`;
        }
      } else {
        summary = `Configuration or data file.`;
      }
      
      // Auto-extract exported functions/classes to add dynamic context
      const exportedMatches = content.match(/export\s+(?:const|function|class|default)\s+([a-zA-Z0-9_]+)/g);
      if (exportedMatches && exportedMatches.length > 0) {
          const exportsList = exportedMatches.map(e => e.replace(/export\s+(const|function|class|default)\s+/, '')).slice(0, 3).join(', ');
          summary += ` Key exports: \`${exportsList}\`.`;
      }

      // Flag technical debt
      if (content.match(/TODO|FIXME/i)) {
          summary += ` ⚠️ Contains TODOs or FIXMEs.`;
      }

      html += `
<li><strong>${file}</strong>
<p>${summary}</p>
</li>`;
    }
    html += '</ul>';
  }
  html += '</body></html>';
  return html;
}

// Helper to detect frontend based on path or file type
function isFrontendModule(modulePath) {
  return modulePath.includes('client') || modulePath.includes('components') || modulePath.includes('jsx');
}

// Returns ESLint instance based on type
function getESLintInstance(isFrontend) {
  return new ESLint({
    cwd: process.cwd(),
    useEslintrc: false,
    overrideConfig: isFrontend
      ? {
          extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:jsx-a11y/recommended'],
          parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            ecmaFeatures: { jsx: true },
          },
          plugins: ['react', 'jsx-a11y'],
          settings: {
            react: { version: 'detect' },
          },
          env: { browser: true, node: true, es6: true },
        }
      : {
          extends: ['eslint:recommended'],
          parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
          env: { node: true, es6: true },
        },
  });
}

// Main task generator
async function generateCriticalTasks(modules, repoPath) {
  const tasks = [];

  // 1. Run Offline SAST Security Scanner first
  try {
    const securityIssues = scanRepository(repoPath);
    for (const issue of securityIssues) {
      tasks.push({
        title: `[SECURITY][CRITICAL] ${issue.type.toUpperCase()} LEAK in ${path.basename(issue.file)}`,
        description: issue.message,
        file: issue.file,
        line: 1, // Regex doesn't track exact lines easily in this fast mode, default to 1
        severity: 3, // CRITICAL (higher than warnings/errors)
        fileContent: [`// Please review ${issue.file} for leaked ${issue.message}`]
      });
    }
  } catch (err) {
    console.error('Security scan failed:', err);
  }

  // 2. Run standard ESLint Quality Audit
  for (const module of modules) {
    const normalizedModulePath = path.normalize(module.module);
    const dirPath = path.join(repoPath, normalizedModulePath);
    const isFrontend = isFrontendModule(normalizedModulePath);
    const eslint = getESLintInstance(isFrontend);

    const MAX_FILES_PER_MODULE = 2;

    try {
      const files = await fs.readdir(dirPath);
      const filePaths = files
        .filter((f) => f.endsWith('.js') || f.endsWith('.jsx'))
        .slice(0, MAX_FILES_PER_MODULE)
        .map((f) => path.join(dirPath, f));

      if (filePaths.length === 0) continue;

      const results = await eslint.lintFiles(filePaths);

      const MAX_TOTAL_ISSUES = 10;
      let issueCount = 0;

      for (const fileResult of results) {
        if (issueCount >= MAX_TOTAL_ISSUES) break;

        for (const issue of fileResult.messages.slice(0, 5)) {
          if (issueCount >= MAX_TOTAL_ISSUES) break;
         
          // Use ESLint's own highly-actionable message directly (saves LLM tokens and time!)
          const desc = issue.message;
          
          const fileText = await fs.readFile(fileResult.filePath, 'utf8');
          const fileLines = fileText.split('\n');

          tasks.push({
            title: `Fix ${path.basename(fileResult.filePath)}`,
            description: desc,
            file: fileResult.filePath,
            line: issue.line,
            severity: issue.severity,
            fileContent: fileLines,
          });

          issueCount++;
        }
      }
    } catch (err) {
      console.warn('Failed to lint files in:', dirPath, err.message);
    }
  }

  return tasks;
}

async function generateOverview(userId, repoId) {
  const sessionDoc = await OnboardingSession.findOne({ user_id: userId, repo_id: repoId });
    
  if (!sessionDoc || !sessionDoc.flow) {
    throw new Error('Session not founddddd');
  }

  const flow = sessionDoc.flow;
  const role = flow.role;
  const repoPath = path.join(os.tmpdir(), 'axon', repoId);

  const structure = await getRepoStructure(repoId);
  const relevantModules = structure.filter((s) =>
    roleDirs[role].some((dir) =>
      normalizePath(s.module).toLowerCase().includes(`/${dir.toLowerCase()}`)
    )
  );

  const overviewHtml = await generateDetailedOverview(relevantModules, repoPath, role);

  const ovDoc = await OnboardingOverview.create({
    user_id: userId,
    repo_id: repoId,
    role,
    html: overviewHtml
  });

  flow.history = flow.history.map((step) =>
    step.stepId === 'show-overview-and-tasks'
      ? { ...step, overviewId: ovDoc._id.toString() }
      : step
  );

  await OnboardingSession.findOneAndUpdate(
    { user_id: userId, repo_id: repoId },
    { $set: { flow } },
    { upsert: true }
  );

  FLOWS.set(userId, flow);
  return ovDoc._id.toString();
}

async function generateTasks(userId, repoId) {
  const sessionDoc = await OnboardingSession.findOne({ user_id: userId, repo_id: repoId });

  if (!sessionDoc || !sessionDoc.flow) {
    throw new Error('Session not found');
  }

  const flow = sessionDoc.flow;
  const role = flow.role;
  const repoPath = path.join(os.tmpdir(), 'axon', repoId);

  const structure = await getRepoStructure(repoId);
  const relevantModules = structure.filter((s) =>
    roleDirs[role].some((dir) =>
      normalizePath(s.module).toLowerCase().includes(`/${dir.toLowerCase()}`)
    )
  );

  const criticalTasks = await generateCriticalTasks(relevantModules, repoPath);

  flow.history = flow.history.map((step) =>
    step.stepId === 'show-overview-and-tasks'
      ? { ...step, tasks: criticalTasks }
      : step
  );

  await OnboardingSession.findOneAndUpdate(
    { user_id: userId, repo_id: repoId },
    { $set: { flow } },
    { upsert: true }
  );
    
  FLOWS.set(userId, flow);
  return true;
}

module.exports = {
  startFlow,
  nextStep,
  generateOverview,
  generateTasks
};
