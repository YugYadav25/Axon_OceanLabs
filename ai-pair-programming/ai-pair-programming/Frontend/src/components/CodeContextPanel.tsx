import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileCode, Loader2, Github, RefreshCcw, Code2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface CodeContextPanelProps {
  codeMentions: string[];
  repoUrl?: string;
}

export const CodeContextPanel: React.FC<CodeContextPanelProps> = ({ codeMentions, repoUrl }) => {
  const [markdownFromAI, setMarkdownFromAI] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzedRepo, setAnalyzedRepo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const analyzeRepo = async (url: string) => {
    setLoading(true);
    setMarkdownFromAI(null);
    try {
      const backendUrl = import.meta.env.VITE_AI_BACKEND_URL || `http://${window.location.hostname}:3002`;
      const response = await axios.post(
        `${backendUrl}/api/analyze-repo`,
        { repoUrl: url }
      );
      
      const markdown = response.data?.result?.results?.[0]?.ai_response?.text;
      if (markdown) {
        setMarkdownFromAI(markdown);
        setAnalyzedRepo(url);
      } else {
        setMarkdownFromAI('⚠️ Could not retrieve summary for this repository. Ensure it is public and valid.');
      }
    } catch (err) {
      console.error('Code context error:', err);
      setMarkdownFromAI('⚠️ Backend unavailable or cloning failed.');
    }
    setLoading(false);
  };

  // Auto-analyze when repoUrl is provided
  useEffect(() => {
    if (repoUrl && repoUrl.trim() && repoUrl !== analyzedRepo) {
      analyzeRepo(repoUrl);
    }
  }, [repoUrl]);

  // Scroll to bottom when new mentions arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [codeMentions]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-3">
      {/* Live code mentions from speech */}
      {codeMentions.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
            <Code2 className="w-3 h-3" /> Mentioned in session
          </p>
          <div className="flex flex-wrap gap-1.5">
            {codeMentions.map((m, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[11px] bg-blue-500/10 text-blue-300 border-blue-500/30 px-2 py-0.5"
              >
                {m}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Repo AI summary */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!repoUrl ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-6">
            <Github className="w-8 h-8 text-slate-600" />
            <div>
              <p className="text-sm text-slate-400 font-medium">No Repo Connected</p>
              <p className="text-xs text-slate-500 mt-1">
                Add a GitHub repo URL on the join screen to get an AI-powered code overview.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <div className="text-center">
              <p className="text-sm font-medium">Analyzing repository…</p>
              <p className="text-xs text-slate-500 mt-1 truncate max-w-[220px]">
                {repoUrl.replace('https://github.com/', '')}
              </p>
            </div>
          </div>
        ) : markdownFromAI ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-slate-400 truncate max-w-[180px]">
                  {repoUrl?.replace('https://github.com/', '')}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => analyzeRepo(repoUrl!)}
                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300"
                title="Re-analyze"
              >
                <RefreshCcw className="w-3 h-3" />
              </Button>
            </div>
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdownFromAI}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </div>
        ) : null}
      </div>
    </div>
  );
};
