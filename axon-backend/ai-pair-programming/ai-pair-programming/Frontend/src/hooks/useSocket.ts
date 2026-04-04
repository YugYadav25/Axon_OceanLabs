import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface UseSocketOptions {
  userId: string
  userName: string
  roomId: string
}

interface ServerToClientEvents {

  connected: () => void
  disconnected: () => void
//   "join-room": (data: { userId: string; userName: string; roomId: string }) => void
  "user-joined": (user: { id: string; name: string }) => void
  "user-left": (user: { id: string; name: string }) => void
  message: (message: any) => void
  "room-full": () => void
  "call-offer": (data: { from: string; offer: RTCSessionDescriptionInit }) => void
  "call-answer": (data: { answer: RTCSessionDescriptionInit }) => void
  "ice-candidate": (data: { candidate: RTCIceCandidateInit }) => void
  "call-ended": () => void
}

interface ClientToServerEvents {
    "join-room": (data: { userId: string; userName: string; roomId: string }) => void
    "send-message": (message: any) => void
    "call-offer": (data: { to: string; offer: RTCSessionDescriptionInit }) => void
  "call-answer": (data: { answer: RTCSessionDescriptionInit }) => void
  "ice-candidate": (data: { candidate: RTCIceCandidateInit }) => void
  "end-call": () => void
}

export const useSocket = (
  serverUrl: string,
  options: UseSocketOptions,
): Socket<ServerToClientEvents, ClientToServerEvents> | null => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)

  useEffect(() => {
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
      query: {
        userId: options.userId,
        userName: options.userName,
        roomId: options.roomId,
      },
    })

    newSocket.on("connect", () => {
      console.log("Connected to server")
      setSocket(newSocket)
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server")
    })

    newSocket.on("room-full", () => {
        alert("This chat room is full. Only 2 users are allowed.")
        window.location.reload()
    })

    return () => {
      newSocket.close()
    }
  }, [serverUrl, options.userId, options.userName, options.roomId])

  return socket
}
