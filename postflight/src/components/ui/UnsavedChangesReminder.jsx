import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UnsavedChangesReminder({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed bottom-4 left-4 md:bottom-6 md:left-1/2 md:-translate-x-1/2 z-50"
        >
          <div className="bg-slate-900 text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">You have unsaved changes</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}