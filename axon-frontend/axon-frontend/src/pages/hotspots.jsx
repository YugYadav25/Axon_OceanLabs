import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import MainLayout from '../components/common/MainLayout';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Icon } from '@iconify-icon/react';

// ...imports unchanged

export default function Hotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [complexityRange, setComplexityRange] = useState([0, 50]);
  const [folders, setFolders] = useState([]);
  const [activeFolders, setActiveFolders] = useState([]);

  const { repoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const incomingUser = location.state?.user;
    if (!incomingUser || !repoId) navigate('/selectrepo');
    setUser(incomingUser);
  }, []);

  useEffect(() => {
    if (!repoId) return;
    fetchHotspots();
  }, [repoId]);

  const extractRelativeFolder = (filePath) => {
    const match = filePath.split(/src[\\/]/)[1];
    if (!match) return null;
    const parts = match.split(/[\\/]/).slice(0, -1); // folders only, no filename
    return parts.length ? `src/${parts.join('/')}` : null;
  };

  const extractRelativeFile = (filePath) => {
    const match = filePath.split(/src[\\/]/)[1];
    return match ? `src/${match.replace(/\\/g, '/')}` : filePath;
  };

  const fetchHotspots = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/docs/hotspots/${encodeURIComponent(repoId)}`);
      const data = await res.json();
      setHotspots(data.hotspots);

      const maxComplexity = Math.max(...data.hotspots.map(h => h.complexity));
      setComplexityRange([0, maxComplexity]);

      const uniqueFolders = [
        ...new Set(
          data.hotspots
            .map(h => extractRelativeFolder(h.filePath))
            .filter(Boolean)
        )
      ];
      setFolders(uniqueFolders);
      setActiveFolders(uniqueFolders);
    } catch (err) {
      console.error('Hotspots fetch error:', err);
    }
  };

  const fetchSuggestions = async (nodeId) => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/docs/hotspots/${encodeURIComponent(repoId)}/${encodeURIComponent(nodeId)}/suggestions`);
      const data = await res.json();
      if (data.success) setSuggestions(data.suggestions);
      else setSuggestions('No suggestions found.');
      setSelectedNode(hotspots.find(h => h.nodeId === nodeId));
    } catch {
      setSuggestions('Error fetching suggestions.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const filteredHotspots = hotspots.filter(h => {
    const folder = extractRelativeFolder(h.filePath);
    return h.complexity <= complexityRange[1] && activeFolders.includes(folder);
  });

  return (
    <MainLayout user={user} repoId={repoId}>
  <div className={`p-20 pl-28 pt-28 ${loadingSuggestions ? 'blur-sm' : ''}`}>

    {/* Page Heading */}
    <h3 className="text-3xl font-semibold text-white mb-2">
      <span className="text-[#C2C2C2] font-medium">Technical Debt</span> Hotspots
    </h3>
    <p className="text-l text-[#D6D6D6] mb-10">Prioritize high-impact areas for refactoring.</p>

    {/* Content Area: Filters + Hotspot Cards */}
    <div className="flex gap-8">
      {/* Filters - vertical, fixed height */}
      <div className="w-64 text-white">
        <h4 className="text-sm font-normal mb-4">Filters</h4>
        <p className="w-64 text-white text-xs">Found {filteredHotspots.length} results from repository</p>

         <div className="border-b border-[#333A44] mb-6 mt-2"></div>

       <div className="mb-6">
          <label className="block mb-2 text-sm text-[#A7A5A5] font-medium">
            Complexity ≤ {complexityRange[1]}
          </label>
          <input
            type="range"
            min={0}
            max={Math.max(...hotspots.map(h => h.complexity), 50)}
            value={complexityRange[1]}
            onChange={e => setComplexityRange([0, +e.target.value])}
            className="w-full h-1 rounded-lg appearance-none bg-[#2F89FF] accent-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex justify-between text-xs text-blue-400 mt-1">
            {[0, 50].map(n => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>

             <div className="border-b border-[#333A44] mb-6 mt-2"></div>

        <div>
          <label className="block mb-2 text-sm">Folders</label>
          <div className="max-h-60 overflow-y-auto pr-2">
            {folders.map(folder => (
              <div key={folder} className="mb-2">
                <input
                  type="checkbox"
                  checked={activeFolders.includes(folder)}
                  onChange={() => {
                    setActiveFolders(prev =>
                      prev.includes(folder)
                        ? prev.filter(f => f !== folder)
                        : [...prev, folder]
                    );
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">{folder.split('/').slice(-1)[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hotspot Cards Section */}
      <div className="flex-1 space-y-4">
        <div className='flex justify-end gap-5'>
              <div className='flex flex-row justify-between items-center gap-2'>
                <div
                  className={"w-2.5 h-2.5 rounded-full bg-[#CAF5BB]" }
                />

                <p className='text-xs text-white'>Complexity</p>
                </div>

                <div className='flex flex-row justify-between items-center gap-2'>
                <div
                  className={"w-2.5 h-2.5 rounded-full bg-[#E45454]" }
                />

                <p className='text-xs text-white'>Debt Score</p>
                </div>

        </div>
       
        {filteredHotspots.map(h => (
          <div
            key={h.nodeId}
            className="bg-[#21262D] border border-zinc-700 rounded-xl px-5 py-3 shadow-md hover:shadow-lg transition-shadow duration-200 text-white"
          >
            <div className="flex flex-row justify-between items-center">
             
                <div>
                  <h4 className="text-l font-semibold mb-1">
                  Function: {h.nodeId.split("::")[1]}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">
                    {h.filePath.replace(/^.*?\\axon\\[^\\]+\\/, '')}
                  </p>
                </div>
                
                <div className='flex flex-row items-center justify-end gap-6'>
                  
                <div className="flex gap-2 text-sm">
                  <span> 
                    <span className={"ml-1 px-3 py-1 rounded-full text-xs font-semibold border bg-[#CAF5BB]/20 border-[#CAF5BB] text-[#CAF5BB]"}>
                      {h.complexity}
                    </span>
                    
                    </span>
                  <span>
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                      h.debtScore >= 0.7
                        ? 'text-red-300 border-red-300'
                        : h.debtScore >= 0.3
                        ? 'text-yellow-200 border-yellow-200'
                        : 'text-green-300 border-green-300'
                    }`}>
                      {h.debtScore.toFixed(2)}
                    </span>
                  </span>
                </div>
             
              <div>
                <button
                  onClick={() => fetchSuggestions(h.nodeId)}
                  className="border bg-[#5E5E5E]/22 border-[#6B6B6B] text-white px-4 py-2 text-xs rounded-[50px] flex flex-row items-center gap-2 justify-center hover:bg-[#5E5E5E]/30 transition-colors duration-200 hover:shadow-lg"
                >
                  <div
                      className="w-6 h-6"
                      style={{
                        background: 'linear-gradient(90deg, #CAF5BB, #2F89FF)',
                        WebkitMaskImage: 'url("https://api.iconify.design/fluent:sparkle-24-filled.svg")',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskSize: 'contain',
                        maskImage: 'url("https://api.iconify.design/fluent:sparkle-24-filled.svg")',
                        maskRepeat: 'no-repeat',
                        maskSize: 'contain'
                      }}
                    />

                  <p>Get Suggestions</p>
                </button>
              </div>
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

        {loadingSuggestions && (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-400 border-solid"></div>
  </div>
)}

  {/* Suggestion Side Panel (unchanged) */}
 {suggestions && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-end z-50">
    <div className="w-[800px] bg-[#21262D] p-10 overflow-y-auto border-l border-[#E4E4E4]/25">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2F89FF]">
          {selectedNode?.nodeId.split("::")[1]}
        </h2>
        <button
          onClick={() => setSuggestions(null)}
          className="text-red-400 text-sm hover:underline"
        >
          <Icon icon="mynaui:panel-left-close-solid" width="24" height="24" />
        </button>
      </div>

      <h4 className="text-lg font-semibold mb-4 text-white">
        Refactoring Suggestions
      </h4>

      <div className="bg-[#1B2027] rounded-xl p-8 shadow-md relative text-sm text-gray-200 leading-relaxed">
        <div className="absolute left-0 top-12 bottom-12 w-1 bg-blue-400 rounded-full"></div>
        {loadingSuggestions ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
         <ReactMarkdown
  children={suggestions}
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ node, ...props }) => (
      <h1
        className="text-3xl font-extrabold text-blue-400 mt-8 mb-4 border-b border-blue-500 pb-2"
        {...props}
      />
    ),
    h2: ({ node, ...props }) => (
      <h2
        className="text-2xl font-bold text-blue-300 mt-6 mb-3 border-b border-blue-400 pb-1"
        {...props}
      />
    ),
    h3: ({ node, ...props }) => (
      <h3
        className="text-xl font-semibold text-blue-200 mt-4 mb-2"
        {...props}
      />
    ),
    h4: ({ node, ...props }) => (
      <h4
        className="text-lg font-medium text-blue-100 mt-3 mb-2"
        {...props}
      />
    ),
    p: ({ node, ...props }) => (
      <p className="mb-4 text-gray-200 whitespace-pre-wrap leading-relaxed" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc pl-6 mb-3 text-gray-300 space-y-1" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal pl-6 mb-3 text-gray-300 space-y-1" {...props} />
    ),
    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      if (!inline && match) {
        return (
          <div className="my-6">
            <SyntaxHighlighter
              language={match[1]}
              style={vscDarkPlus}
              PreTag="div"
              customStyle={{
                background: "rgba(97, 97, 97, 0.22)",
                borderRadius: "0.5rem",
                padding: "1rem",
                fontSize: "1rem",
                lineHeight: "1.4",
              }}
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          </div>
        );
      } else {
        // Skip inline code to avoid wrapping simple names like `file.js`
        return <>{children}</>;
      }
    },
  }}
/>

        )}
      </div>
    </div>
  </div>
)}

</MainLayout>


  );
}
