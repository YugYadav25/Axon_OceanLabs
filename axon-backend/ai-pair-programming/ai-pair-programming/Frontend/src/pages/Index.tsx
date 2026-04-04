import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/logo.png";
import { PairProgrammingAssistant } from "@/components/PairProgrammingAssistant";
import { Github, Users, Zap } from "lucide-react";

export default function PairMode() {
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") joinChat();
  };

  const joinChat = () => {
    if (userName.trim() && roomId.trim()) {
      setIsJoined(true);
    }
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#1B2027] text-white relative px-8 py-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#2F89FF]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#CAF5BB]/5 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="absolute top-6 left-6 flex items-center space-x-3 z-10">
          <img src={Logo} alt="Logo" className="w-8 h-8" />
          <div>
            <p className="bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent sub-head font-semibold">
              Axon
            </p>
            <p className="text-xs text-white/70">Your repo with AI clarity</p>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 place-items-center min-h-screen pt-10 relative z-10">
          {/* Left: Text */}
          <div className="text-center md:text-left mb-10 md:mb-0 px-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent mb-4 sub-head">
              AI-Assisted<br />Pairing Mode
            </h1>
            <p className="text-lg text-white/70 mb-8">Collaborate. Ask. Code.</p>
            <div className="space-y-3 text-left">
              {[
                { icon: <Zap className="w-4 h-4 text-[#CAF5BB]" />, text: 'Live speech transcription via browser' },
                { icon: <Github className="w-4 h-4 text-[#2F89FF]" />, text: 'Repo-aware AI assistant (Gitzy)' },
                { icon: <Users className="w-4 h-4 text-purple-400" />, text: 'Real-time audio call with partner' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-[#21262D] p-8 rounded-2xl border border-[#2a2d32] w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-semibold mb-6 text-white">Join Your Coding Room</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5 text-[#2F89FF] font-medium uppercase tracking-wide">
                  Your Name
                </label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g. Alice"
                  className="bg-[#1F232B] text-white border-[#30363D] focus:border-[#2F89FF]"
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5 text-[#2F89FF] font-medium uppercase tracking-wide">
                  Room ID
                </label>
                <Input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g. 123 (share with partner)"
                  className="bg-[#1F232B] text-white border-[#30363D] focus:border-[#2F89FF]"
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5 text-[#CAF5BB] font-medium uppercase tracking-wide">
                  GitHub Repo URL <span className="text-slate-500 normal-case font-normal">(optional — enables Gitzy)</span>
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="https://github.com/owner/repo"
                    className="bg-[#1F232B] text-white border-[#30363D] focus:border-[#CAF5BB] pl-9"
                  />
                </div>
              </div>

              <Button
                onClick={joinChat}
                disabled={!userName.trim() || !roomId.trim()}
                className="w-full bg-gradient-to-r from-[#2F89FF] to-[#1a5fbf] hover:opacity-90 text-white font-semibold h-10 mt-2"
              >
                Join Session →
              </Button>

              <p className="text-center text-xs text-slate-500">
                Both participants must use the same Room ID
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1B2027]">
      <div className="w-full mx-auto">
        <div className="bg-[#1B2027] rounded-lg border-0">
          {/* Top bar with logo */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <img src={Logo} alt="axon" className="w-7 h-7" />
              <div>
                <p className="bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent font-semibold text-sm">
                  Axon
                </p>
                <p className="text-xs text-white/50">Pair Mode</p>
              </div>
            </div>
            {repoUrl && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Github className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{repoUrl.replace('https://github.com/', '')}</span>
              </div>
            )}
            <Button
              onClick={() => setIsJoined(false)}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white text-xs"
            >
              ← Leave Session
            </Button>
          </div>

          <PairProgrammingAssistant
            userId={userId}
            userName={userName}
            roomId={roomId}
            repoUrl={repoUrl}
          />
        </div>
      </div>
    </div>
  );
}
