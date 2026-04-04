import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioCallManager, TranscriptLine } from './AudioCallManager';
import { CodeContextPanel } from './CodeContextPanel';
import { AIAssistantChat } from './AIAssistantChat';
import { SessionManager } from './SessionManager';
import { Code, Users, Bot, Loader2 } from 'lucide-react';
import { TwoPersonChat } from './DeveloperChat';

interface PairProgrammingAssistantProps {
  userId: string;
  userName: string;
  roomId: string;
  repoUrl: string;
}

interface SessionSummary {
  summary: string;
  decisions: string;
  references: string;
  transcript: TranscriptLine[];
}

export const PairProgrammingAssistant: React.FC<PairProgrammingAssistantProps> = ({
  userId,
  userName,
  roomId,
  repoUrl,
}) => {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [codeMentions, setCodeMentions] = useState<string[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Called by AudioCallManager on each final speech recognition result
  const handleTranscriptLineAdd = useCallback((line: TranscriptLine) => {
    setTranscriptLines(prev => [...prev, line]);
  }, []);

  const handleTranscriptUpdate = useCallback((text: string) => {
    setTranscript(text);
  }, []);

  const handleCodeMentions = useCallback((mentions: string[]) => {
    setCodeMentions(prev => {
      const combined = [...new Set([...prev, ...mentions])];
      return combined.slice(-20);
    });
  }, []);

  // Generate AI session summary when session stops
  const generateSessionSummary = async (lines: TranscriptLine[], chatText: string, chatMsgs: any[]) => {
    if (lines.length === 0 && chatMsgs.length === 0 && !chatText) {
      setSessionSummary({
        summary: 'No conversation or text chat recorded in this session.',
        decisions: 'No decisions captured.',
        references: 'No code references detected.',
        transcript: lines,
      });
      return;
    }

    setGeneratingSummary(true);
    const audioText = lines.map(l => `[Vocal] ${l.speaker} [${l.timestamp}]: ${l.text}`).join('\n');
    const textChat = chatMsgs.filter(m => m.senderId !== 'system').map(m => `[Text Chat] ${m.senderName} [${new Date(m.timestamp).toLocaleTimeString()}]: ${m.content}`).join('\n');
    
    const fullText = [audioText, textChat].filter(Boolean).join('\n\n');

    try {
      const res = await fetch(`${import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:3002'}/api/session-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullText, repoUrl }),
      });
      const data = await res.json();
      setSessionSummary({
        summary: data.summary || 'Could not generate summary.',
        decisions: data.decisions || 'No decisions extracted.',
        references: data.references || 'No code references found.',
        transcript: lines,
      });
    } catch {
      // Graceful fallback: show raw transcript
      setSessionSummary({
        summary: `Session had ${lines.length} voice messages. Manual review recommended.`,
        decisions: 'Could not auto-generate (AI unavailable).',
        references: codeMentions.length ? codeMentions.join(', ') : 'None detected.',
        transcript: lines,
      });
    }
    setGeneratingSummary(false);
  };

  const handleSessionChange = (sessionId: string | null) => {
    setActiveSession(sessionId);
    if (!sessionId) {
      // Session just stopped — generate summary from captured transcript
      generateSessionSummary(transcriptLines, transcript, chatMessages);
    } else {
      // Session started — reset everything
      setTranscript('');
      setTranscriptLines([]);
      setChatMessages([]);
      setCodeMentions([]);
      setSessionSummary(null);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent sub-head">
            AI Pair Programming Assistant
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Built-in audio calls for pair programming with real-time AI assistance.
            Get code context, transcription, and intelligent summaries during your development sessions.
          </p>
        </div>

        {/* Session Manager */}
        <div className="mb-6">
          <SessionManager activeSession={activeSession} onSessionChange={handleSessionChange} />
        </div>

        {/* Main 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — Audio Call + Developer Text Chat */}
          <div className="lg:col-span-1 space-y-0">
            <Card className="p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-semibold text-white">Chat</h2>
              </div>

              {/* ── Audio Call Controls (Feature #1 + #2) ── */}
              <AudioCallManager
                onTranscriptUpdate={handleTranscriptUpdate}
                onCodeMentionsDetected={handleCodeMentions}
                onTranscriptLineAdd={handleTranscriptLineAdd}
                sessionId={activeSession}
              />

              {/* Developer text chat */}
              <TwoPersonChat 
                roomId={roomId} 
                userId={userId} 
                userName={userName} 
                onMessageAdded={(msg) => setChatMessages(prev => [...prev, msg])}
              />
            </Card>
          </div>

          {/* MIDDLE — Code Context (Feature #3: real repoUrl) */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm h-full">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Code Context</h2>
              </div>
              <CodeContextPanel codeMentions={codeMentions} repoUrl={repoUrl} />
            </Card>
          </div>

          {/* RIGHT — Gitzy AI (Feature #5: repo-aware) */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm h-full">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-semibold text-white">Gitzy</h2>
              </div>
              <AIAssistantChat
                transcript={transcript}
                codeMentions={codeMentions}
                repoUrl={repoUrl}
              />
            </Card>
          </div>
        </div>

        {/* BOTTOM — Session Summary Tabs (Feature #4) */}
        <Card className="mt-6 p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-[#2A2E35]">
              <TabsTrigger value="summary" className="text-slate-300">Session Summary</TabsTrigger>
              <TabsTrigger value="decisions" className="text-slate-300">Decisions Made</TabsTrigger>
              <TabsTrigger value="references" className="text-slate-300">Code References</TabsTrigger>
              <TabsTrigger value="transcript" className="text-slate-300">Full Transcript</TabsTrigger>
            </TabsList>

            {/* SUMMARY */}
            <TabsContent value="summary" className="mt-4">
              <div className="text-slate-300 min-h-[80px]">
                <h3 className="font-semibold mb-2">AI-Generated Session Summary</h3>
                {generatingSummary ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating summary with AI…</span>
                  </div>
                ) : sessionSummary ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{sessionSummary.summary}</p>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    Comprehensive summary of your pair programming session will appear here after the session ends.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* DECISIONS */}
            <TabsContent value="decisions" className="mt-4">
              <div className="text-slate-300 min-h-[80px]">
                <h3 className="font-semibold mb-2">Technical Decisions</h3>
                {generatingSummary ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Extracting decisions…</span>
                  </div>
                ) : sessionSummary ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{sessionSummary.decisions}</p>
                ) : (
                  <p className="text-sm text-slate-500 italic">Key technical decisions and architectural changes will be tracked here.</p>
                )}
              </div>
            </TabsContent>

            {/* CODE REFERENCES */}
            <TabsContent value="references" className="mt-4">
              <div className="text-slate-300 min-h-[80px]">
                <h3 className="font-semibold mb-2">Code References</h3>
                {generatingSummary ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Extracting references…</span>
                  </div>
                ) : sessionSummary ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{sessionSummary.references}</p>
                ) : codeMentions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {codeMentions.map((m, i) => (
                      <span key={i} className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Code files, functions, and concepts mentioned will appear here during the session.</p>
                )}
              </div>
            </TabsContent>

            {/* FULL TRANSCRIPT */}
            <TabsContent value="transcript" className="mt-4">
              <div className="text-slate-300 min-h-[80px]">
                <h3 className="font-semibold mb-2">Complete Call Transcript</h3>
                {transcriptLines.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(sessionSummary?.transcript || transcriptLines).map((line, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-slate-500 shrink-0 font-mono text-xs mt-0.5">{line.timestamp}</span>
                        <span className="text-[#CAF5BB] font-medium shrink-0">{line.speaker}:</span>
                        <span className="text-slate-300 leading-relaxed">{line.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    Full conversation transcript with timestamps will appear here. Start an audio call to begin capturing.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
