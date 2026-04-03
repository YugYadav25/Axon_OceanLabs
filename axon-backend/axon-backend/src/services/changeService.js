const CommitModel = require('../models/Commit');

// ─── Conventional Commit Classifier ────────────────────────────────────────
// Industry standard: https://www.conventionalcommits.org/en/v1.0.0/
// Used by: Angular, Vue, React, VSCode, and virtually every major OSS project.
//
// Categories map directly to what the frontend expects.
const CATEGORY_RULES = [
  {
    category: 'New Features',
    patterns: [/^feat(\(.+\))?[!]?:/, /\badd(ed|ing)?\b.*(feature|support|capability)/i, /\bimplement(ed|ing)?\b/i, /\bnew\b.*(api|endpoint|component|page|screen)/i]
  },
  {
    category: 'Refactors',
    patterns: [/^refactor(\(.+\))?:/, /\brefactor(ed|ing)?\b/i, /\bclean(ed|ing)?\s*up\b/i, /\brestructure/i, /\bmove(d)?\b.*(to|into)\b/i, /\brename(d)?\b/i]
  },
  {
    category: 'Fixes & Performance',
    patterns: [/^fix(\(.+\))?[!]?:/, /^perf(\(.+\))?:/, /\bfix(ed|ing|es)?\b/i, /\bbug\b/i, /\bpatch\b/i, /\bperformance\b/i, /\boptimize(d)?\b/i, /\bspeed\b/i, /\bhotfix\b/i, /^revert:/i]
  },
  {
    category: 'Testing',
    patterns: [/^test(\(.+\))?:/, /\btest(s|ed|ing)?\b/i, /\bspec\b/i, /\be2e\b/i, /\bunit\s*test/i]
  },
  {
    category: 'Documentation',
    patterns: [/^docs(\(.+\))?:/, /\bdoc(s|umentation)?\b/i, /\breadme\b/i, /\bchangelog\b/i, /\bcomment(s|ed)?\b/i]
  }
];

/**
 * Classify a single commit message into one of the 5 categories.
 * Falls back to 'Refactors' for unclassified commits (catch-all bucket).
 * @param {string} message
 * @returns {string} category name
 */
function classifyCommit(message) {
  const lower = message.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(lower) || pattern.test(message)) {
        return rule.category;
      }
    }
  }
  // Unclassified commits default to 'Refactors' – aligns with industry practice
  // (Linear, GitHub Release Drafter use this as the catch-all bucket)
  return 'Refactors';
}

/**
 * Strip conventional commit prefix from a message for cleaner display.
 * e.g. "feat(auth): add login page" → "add login page"
 * @param {string} message
 * @returns {string}
 */
function cleanMessage(message) {
  return message.replace(/^(feat|fix|refactor|perf|test|docs|chore|style|ci|build)(\(.+\))?[!]?:\s*/i, '').trim();
}

/**
 * Main: Summarize recent commit changes for a repo since a given date.
 * Fully offline, zero-API. Uses conventional commit heuristics.
 *
 * @param {string} repoId
 * @param {Date} sinceDate
 * @returns {{ summary: Object, rawText: string, commitCount: number }}
 */
async function summarizeChanges(repoId, sinceDate) {

  // 1. Fetch all commits from MongoDB that are newer than `sinceDate`
  const recentCommits = await CommitModel.find({
    repoId,
    date: { $gt: sinceDate }
  }).sort({ date: -1 }); // newest first

  if (recentCommits.length === 0) {
    return {
      summary: {},
      rawText: 'No new changes since last scan.',
      commitCount: 0
    };
  }

  // 2. Build the structured summary object keyed by category
  // Each category holds an array of change entries matching the frontend schema:
  //   { author, files, type, description }
  const summary = {
    'New Features': [],
    'Refactors': [],
    'Fixes & Performance': [],
    'Testing': [],
    'Documentation': []
  };

  for (const commit of recentCommits) {
    const category = classifyCommit(commit.message);
    const description = cleanMessage(commit.message);

    // Limit files shown per commit entry (keeps UI clean; industry default = 10)
    const files = (commit.filesChanged || []).slice(0, 10);

    summary[category].push({
      author: commit.author || 'Unknown',
      files,
      type: category.toLowerCase().replace(/\s+/g, '_'),
      description,
      date: commit.date,
      sha: commit.sha.slice(0, 7) // Short SHA like GitHub shows
    });
  }

  // 3. Build a plain-text digest (useful for debugging and logging)
  const rawText = recentCommits
    .map(c => `- [${classifyCommit(c.message)}] ${c.message} (by ${c.author}, ${c.sha.slice(0, 7)})`)
    .join('\n');

  console.log(`[ChangeService] Classified ${recentCommits.length} commits for ${repoId} since ${sinceDate.toDateString()}`);

  return {
    summary,
    rawText,
    commitCount: recentCommits.length
  };
}

module.exports = { summarizeChanges };
