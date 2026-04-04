import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

interface AudioCallManagerProps {
  onTranscriptUpdate: (transcript: string) => void;
  onCodeMentionsDetected: (mentions: string[]) => void;
  onTranscriptLineAdd: (line: TranscriptLine) => void;
  sessionId: string | null;
}

export interface TranscriptLine {
  speaker: string;
  text: string;
  timestamp: string;
}

// Extend the Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Patterns to extract code-related mentions from speech
const extractCodeMentions = (text: string): string[] => {
  const found = new Set<string>();
  // File names: e.g. utils.js, auth.ts, App.tsx
  const filePattern = /\b[\w-]+\.(js|ts|jsx|tsx|py|java|css|html|json)\b/gi;
  // camelCase / PascalCase identifiers likely to be functions/components
  const camelPattern = /\b[a-z]+[A-Z][a-zA-Z0-9]+\b/g;
  // Common keywords
  const keywordPattern = /\b(function|component|hook|api|route|endpoint|service|model|controller|middleware|database|schema|query|async|await|promise|useState|useEffect|fetch|axios)\b/gi;

  const fm = text.match(filePattern) || [];
  const cm = text.match(camelPattern) || [];
  const km = text.match(keywordPattern) || [];
  [...fm, ...cm, ...km].forEach(m => found.add(m));
  return Array.from(found).slice(0, 10);
};

