const formatMERNOverviewHTML = (html) => {
  if (!html) return '';

  // === 1. Highlight file names like `Dashboard.jsx`
  html = html.replace(/`([A-Za-z0-9_\-]+\.(jsx?|tsx?|json|env|css|scss|html))`/g,
    '<code class="text-green-400 font-mono">$1</code>'
  );

  // === 2. Highlight function/variable names like `fetchGoals`
  html = html.replace(/`([a-zA-Z_][a-zA-Z0-9_]*)`/g,
    '<code class="text-blue-400 font-mono">$1</code>'
  );

  // === 3. Highlight and wrap project paths as headings (e.g., client\src\components)
  html = html.replace(/<h2>([^<\\\/]+[\\/][^<]+)<\/h2>/g,
    '<h3 class="text-xl font-bold text-purple-400 mt-6 mb-2 border-b border-gray-700 pb-1">$1</h3>'
  );

  // === 4. Wrap filenames inside <li><strong>...</strong> with consistent styling
  html = html.replace(/<li><strong>([^<]+)<\/strong>\s*<p>([\s\S]*?)<\/p>\s*}/g,
    `<li class="mb-4">
      <h4 class="text-lg font-semibold text-white">$1</h4>
      <div class="text-base text-gray-300 leading-relaxed">$2</div>
    </li>`
  );

  // === 5. Format subheadings inside file descriptions like ### Purpose and Role:
  html = html.replace(/###\s*(.*?):/g,
    '<h5 class="mt-3 mb-1 text-md font-semibold text-blue-400">$1</h5>'
  );

  // === 6. Convert numbered bold list items (1. **Title**: Description)
  html = html.replace(/(\d+)\.\s\*\*(.+?)\*\*:([\s\S]*?)(?=(\d+\. \*\*|<\/div>|<\/p>|$))/g,
    `<li class="mb-1"><strong class="text-white">$2:</strong> $3</li>`
  );

  // === 7. Wrap them inside <ul> if grouped
  html = html.replace(/((<li class="mb-1">[\s\S]*?<\/li>)+)/g,
    '<ul class="list-disc pl-5 mb-4">$1</ul>'
  );

  // === 8. Format "In summary" paragraphs
  html = html.replace(/In summary, (.*?)\./gi,
    '<p class="mt-2 text-gray-400"><strong>Summary:</strong> $1.</p>'
  );

  // === 9. Cleanup: Remove stray closing `}` if present
  html = html.replace(/\s*<\/p>\s*}\s*/g, '</p>');

  // === A. Handle plain text subheadings like "Purpose and Role"
html = html.replace(/(?:^|\n)([A-Z][a-zA-Z\s]+)\n(- \*\*.+?)(?=\n[A-Z]|\n\n|<\/p>|$)/g, 
  (_match, heading, bullets) => {
    return `
      <h5 class="mt-4 mb-2 text-base font-semibold text-blue-400">${heading.trim()}</h5>
      ${bullets}
    `;
  }
);

// === B. Format unordered list items with bold titles like - **Title**: text
html = html.replace(/- \*\*(.+?)\*\*: (.+?)(?=\n- |\n\n|<\/p>|$)/g,
  '<li class="mb-1"><strong class="text-white">$1:</strong> $2</li>'
);

// === C. Wrap multiple <li> into a <ul>
html = html.replace(/((<li class="mb-1">[\s\S]*?<\/li>)+)/g,
  '<ul class="list-disc pl-5 mb-4">$1</ul>'
);

  return html;
};



const DetailedOverview = ({ html }) => {
  if (!html) return null;

  const formatted = formatMERNOverviewHTML(html);

  return (
    <section className="mt-8 mr-10">
       <h3 className="text-2xl font-semibold mb-2 text-white"><span className="text-[#C2C2C2] font-medium">Detailed</span> Overview</h3>
      <p className="text-[#B3B3B3] mb-4">Explore the purpose and function of each file, with insights into structure, data flow, and component roles.

</p>
      <div className="bg-[#21262D] dark:bg-[#21262D] text-gray-100 rounded-xl p-8 shadow-sm">
        <div
          className="prose prose-invert max-w-none custom-html text-[1.05rem] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      </div>
    </section>
  );
};

export default DetailedOverview;
