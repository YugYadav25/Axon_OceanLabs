
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  onCodeMentionsDetected: (mentions: string[]) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onTranscriptUpdate,
  onCodeMentionsDetected 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        processAudio(audioBlob);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Mock audio level simulation
      const levelInterval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);

      toast({
        title: "Recording Started",
        description: "AI is now listening to your conversation.",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setAudioLevel(0);
      
      toast({
        title: "Recording Stopped",
        description: "Processing audio for transcription...",
      });
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    // Mock transcription - in real implementation, this would call Whisper API
    const mockTranscript = "Developer A: Hey, can you show me the debounce function in utils.js? I'm not sure how it works with the async calls. Developer B: Sure, let me explain the implementation. It's using a closure to maintain state...";
    
    // Mock code mentions detection
    const mentions = ['utils.js', 'debounce function', 'async calls', 'closure'];
    
    setTimeout(() => {
      onTranscriptUpdate(mockTranscript);
      onCodeMentionsDetected(mentions);
      
      toast({
        title: "Transcription Complete",
        description: "Found code mentions and updated context.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        <Button 
          onClick={isRecording ? stopRecording : startRecording}
          size="lg"
          className={`w-full h-12 transition-all duration-200 ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-5 h-5 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </>
          )}
        </Button>

        {isRecording && (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Audio Level</span>
              <span>{Math.round(audioLevel)}%</span>
            </div>
            <Progress 
              value={audioLevel} 
              className="w-full h-2 bg-slate-700"
            />
            <div className="flex items-center justify-center gap-2 text-red-400">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Recording in progress...</span>
            </div>
          </div>
        )}
      </div>

      <Alert className="bg-slate-700/50 border-slate-600">
        <Upload className="h-4 w-4" />
        <AlertDescription className="text-slate-300">
          You can also upload existing audio files for analysis (MP3, WAV, M4A supported)
        </AlertDescription>
      </Alert>
    </div>
  );
};
