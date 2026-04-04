
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Play, Square, Plus, Clock } from 'lucide-react';

interface SessionManagerProps {
  activeSession: string | null;
  onSessionChange: (sessionId: string | null) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ 
  activeSession, 
  onSessionChange 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [duration, setDuration] = useState(0);

  const startSession = () => {
    const sessionId = `session-${Date.now()}`;
    const name = sessionName || `Pair Session ${new Date().toLocaleTimeString()}`;
    onSessionChange(sessionId);
    setIsRecording(true);
    
    // Start timer
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    
    console.log(`Started session: ${name}`);
  };

  const stopSession = () => {
    setIsRecording(false);
    setDuration(0);
    onSessionChange(null);
    console.log('Session stopped');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4 bg-[#21262D] border-slate-700 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-mono">
              {formatDuration(duration)}
            </span>
          </div>
          
          {activeSession && (
            <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-700">
              Active Session
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isRecording ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Session name (optional)"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-48 bg-[#21262D] border-slate-600 text-white placeholder-slate-400"
              />
              <Button 
                onClick={startSession}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            </div>
          ) : (
            <Button 
              onClick={stopSession}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Session
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
