
import { useEffect, useState, useRef, useCallback } from "react"
import type { Socket } from "socket.io-client"

interface UseWebRTCReturn {
  isCallActive: boolean
  isIncomingCall: boolean
  callStatus: string
  startCall: (targetUserId: string) => void
  acceptCall: () => void
  endCall: () => void
  incomingCallFrom: string | null
}

interface CallOfferData {
  from: string
  offer: RTCSessionDescriptionInit
}

interface CallAnswerData {
  answer: RTCSessionDescriptionInit
}

interface IceCandidateData {
  candidate: RTCIceCandidateInit
}

export const useWebRTC = (socket: Socket | null, userId: string): UseWebRTCReturn => {
  const [isCallActive, setIsCallActive] = useState<boolean>(false)
  const [isIncomingCall, setIsIncomingCall] = useState<boolean>(false)
  const [callStatus, setCallStatus] = useState<string>("")
  const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null)

  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const remoteAudio = useRef<HTMLAudioElement | null>(null)

  const cleanup = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop())
      localStream.current = null
    }

    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }

    if (remoteAudio.current) {
      remoteAudio.current.srcObject = null
    }
  }, [])

  const handleCallEnd = useCallback(() => {
    setIsCallActive(false)
    setIsIncomingCall(false)
    setCallStatus("")
    setIncomingCallFrom(null)
    cleanup()
  }, [cleanup])

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", {
          candidate: event.candidate.toJSON(),
        })
      }
    }

    pc.ontrack = (event: RTCTrackEvent) => {
      console.log("Received remote stream")
      if (remoteAudio.current) {
        remoteAudio.current.srcObject = event.streams[0]
      }
    }

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState)
      if (pc.connectionState === "connected") {
        setCallStatus("Connected")
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        handleCallEnd()
      }
    }

    return pc
  }, [socket, handleCallEnd])

  useEffect(() => {
    if (!socket) return

    // Create audio element for remote stream
    remoteAudio.current = new Audio()
    remoteAudio.current.autoplay = true

    const handleCallOffer = async (data: CallOfferData) => {
      console.log("Received call offer from:", data.from)
      setIsIncomingCall(true)
      setIncomingCallFrom(data.from)
      setCallStatus("Incoming call...")

      await handleIncomingCall(data.offer, data.from)
    }

    const handleCallAnswer = async (data: CallAnswerData) => {
      console.log("Received call answer")
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(data.answer)
        setCallStatus("Connected")
      }
    }

    const handleIceCandidate = async (data: IceCandidateData) => {
      console.log("Received ICE candidate")
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(data.candidate)
      }
    }

    const handleCallEnded = () => {
      console.log("Call ended by remote user")
      handleCallEnd()
    }

    // WebRTC signaling handlers
    socket.on("call-offer", handleCallOffer)
    socket.on("call-answer", handleCallAnswer)
    socket.on("ice-candidate", handleIceCandidate)
    socket.on("call-ended", handleCallEnded)

    return () => {
      socket.off("call-offer", handleCallOffer)
      socket.off("call-answer", handleCallAnswer)
      socket.off("ice-candidate", handleIceCandidate)
      socket.off("call-ended", handleCallEnded)
      cleanup()
    }
  }, [socket, userId, cleanup, handleCallEnd, createPeerConnection])

  const handleIncomingCall = async (offer: RTCSessionDescriptionInit, fromUserId: string): Promise<void> => {
    try {
      // Get user media
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create peer connection
      peerConnection.current = createPeerConnection()

      // Add local stream
      localStream.current.getTracks().forEach((track) => {
        if (peerConnection.current && localStream.current) {
          peerConnection.current.addTrack(track, localStream.current)
        }
      })

      // Set remote description
      await peerConnection.current.setRemoteDescription(offer)
    } catch (error) {
      console.error("Error handling incoming call:", error)
    }
  }

  const startCall = async (targetUserId: string): Promise<void> => {
    try {
      setCallStatus("Calling...")

      // Get user media
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create peer connection
      peerConnection.current = createPeerConnection()

      // Add local stream
      localStream.current.getTracks().forEach((track) => {
        if (peerConnection.current && localStream.current) {
          peerConnection.current.addTrack(track, localStream.current)
        }
      })

      // Create and send offer
      const offer = await peerConnection.current.createOffer()
      await peerConnection.current.setLocalDescription(offer)

      if (socket) {
        socket.emit("call-offer", {
          to: targetUserId,
          offer: offer,
        })
      }

      setIsCallActive(true)
    } catch (error) {
      console.error("Error starting call:", error)
      setCallStatus("Call failed")
      cleanup()
    }
  }

  const acceptCall = async (): Promise<void> => {
    try {
      if (!peerConnection.current) return

      // Create and send answer
      const answer = await peerConnection.current.createAnswer()
      await peerConnection.current.setLocalDescription(answer)

      if (socket) {
        socket.emit("call-answer", {
          answer: answer,
        })
      }

      setIsIncomingCall(false)
      setIsCallActive(true)
      setCallStatus("Connected")
      setIncomingCallFrom(null)
    } catch (error) {
      console.error("Error accepting call:", error)
      setCallStatus("Call failed")
      cleanup()
    }
  }

  const endCall = (): void => {
    if (socket) {
      socket.emit("end-call")
    }
    handleCallEnd()
  }

  return {
    isCallActive,
    isIncomingCall,
    callStatus,
    startCall,
    acceptCall,
    endCall,
    incomingCallFrom,
  }
}
