
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Bot } from 'lucide-react';

interface TranscriptionDisplayProps {
  transcript: string;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ transcript }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const parseTranscript = (text: string) => {
    if (!text) return [];
    
    // Split by speaker labels (mock parsing)
    const segments = text.split(/Developer [AB]:/);
    const speakers = text.match(/Developer [AB]:/g) || [];
    
    return segments.slice(1).map((segment, index) => ({
      speaker: speakers[index]?.replace(':', '') || 'Unknown',
      text: segment.trim(),
      timestamp: new Date().toLocaleTimeString()
    }));
  };

  const segments = parseTranscript(transcript);

  return (
    <div className="h-64">
      <ScrollArea className="h-full" ref={scrollRef}>
        <div className="space-y-3 p-2">
          {segments.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Transcription will appear here...</p>
              <p className="text-sm mt-1">Start recording to see live transcription</p>
            </div>
          ) : (
            segments.map((segment, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    segment.speaker === 'Developer A' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        segment.speaker === 'Developer A'
                          ? 'border-blue-500/50 text-blue-400'
                          : 'border-purple-500/50 text-purple-400'
                      }`}
                    >
                      {segment.speaker}
                    </Badge>
                    <span className="text-xs text-slate-500">{segment.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {segment.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
