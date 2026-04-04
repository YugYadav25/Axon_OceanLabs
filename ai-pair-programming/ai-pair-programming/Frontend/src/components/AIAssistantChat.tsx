

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string[];
}

interface AIAssistantChatProps {
  transcript: string;
  codeMentions: string[];
  repoUrl?: string;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({ 
  transcript, 
  codeMentions,
  repoUrl
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: repoUrl
        ? `Hi! I'm Gitzy, your AI pair programming assistant. I know about the repo **${repoUrl.replace('https://github.com/', '')}** and will use that context to help you. Ask me anything about the codebase!`
        : `Hi! I'm Gitzy, your AI pair programming assistant. I'll help explain code concepts and provide context during your session. Tip: add a GitHub repo URL on the join screen to make me repo-aware!`,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-suggest when new code mentions are detected
  useEffect(() => {
    if (codeMentions.length > 0 && transcript) {
      const latestMention = codeMentions[codeMentions.length - 1];
      if (latestMention && !messages.some(m => m.content.includes(latestMention))) {
        generateAutoSuggestion(latestMention);
      }
    }
  }, [codeMentions, transcript]);

  const generateAutoSuggestion = (mention: string) => {
    const suggestions = [
      `I noticed "${mention}" was mentioned. Would you like me to explain how it works?`,
      `I see you're discussing "${mention}". Should I provide some context about this?`,
      `"${mention}" came up in your conversation. Need clarification on this concept?`
    ];
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'assistant',
      content: suggestion,
      timestamp: new Date(),
      context: [mention]
    }]);
  };

  // Updated to use the Express backend
  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      context: codeMentions.slice(-2)
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:3002'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          codeMentions: codeMentions.slice(-2),
          repoUrl: repoUrl || null,
          transcript: transcript ? transcript.slice(-400) : null,
        })
      });
      const aiMessage = await response.json();
      setMessages(prev => [...prev, {
        ...aiMessage,
        timestamp: new Date(aiMessage.timestamp)
      }]);
    } catch (error) {
      console.error('Error:', error);
      // Optionally, add an error message to the chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col">
      <ScrollArea className="flex-1 mb-4" ref={scrollRef}>
        <div className="space-y-4 p-2">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${
              message.type === 'user' ? 'flex-row-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-[85%] rounded-lg p-3 prose prose-invert prose-sm max-w-none ${
                  message.type === 'user'
                    ? 'bg-[#21262D] text-blue-100 border border-blue-500/30'
                    : 'bg-[#21262D] text-slate-200 border border-slate-600/50'
                }`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                  
                  {message.context && message.context.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Lightbulb className="w-3 h-3 text-orange-400 mt-0.5" />
                      {message.context.map((ctx, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                          {ctx}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg- text-purple-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#21262D] rounded-lg p-3 border border-slate-600/50">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about code, concepts, or request explanations..."
          className="flex-1 bg-[#21262D] border-slate-600 text-white placeholder-slate-400"
          disabled={isLoading}
        />
        <Button 
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};




