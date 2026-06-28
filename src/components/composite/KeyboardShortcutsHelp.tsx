"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalTitle, type ModalProps } from "@/components/ui/Modal";
import { getModifierSymbol, getShortcutDisplay, normalizeShortcut } from "@/lib/platform";

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { keys: ["G", "D"], description: "Go to Dashboard", category: "Navigation" },
  { keys: ["G", "P"], description: "Go to Products", category: "Navigation" },
  { keys: ["G", "R"], description: "Go to Reports", category: "Navigation" },
  { keys: ["G", "S"], description: "Go to Settings", category: "Navigation" },
  { keys: ["G", "O"], description: "Go to Orders", category: "Navigation" },
  { keys: ["G", "I"], description: "Go to Inventory", category: "Navigation" },

  // Actions
  { keys: ["N"], description: "New Item / Order", category: "Actions" },
  { keys: ["E"], description: "Edit Selected", category: "Actions" },
  { keys: ["D"], description: "Delete Selected", category: "Actions" },
  { keys: ["S"], description: "Save / Submit", category: "Actions" },
  { keys: ["Escape"], description: "Close / Cancel", category: "Actions" },

  // Command Palette
  { keys: ["Meta", "K"], description: "Open Command Palette", category: "Command" },
  { keys: ["/"], description: "Open Command Palette (Alternative)", category: "Command" },

  // Search & Filter
  { keys: ["Meta", "F"], description: "Find / Search", category: "Search" },
  { keys: ["Meta", "Enter"], description: "Apply Filter", category: "Search" },

  // Selection
  { keys: ["Meta", "A"], description: "Select All", category: "Selection" },
  { keys: ["Shift", "ArrowUp"], description: "Extend Selection Up", category: "Selection" },
  { keys: ["Shift", "ArrowDown"], description: "Extend Selection Down", category: "Selection" },
  { keys: ["Meta", "D"], description: "Deselect All", category: "Selection" },
];

type KeyboardShortcutsHelpProps = Omit<ModalProps, "children">;

export function KeyboardShortcutsHelp({ ...props }: KeyboardShortcutsHelpProps) {
  const categories = KEYBOARD_SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Modal {...props}>
      <ModalContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <ModalHeader>
          <ModalTitle>Keyboard Shortcuts</ModalTitle>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Press ? to toggle this panel
          </p>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto space-y-6 p-1">
          {Object.entries(categories).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 sticky top-0 bg-white dark:bg-zinc-900 py-1">
                {category}
              </h3>
              <div className="space-y-1">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {getShortcutDisplay(shortcut.keys).split(" + ").map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2 py-1 text-[9px] font-mono font-bold bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 mt-4">
          <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest">
            Some shortcuts may vary based on your operating system
          </p>
        </div>
      </ModalContent>
    </Modal>
  );
}

export default KeyboardShortcutsHelp;