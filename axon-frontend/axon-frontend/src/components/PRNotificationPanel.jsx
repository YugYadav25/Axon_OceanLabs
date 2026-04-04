import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitPullRequest, CheckCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function PRNotificationPanel({ notification, onClose }) {
  if (!notification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400, y: 50 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 400, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-6 right-6 w-[450px] max-h-[80vh] flex flex-col bg-[#0f1117] border border-blue-500/30 rounded-xl shadow-2xl shadow-blue-900/20 z-[9999] overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/20 p-1.5 rounded-md">
              <GitPullRequest className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI PR Analysis Complete</h3>
              <p className="text-xs text-blue-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {notification.timestamp ? new Date(notification.timestamp).toLocaleTimeString() : 'Just now'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Context Info */}
        <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Repository</span>
            <span className="text-xs text-slate-300 font-medium">{notification.repo}</span>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 flex items-center gap-1.5 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20">
              <CheckCircle className="w-3 h-3" /> Reviewed
            </span>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="prose prose-invert prose-sm max-w-none text-slate-300 
            prose-headings:text-slate-100 prose-headings:font-semibold prose-headings:mt-4 prose-headings:first:mt-0 
            prose-a:text-blue-400 prose-code:text-indigo-300 prose-code:bg-indigo-900/30 prose-code:rounded prose-code:px-1
            prose-li:my-0.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {notification.reviewMarkdown}
            </ReactMarkdown>
          </div>
        </div>
        
        {/* Action Bar */}
        <div className="px-5 py-3 bg-black/20 border-t border-white/5 flex justify-end gap-2">
          <button 
            className="text-xs px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
            onClick={onClose}
          >
            Acknowledge
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
