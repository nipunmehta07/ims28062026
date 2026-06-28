"use client";

import { useEffect } from "react";

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SlidePanel({ isOpen, onClose, title, children }: SlidePanelProps) {
  // Prevent scrolling on the main body when the panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  return (
    <>
      {/* 1. The Dark Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* 2. The Sliding Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[480px] bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-[15px] font-medium text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Panel Body (Where forms are injected) */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fafafa]/50">
          {children}
        </div>
      </div>
    </>
  );
}