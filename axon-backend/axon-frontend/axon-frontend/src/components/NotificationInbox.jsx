import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Bell, GitPullRequest } from 'lucide-react';
import PRNotificationPanel from './PRNotificationPanel';

const targetUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const socket = io(targetUrl);

export default function NotificationInbox() {
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    socket.on('pr_reviewed', (data) => {
      console.log('Real-Time PR Review Received in Inbox:', data);
      const newNotification = {
        id: Date.now(),
        ...data,
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      socket.off('pr_reviewed');
    };
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleNotificationClick = (notif) => {
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setSelectedNotification(notif);
    setDropdownOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <div className="relative z-[9990]" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="relative p-2 rounded-full bg-[#1b1f27] border border-slate-700/50 hover:bg-[#252a36] hover:border-slate-600 transition-all text-slate-300"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-3 w-80 bg-[#1b1f27] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-[9991]">
            <div className="px-4 py-3 bg-[#15181f] border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  className="text-[11px] text-blue-400 hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">You have no notifications.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 text-left w-full border-b border-slate-800/50 hover:bg-[#222733] transition-colors flex gap-3 ${notif.read ? 'opacity-60' : 'bg-[#1e232e]'}`}
                    >
                      <div className={`mt-1 rounded-full p-1.5 shrink-0 ${notif.read ? 'bg-slate-800 text-slate-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        <GitPullRequest className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${notif.read ? 'text-slate-300' : 'text-slate-100 font-medium'}`}>
                          {notif.repo}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-3 hidden md:block"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* The PR Overlay (renders if a notification is selected) */}
      <PRNotificationPanel
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </>
  );
}
