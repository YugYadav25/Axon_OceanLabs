import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { Badge } from "./ui/badge"
import { Send, User, Phone, PhoneOff, PhoneMissed } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useWebRTC } from "../hooks/useWebRTC"
import { useSocket } from "../hooks/useSocket"

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
}

interface TwoPersonChatProps {
  userId: string
  userName: string
  roomId: string
  onMessageAdded?: (message: Message) => void
}

interface OtherUser {
  id: string
  name: string
}

export const TwoPersonChat: React.FC<TwoPersonChatProps> = ({ userId, userName, roomId, onMessageAdded }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState<string>("")
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Socket connection for chat and signaling
  const backendUrl = import.meta.env.VITE_AI_BACKEND_URL || `http://${window.location.hostname}:3002`;
  const socket = useSocket(backendUrl, {
    userId,
    userName,
    roomId,
  })

  // WebRTC hook for audio calling
  const { isCallActive, isIncomingCall, callStatus, startCall, acceptCall, endCall, incomingCallFrom } = useWebRTC(
    socket,
    userId,
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (!socket) return

    const handleConnected = () => {
      console.log("connected to socket Line 60")
      setIsConnected(true)
    }

    const handleDisconnected = () => {
      setIsConnected(false)
    }

    const handleUserJoined = (user: OtherUser) => {
      if (user.id === userId) return
      console.log(user)
      console.log("other user")
      console.log(otherUser)
      setOtherUser(user)
      const msg: Message = {
        id: Date.now().toString(),
        senderId: "system",
        senderName: "System",
        content: `${user.name} joined the chat`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg])
      onMessageAdded?.(msg)
    }

    const handleUserLeft = (user: OtherUser) => {
      setOtherUser(null)
      const msg: Message = {
        id: Date.now().toString(),
        senderId: "system",
        senderName: "System",
        content: `${user.name} left the chat`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg])
      onMessageAdded?.(msg)
    }

    const handleMessage = (message: Message) => {
      console.log("Received message:", message)
      if (message.senderId === userId) return // Ignore own messages
      const msg = {
        ...message,
        timestamp: new Date(message.timestamp),
      };
      setMessages((prev) => [...prev, msg])
      onMessageAdded?.(msg)
    }

    // Add event listeners
    socket.on("connected", handleConnected)
    socket.on("disconnected", handleDisconnected)
    socket.on("user-joined", handleUserJoined)
    socket.on("user-left", handleUserLeft)
    socket.on("message", handleMessage)

    socket.emit("join-room", { userId, userName, roomId })

    return () => {
      socket.off("connected", handleConnected)
      socket.off("disconnected", handleDisconnected)
      socket.off("user-joined", handleUserJoined)
      socket.off("user-left", handleUserLeft)
      socket.off("message", handleMessage)
    }
  }, [socket])

  const sendMessage = (): void => {
    if (!inputValue.trim() || !socket || !isConnected) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: userId,
      senderName: userName,
      content: inputValue,
      timestamp: new Date(),
    }

    socket.emit("send-message", message)
    setMessages((prev) => [...prev, message])
    onMessageAdded?.(message)
    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleCall = (): void => {
    if (!otherUser) return

    if (isCallActive) {
      endCall()
    } else {
      startCall(otherUser.id)
    }
  }

  const getCallButtonIcon = (): React.ReactNode => {
    if (isIncomingCall) return <PhoneMissed className="w-4 h-4" />
    if (isCallActive) return <PhoneOff className="w-4 h-4" />
    return <Phone className="w-4 h-4" />
  }

  const getCallButtonText = (): string => {
    if (isIncomingCall) return `Accept call from ${incomingCallFrom}`
    if (isCallActive) return "End Call"
    return "Start Call"
  }

  const getCallButtonColor = (): string => {
    if (isIncomingCall) return "bg-green-600 hover:bg-green-700"
    if (isCallActive) return "bg-red-600 hover:bg-red-700"
    return "bg-blue-600 hover:bg-blue-700"
  }

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col">
      {/* Header with call controls */}
      <div className="flex justify-between items-center p-3 border-b border-slate-600">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-sm text-slate-300">
            {otherUser ? `Chatting with ${otherUser.name}` : "Waiting for someone to join..."}
          </span>
        </div>

        {otherUser && (
          <div className="flex items-center gap-2">
            {callStatus && (
              <Badge variant="outline" className="text-xs">
                {callStatus}
              </Badge>
            )}
            <Button
              size="sm"
              onClick={isIncomingCall ? acceptCall : handleCall}
              disabled={!otherUser}
              className={getCallButtonColor()}
            >
              {getCallButtonIcon()}
              <span className="ml-1 text-xs">{getCallButtonText()}</span>
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 mb-4" ref={scrollRef}>
        <div className="space-y-4 p-2">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.senderId === userId ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.senderId === userId
                    ? "bg-blue-500/20 text-blue-400"
                    : message.senderId === "system"
                      ? "bg-gray-500/20 text-gray-400"
                      : "bg-green-500/20 text-green-400"
                }`}
              >
                <User className="w-4 h-4" />
              </div>

              <div className={`flex-1 ${message.senderId === userId ? "text-right" : ""}`}>
                <div
                  className={`inline-block max-w-[85%] rounded-lg p-3 ${
                    message.senderId === userId
                      ? "bg-blue-600/20 text-blue-100 border border-blue-500/30"
                      : message.senderId === "system"
                        ? "bg-gray-600/20 text-gray-300 border border-gray-500/30"
                        : "bg-green-600/20 text-green-100 border border-green-500/30"
                  }`}
                >
                  {message.senderId !== "system" && message.senderId !== userId && (
                    <p className="text-xs text-slate-400 mb-1">{message.senderName}</p>
                  )}
                  <div className="prose prose-invert prose-sm max-w-none text-slate-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-1">{message.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={otherUser ? "Type your message..." : "Waiting for someone to join..."}
          className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
          disabled={!isConnected || !otherUser}
        />
        <Button
          onClick={sendMessage}
          disabled={!inputValue.trim() || !isConnected || !otherUser}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
