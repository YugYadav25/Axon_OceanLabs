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
      const backendUrl = import.meta.env.VITE_AI_BACKEND_URL || `http://${window.location.hostname}:3002`;
      const res = await fetch(`${backendUrl}/api/session-summary`, {
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
    <div className="h-[calc(100vh-64px)] p-4 flex flex-col">
      <div className="w-full max-w-[1800px] mx-auto flex-1 flex flex-col h-full">
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

        {/* Main Workspace Grid (12 Columns) */}
        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 h-full mt-2">

          {/* LEFT SIDEBAR (Communication) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col min-h-0 h-full">
            <Card className="flex-1 p-4 bg-[#21262D] border-[#30363D] shadow-xl overflow-hidden flex flex-col">
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

          {/* CENTER CANVAS (Code Context & Summary) */}
          <div className="col-span-12 lg:col-span-6 flex flex-col min-h-0 h-full">
            <Card className="flex-1 flex flex-col p-5 bg-[#1B2027] border-[#30363D] shadow-lg shadow-black/20 overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl text-slate-100/90 font-medium tracking-wide">Repository Context</h2>
                </div>
              </div>
              {/* Context Panel automatically expands to fill height */}
              <div className="flex-1 min-h-0 overflow-y-auto mb-4">
                <CodeContextPanel codeMentions={codeMentions} repoUrl={repoUrl} />
              </div>

              {/* INTEGRATED BOTTOM AREA: Session Summary inside the center canvas */}
              <div className="shrink-0 pt-4 border-t border-slate-800">
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="flex w-full bg-[#111418] border border-slate-800 rounded-lg p-1">
                    <TabsTrigger value="summary" className="flex-1 text-slate-400 text-xs data-[state=active]:bg-[#21262D] data-[state=active]:text-white">Summary</TabsTrigger>
                    <TabsTrigger value="decisions" className="flex-1 text-slate-400 text-xs data-[state=active]:bg-[#21262D] data-[state=active]:text-white">Decisions</TabsTrigger>
                    <TabsTrigger value="references" className="flex-1 text-slate-400 text-xs data-[state=active]:bg-[#21262D] data-[state=active]:text-white">Code Refs</TabsTrigger>
                    <TabsTrigger value="transcript" className="flex-1 text-slate-400 text-xs data-[state=active]:bg-[#21262D] data-[state=active]:text-white">Transcript</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-3">
                    <div className="text-slate-300 min-h-[60px] max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {generatingSummary ? (
                        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Generating...</span></div>
                      ) : sessionSummary ? (
                        <p className="text-xs leading-relaxed">{sessionSummary.summary}</p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Session summary appears when session ends.</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="decisions" className="mt-3">
                    <div className="text-slate-300 min-h-[60px] max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {generatingSummary ? (
                        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Extracting...</span></div>
                      ) : sessionSummary ? (
                        <p className="text-xs leading-relaxed">{sessionSummary.decisions}</p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Key technical decisions tracked here.</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="references" className="mt-3">
                    <div className="text-slate-300 min-h-[60px] max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {generatingSummary ? (
                        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Processing...</span></div>
                      ) : sessionSummary ? (
                        <p className="text-xs leading-relaxed">{sessionSummary.references}</p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Code paths mentioned automatically captured.</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="transcript" className="mt-3">
                    <div className="text-slate-300 min-h-[60px] max-h-[140px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                      {generatingSummary ? (
                        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Finalizing...</span></div>
                      ) : sessionSummary ? (
                        sessionSummary.transcript.length > 0 ? (
                          sessionSummary.transcript.map((line, idx) => (
                            <p key={idx} className="text-xs leading-relaxed"><span className="text-[#2F89FF] opacity-80">{line.speaker}:</span> {line.text}</p>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">No audio recorded.</p>
                        )
                      ) : (
                        <p className="text-xs text-slate-500 italic">Voice transcript logs will appear here during active sessions.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </div>

          {/* RIGHT SIDEBAR (Gitzy AI) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col min-h-0 h-full">
            <Card className="flex-1 flex flex-col p-4 bg-[#21262D] border-[#30363D] shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 mb-4 shrink-0 border-b border-slate-800 pb-2">
                <Bot className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-semibold text-white">Gitzy AI</h2>
              </div>
              <AIAssistantChat
                transcript={transcript}
                codeMentions={codeMentions}
                repoUrl={repoUrl}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
