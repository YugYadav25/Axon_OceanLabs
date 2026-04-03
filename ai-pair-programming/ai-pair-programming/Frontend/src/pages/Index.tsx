import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/logo.png";
import { PairProgrammingAssistant } from "@/components/PairProgrammingAssistant";


export default function PairMode() {
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
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
        {/* 🔵 Top-left Logo */}
        <div className="absolute top-6 left-6 flex items-center space-x-3">
          <img src={Logo} alt="Logo" className="w-8 h-8" />
          <div>
            <p className="bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent sub-head">
              Axon
            </p>
            <p className="text-xs text-white/70">Your repo with AI clarity</p>
          </div>
        </div>

        {/* 💬 Centered Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 place-items-center h-screen pt-10">
          {/* Left Text */}
          <div className="text-center md:text-left mb-10 md:mb-0 px-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent mb-4">
              AI-Assisted Pairing Mode
            </h1>
            <p className="text-lg text-white/70">Collaborate. Ask. Code.</p>
          </div>

          {/* Right Form */}
          <div className="bg-[#21262D] p-8 rounded-lg border border-[#2a2d32] w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-6">Join Your Coding Room</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-[#2F89FF]">Enter Your Name</label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Name"
                  className="bg-[#1F232B] text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#2F89FF]">Room ID</label>
                <Input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g. 123"
                  className="bg-[#1F232B] text-white"
                />
              </div>
              <Button
                onClick={joinChat}
                disabled={!userName.trim() || !roomId.trim()}
                className="w-full bg-white text-black font-semibold hover:bg-gray-100"
              >
                Join Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
  <div className="w-full mx-auto">
    <div className="bg-[#1B2027] rounded-lg border border-slate-700 p-6">
      <div className="flex justify-between items-center mb-4">
        
        <div className="flex items-center space-x-3">
          <img src={Logo} alt="axon" className="w-8 h-8" />
          <div>
            <p className="bg-gradient-to-r from-[#CAF5BB] to-[#2F89FF] bg-clip-text text-transparent font-semibold text-base">
              Axon
            </p>
            <p className="text-xs text-white/70">Your repo with AI clarity</p>
          </div>
        </div>
      </div>

      <PairProgrammingAssistant
        userId={userId}
        userName={userName}
        roomId={roomId}
      />
    </div>
  </div>
</div>

  );
}