export const AudioCallManager: React.FC<AudioCallManagerProps> = ({
  onTranscriptUpdate,
  onCodeMentionsDetected,
  onTranscriptLineAdd,
  sessionId,
}) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [callId, setCallId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveInterim, setLiveInterim] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const myPeerId = useRef(Math.random().toString(36).substring(2, 15));
  const fullTranscriptRef = useRef<string[]>([]);

  // Initialize socket
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_AI_BACKEND_URL || `http://${window.location.hostname}:3002`;
    const s = io(backendUrl);
    socketRef.current = s;

    s.on('offer', async (peerId: string, offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      s.emit('answer', callId, myPeerId.current, answer);
    });

    s.on('answer', async (peerId: string, answer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;
      if (peerConnectionRef.current.signalingState === 'have-local-offer') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    s.on('ice-candidate', async (peerId: string, candidate: RTCIceCandidateInit) => {
      if (!peerConnectionRef.current || !candidate) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('ICE candidate error:', e);
      }
    });

    s.on('user-joined', async () => {
      if (!peerConnectionRef.current || !localStreamRef.current) return;
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      s.emit('offer', callId, myPeerId.current, offer);
    });

    s.on('room-full', () => {
      toast({ title: 'Room Full', description: 'This room already has two participants.', variant: 'destructive' });
    });

    return () => { s.disconnect(); };
  }, []);

  // ── Web Speech API ───────────────────────────────────────────────
  const startSpeechRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast({ title: 'Speech Not Supported', description: 'Use Chrome or Edge for live transcription.', variant: 'destructive' });
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const finalText = result[0].transcript.trim();
          if (finalText) {
            const line: TranscriptLine = {
              speaker: 'You',
              text: finalText,
              timestamp: new Date().toLocaleTimeString(),
            };
            fullTranscriptRef.current.push(`You: ${finalText}`);
            onTranscriptUpdate(fullTranscriptRef.current.join('\n'));
            onTranscriptLineAdd(line);
            const mentions = extractCodeMentions(finalText);
            if (mentions.length) onCodeMentionsDetected(mentions);
          }
        } else {
          interim += result[0].transcript;
        }
      }
      setLiveInterim(interim);
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    rec.onend = () => {
      // Auto-restart if still in call
      if (isInCall) {
        try { rec.start(); } catch (_) {}
      } else {
        setIsListening(false);
        setLiveInterim('');
      }
    };

    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  }, [isInCall, onCodeMentionsDetected, onTranscriptLineAdd, onTranscriptUpdate]);

  const stopSpeechRecognition = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setLiveInterim('');
  };

  // ── WebRTC ───────────────────────────────────────────────────────
  const initPeerConnection = (cId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = e => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', cId, myPeerId.current, e.candidate);
      }
    };

    pc.ontrack = e => {
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = document.createElement('audio');
        remoteAudioRef.current.autoplay = true;
        document.body.appendChild(remoteAudioRef.current);
      }
      remoteAudioRef.current.srcObject = e.streams[0];
      toast({ title: 'Partner Connected', description: 'You can now hear your pair partner.' });
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      const newCallId = Math.random().toString(36).substring(2, 15);
      setCallId(newCallId);
      const pc = initPeerConnection(newCallId);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      setIsInCall(true);
      setIsConnecting(false);
      socketRef.current?.emit('join-room', newCallId, myPeerId.current);
      startSpeechRecognition();
      toast({ title: 'Call Started', description: `Call ID: ${newCallId} — share with your partner.` });
    } catch {
      setIsConnecting(false);
      toast({ title: 'Call Error', description: 'Could not start call. Check microphone permissions.', variant: 'destructive' });
    }
  };

  const joinCall = async (joinId: string) => {
    if (!joinId.trim()) return;
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setCallId(joinId);
      const pc = initPeerConnection(joinId);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      setIsInCall(true);
      setIsConnecting(false);
      socketRef.current?.emit('join-room', joinId, myPeerId.current);
      startSpeechRecognition();
      toast({ title: 'Joined Call', description: `Connected to call: ${joinId}` });
    } catch {
      setIsConnecting(false);
      toast({ title: 'Join Error', description: 'Could not join call. Check microphone permissions.', variant: 'destructive' });
    }
  };

  const endCall = () => {
    if (callId && socketRef.current) {
      socketRef.current.emit('leave', callId, myPeerId.current);
    }
    stopSpeechRecognition();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      document.body.removeChild(remoteAudioRef.current);
      remoteAudioRef.current = null;
    }
    setIsInCall(false);
    setCallId('');
    fullTranscriptRef.current = [];
    toast({ title: 'Call Ended', description: 'Session ended.' });
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    setIsMuted(m => !m);
  };

  const copyCallId = () => {
    navigator.clipboard.writeText(callId);
    toast({ title: 'Call ID Copied', description: 'Share with your partner.' });
  };

  useEffect(() => {
    return () => { if (isInCall) endCall(); };
  }, []);

  if (!sessionId) {
    return (
      <div className="flex items-center gap-3 py-3 px-1 border-b border-slate-700/50 mb-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
          <Phone className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400">Start a session to enable audio calls.</p>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-700/50 pb-3 mb-3">
      {!isInCall ? (
        <div className="flex items-center gap-2">
          <Button
            onClick={startCall}
            disabled={isConnecting}
            size="sm"
            className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-xs h-8"
          >
            <Phone className="w-3 h-3 mr-1" />
            {isConnecting ? 'Starting…' : 'Start Audio Call'}
          </Button>
          <Button
            onClick={() => {
              const id = prompt('Enter Call ID to join:');
              if (id) joinCall(id);
            }}
            disabled={isConnecting}
            size="sm"
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-8"
          >
            <Phone className="w-3 h-3 mr-1" />
            {isConnecting ? 'Joining…' : 'Join Call'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Call Active</span>
              {isListening && (
                <Badge className="text-[10px] h-4 bg-red-600/20 text-red-400 border-red-500/30 px-1">
                  🔴 Live Transcript
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <code className="text-[10px] text-blue-400 bg-slate-800 px-1.5 py-0.5 rounded">{callId.substring(0, 8)}…</code>
              <Button size="sm" variant="ghost" onClick={copyCallId} className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {liveInterim && (
            <p className="text-[11px] text-slate-400 italic truncate px-1">
              🎤 {liveInterim}
            </p>
          )}
          <div className="flex gap-1">
            <Button onClick={toggleMute} size="sm" variant={isMuted ? 'destructive' : 'secondary'} className="flex-1 h-7 text-xs">
              {isMuted ? <MicOff className="w-3 h-3 mr-1" /> : <Mic className="w-3 h-3 mr-1" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button onClick={() => setSpeakerEnabled(e => !e)} size="sm" variant="secondary" className="flex-1 h-7 text-xs">
              {speakerEnabled ? <Volume2 className="w-3 h-3 mr-1" /> : <VolumeX className="w-3 h-3 mr-1" />}
              Speaker
            </Button>
            <Button onClick={endCall} size="sm" variant="destructive" className="flex-1 h-7 text-xs">
              <PhoneOff className="w-3 h-3 mr-1" />
              End
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
