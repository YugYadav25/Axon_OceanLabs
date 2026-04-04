import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, FileCode, Code2, Variable } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollAreaCorner } from '@radix-ui/react-scroll-area';
import axios from "axios";

interface CodeContextPanelProps {
  codeMentions: string[];
}

interface CodeReference {
  type: 'file' | 'function' | 'variable';
  name: string;
  location: string;
  description: string;
  snippet?: string;
}

export const CodeContextPanel: React.FC<CodeContextPanelProps> = ({ codeMentions }) => {
  const [selectedReference, setSelectedReference] = useState<CodeReference | null>(null);
  const [aiExplanation, setAIExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markdownFromAI, setMarkdownFromAI] = useState<string | null>(null);
  const scrollref = useRef<HTMLDivElement>(null);

  const codeReferences: CodeReference[] = codeMentions.map(mention => {
    if (mention.includes('.js') || mention.includes('.ts')) {
      return {
        type: 'file',
        name: mention,
        location: `src/utils/${mention}`,
        description: 'Utility functions for common operations',
        snippet: `// ${mention}\nexport const debounce = (func, delay) => {\n  let timeoutId;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => func.apply(null, args), delay);\n  };\n};`
      };
    } else if (mention.includes('function')) {
      return {
        type: 'function',
        name: mention,
        location: 'src/utils/utils.js',
        description: 'Delays function execution until after specified time',
        snippet: `const debounce = (func, delay) => {\n  let timeoutId;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => func.apply(null, args), delay);\n  };\n};`
      };
    } else {
      return {
        type: 'variable',
        name: mention,
        location: 'Multiple locations',
        description: 'Referenced in the current discussion',
      };
    }
  });

  const getIcon = (type: CodeReference['type']) => {
    switch (type) {
      case 'file': return <FileCode className="w-4 h-4" />;
      case 'function': return <Code2 className="w-4 h-4" />;
      case 'variable': return <Variable className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: CodeReference['type']) => {
    switch (type) {
      case 'file': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'function': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'variable': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    }
  };

  useEffect(() => {
  const simulateAPICall = async () => {
  try {
    const response = await axios.post('https://axon.onrender.com/api/analyze-repo', {
    repoUrl: "https://github.com/shiv07-blip/Weather-Application.git"
    });

    const markdown = response.data.result.results[0].ai_response.text;

    setMarkdownFromAI(markdown);
  } catch (err) {
    console.error("API call failed:", err);
    setMarkdownFromAI('⚠️ Error loading markdown content.');
  }
};

    simulateAPICall();
  }, []);

  return (
    <div className="h-96 flex flex-col">
     

      {codeReferences.length === 0 ? (
        <>
        {markdownFromAI && (
          <ScrollArea className='flex-1 mb-4 ' ref={scrollref}> 

            <div className="bg-[#2A2E35] rounded p-4 mt-4 text-slate-200 text-sm prose prose-invert w-full min-h-[200px" >
                <ReactMarkdown  remarkPlugins={[remarkGfm]}>
                  {markdownFromAI}
                </ReactMarkdown>
              </div>
          </ScrollArea>


             
            )}

        
        </>
      ) : (
        <div className="flex-1 flex gap-4 ">
          <div className="w-1/2">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {codeReferences.map((ref, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`w-full justify-start p-3 h-auto ${
                      selectedReference === ref 
                        ? 'bg- border border-slate-600' 
                        : 'hover:bg-slate-700/30'
                    }`}
                    onClick={() => {
                      setSelectedReference(ref);
                      setAIExplanation(null); // Clear previous AI result
                    }}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`p-1 rounded ${getTypeColor(ref.type)}`}>
                        {getIcon(ref.type)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-white truncate">
                          {ref.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {ref.location}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator orientation="vertical" className="bg-slate-600" />

          <div className="w-1/2 overflow-y-auto pr-2">
            {selectedReference ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getTypeColor(selectedReference.type)}>
                      {selectedReference.type}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-white">{selectedReference.name}</h3>
                  <p className="text-sm text-slate-400">{selectedReference.location}</p>
                </div>

                <p className="text-sm text-slate-300">{selectedReference.description}</p>

                {selectedReference.snippet && (
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-2">Code Preview:</p>
                    <pre className="text-xs text-slate-300 overflow-x-auto">
                      <code>{selectedReference.snippet}</code>
                    </pre>
                  </div>
                )}

                <Button
                  size="sm"
                  disabled
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 cursor-not-allowed"
                >
                  Explain in Chat (Simulated)
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p className="text-sm">Select a reference to view details</p>
              </div>
            )}

            
          </div>
        </div>
      )}
    </div>
  );
};

