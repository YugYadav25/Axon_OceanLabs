
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioCallManager } from './AudioCallManager';
import { TranscriptionDisplay } from './TranscriptionDisplay';
import { CodeContextPanel } from './CodeContextPanel';
import { AIAssistantChat } from './AIAssistantChat';
import { SessionManager } from './SessionManager';
import { Phone, Code, MessageSquare, Users, FileText, Bot } from 'lucide-react';
import { TwoPersonChat } from './DeveloperChat';

interface PairProgrammingAssistantProps {
  userId: string
  userName: string
  roomId: string
}

export const PairProgrammingAssistant: React.FC<PairProgrammingAssistantProps> = ({ userId, userName, roomId }) => {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [codeMentions, setCodeMentions] = useState<string[]>([]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold  mb-4 bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent sub-head">
            AI Pair Programming Assistant
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Built-in audio calls for pair programming with real-time AI assistance. 
            Get code context, transcription, and intelligent summaries during your development sessions.
          </p>
        </div>

        {/* Session Manager */}
        <div className="mb-6">
          <SessionManager 
            activeSession={activeSession} 
            onSessionChange={setActiveSession} 
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Audio Call & Transcription */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm h-full">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-semibold text-white">Chat</h2>
              </div>
              <TwoPersonChat roomId={roomId} userId={userId} userName={userName}/>
            </Card>
          </div>

          {/* Middle Column - Code Context */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm h-full">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Code Context</h2>
              </div>
              <CodeContextPanel codeMentions={codeMentions} />
            </Card>
          </div>

          {/* Right Column - AI Assistant */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm h-full">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-semibold text-white">Gitzy</h2>
              </div>
              <AIAssistantChat 
                transcript={transcript}
                codeMentions={codeMentions}
              />
            </Card>
          </div>
        </div>

        {/* Bottom Section - Session Summary */}
        <Card className="mt-6 p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-[#2A2E35]">
              <TabsTrigger value="summary" className="text-slate-300">Session Summary</TabsTrigger>
              <TabsTrigger value="decisions" className="text-slate-300">Decisions Made</TabsTrigger>
              <TabsTrigger value="references" className="text-slate-300">Code References</TabsTrigger>
              <TabsTrigger value="transcript" className="text-slate-300">Full Transcript</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-4">
              <div className="text-slate-300">
                <h3 className="font-semibold mb-2">AI-Generated Session Summary</h3>
                <p>Comprehensive summary of your pair programming session will appear here after the call...</p>
              </div>
            </TabsContent>
            <TabsContent value="decisions" className="mt-4">
              <div className="text-slate-300">
                <h3 className="font-semibold mb-2">Technical Decisions</h3>
                <p>Key technical decisions and architectural changes will be tracked here...</p>
              </div>
            </TabsContent>
            <TabsContent value="references" className="mt-4">
              <div className="text-slate-300">
                <h3 className="font-semibold mb-2">Code References</h3>
                <p>All mentioned code files, functions, and concepts will be catalogued here...</p>
              </div>
            </TabsContent>
            <TabsContent value="transcript" className="mt-4">
              <div className="text-slate-300">
                <h3 className="font-semibold mb-2">Complete Call Transcript</h3>
                <p>Full conversation transcript with timestamps and speaker identification...</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
