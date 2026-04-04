import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, UserPlus, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

interface AudioCallManagerProps {
  onTranscriptUpdate: (transcript: string) => void;
  onCodeMentionsDetected: (mentions: string[]) => void;
  sessionId: string | null;
}

interface CallParticipant {
  id: string;
  name: string;
  isMuted: boolean;
  isConnected: boolean;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  callId: string;
  peerId: string;
  data?: any;
  timestamp: number;
}

export const AudioCallManager: React.FC<AudioCallManagerProps> = ({
  onTranscriptUpdate,
  onCodeMentionsDetected,
  sessionId
}) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [callId, setCallId] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [myPeerId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [socket, setSocket] = useState<Socket | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize socket
  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:3002");
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Listen for signaling messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleSignalingMessage = async (message: SignalingMessage) => {
  if (!peerConnectionRef.current) return;

  console.log('Received signaling message:', message, 'State:', peerConnectionRef.current.signalingState);

  switch (message.type) {
    case 'offer':
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.data));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit('answer', message.callId, myPeerId, answer);
      break;

    case 'answer':
      if (peerConnectionRef.current.signalingState === 'have-local-offer') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.data));
      } else {
        console.warn('Ignoring answer: signaling state is', peerConnectionRef.current.signalingState);
      }
      break;

    case 'ice-candidate':
      if (message.data) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.data));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
      break;

  }
};


    socket.on('offer', (peerId, offer) => {
      handleSignalingMessage({ type: 'offer', callId, peerId, data: offer, timestamp: Date.now() });
    });

    socket.on('answer', (peerId, answer) => {
      handleSignalingMessage({ type: 'answer', callId, peerId, data: answer, timestamp: Date.now() });
    });

    socket.on('ice-candidate', (peerId, candidate) => {
      handleSignalingMessage({ type: 'ice-candidate', callId, peerId, data: candidate, timestamp: Date.now() });
    });

    socket.on('user-joined', (peerId) => {
      handleSignalingMessage({ type: 'join', callId, peerId, timestamp: Date.now() });
    });

    socket.on('user-left', (peerId) => {
      handleSignalingMessage({ type: 'leave', callId, peerId, timestamp: Date.now() });
    });

    socket.on('room-full', () => {
      toast({
        title: "Room Full",
        description: "This room already has two participants.",
        variant: "destructive",
      });
    });

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-full');
    };
  }, [socket, callId, isInCall, myPeerId]);

  // Generate a unique call ID for sharing
  const generateCallId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Initialize WebRTC peer connection
  const initializePeerConnection = (callId: string) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', callId, myPeerId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[0]);
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = document.createElement('audio');
        remoteAudioRef.current.autoplay = true;
        document.body.appendChild(remoteAudioRef.current);
      }
      remoteAudioRef.current.srcObject = event.streams[0];
      toast({
        title: "Peer Connected",
        description: "You can now hear your pair programming partner",
      });
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        toast({
          title: "Call Connected",
          description: "Audio connection established successfully",
        });
      }
    };

    peerConnectionRef.current = peerConnection;
  };

  // Start call functionality
  const startCall = async () => {
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;
      const newCallId = generateCallId();
      setCallId(newCallId);
      initializePeerConnection(newCallId);
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });
      startRecording(stream);
      setIsInCall(true);
      setIsConnecting(false);
      setParticipants([{
        id: myPeerId,
        name: 'You',
        isMuted: false,
        isConnected: true
      }]);
      if (socket) {
        socket.emit('join-room', newCallId, myPeerId);
      }
      toast({
        title: "Call Started",
        description: `Call ID: ${newCallId} - Share this with your pair programming partner`,
      });
    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
      toast({
        title: "Call Error",
        description: "Could not start call. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };

  // Join existing call
  const joinCall = async (joinCallId: string) => {
    if (!joinCallId.trim()) {
      toast({
        title: "Invalid Call ID",
        description: "Please enter a valid call ID",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;
      setCallId(joinCallId);
      initializePeerConnection(joinCallId);
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });
      startRecording(stream);
      setIsInCall(true);
      setIsConnecting(false);
      setParticipants([{
        id: myPeerId,
        name: 'You',
        isMuted: false,
        isConnected: true
      }]);
      if (socket) {
        socket.emit('join-room', joinCallId, myPeerId);
      }
      toast({
        title: "Joined Call",
        description: `Connected to call: ${joinCallId}`,
      });
    } catch (error) {
      console.error('Error joining call:', error);
      setIsConnecting(false);
      toast({
        title: "Join Error",
        description: "Could not join call. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };

  // Start recording for transcription
  const startRecording = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    const audioChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      processAudioForTranscription(audioBlob);
    };
    mediaRecorder.start(3000);
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        setTimeout(() => startRecording(stream), 100);
      }
    }, 3000);
  };

  // Process audio for transcription
  const processAudioForTranscription = (audioBlob: Blob) => {
    const mockTranscripts = [
      "Let's review the authentication flow in auth.js",
      "I think we need to refactor the debounce function in utils.js",
      "The async/await pattern here could be improved",
      "Should we add error handling to the API calls?",
      "The React hooks are causing unnecessary re-renders"
    ];
    const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    const mentions = ['auth.js', 'utils.js', 'debounce function', 'async/await', 'React hooks'];
    onTranscriptUpdate(transcript);
    onCodeMentionsDetected(mentions);
  };

  // End call
  const endCall = () => {
    if (callId && socket) {
      socket.emit('leave', callId, myPeerId);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    if (remoteAudioRef.current) {
      document.body.removeChild(remoteAudioRef.current);
      remoteAudioRef.current = null;
    }
    setIsInCall(false);
    setParticipants([]);
    setCallId('');
    toast({
      title: "Call Ended",
      description: "The pair programming session has ended",
    });
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      setParticipants(prev => prev.map(p =>
        p.id === myPeerId ? { ...p, isMuted: !isMuted } : p
      ));
    }
  };

  // Copy call ID to clipboard
  const copyCallId = () => {
    navigator.clipboard.writeText(callId);
    toast({
      title: "Call ID Copied",
      description: "Share this ID with your pair programming partner",
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isInCall) {
        endCall();
      }
    };
  }, []);

  if (!sessionId) {
    return (
      <Card className="p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm">
        <div className="text-center text-slate-400">
          <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Create a session to start an audio call</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-[#21262D] border-slate-700 backdrop-blur-sm">
      <div className="space-y-4">
        {!isInCall ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Audio Call</h3>
              <p className="text-sm text-slate-400">Start or join a call with your pair programming partner</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={startCall}
                disabled={isConnecting}
                className="h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Phone className="w-4 h-4 mr-2" />
                {isConnecting ? 'Starting...' : 'Start Call'}
              </Button>
              <Button
                onClick={() => {
                  const id = prompt('Enter Call ID to join:');
                  if (id) joinCall(id);
                }}
                disabled={isConnecting}
                variant="outline"
                className="h-12 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isConnecting ? 'Joining...' : 'Join Call'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-medium">Call Active</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-sm text-slate-400">Call ID:</span>
                <code className="text-sm bg-slate-700 px-2 py-1 rounded text-blue-400">{callId}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyCallId}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-300">Participants ({participants.length})</h4>
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${participant.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm text-slate-300 flex-1">{participant.name}</span>
                  {participant.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="w-12 h-12 rounded-full"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                onClick={() => setSpeakerEnabled(!speakerEnabled)}
                variant={speakerEnabled ? "secondary" : "outline"}
                size="lg"
                className="w-12 h-12 rounded-full"
              >
                {speakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <Button
                onClick={endCall}
                variant="destructive"
                size="lg"
                className="w-12 h-12 rounded-full"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
