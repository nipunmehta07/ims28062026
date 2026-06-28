"use client";

/**
 * Platform detection utilities for cross-platform keyboard shortcuts
 */

export type Platform = "mac" | "windows" | "linux" | "unknown";

/**
 * Detect the current platform from navigator.userAgent
 */
export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes("mac") || userAgent.includes("iphone") || userAgent.includes("ipad")) {
    return "mac";
  }
  if (userAgent.includes("win")) {
    return "windows";
  }
  if (userAgent.includes("linux")) {
    return "linux";
  }
  return "unknown";
}

/**
 * Get the primary modifier key for the current platform
 * Mac: "Meta" (⌘), Windows/Linux: "Control" (Ctrl)
 */
export function getPrimaryModifier(): "Meta" | "Control" {
  const platform = detectPlatform();
  return platform === "mac" ? "Meta" : "Control";
}

/**
 * Get the display symbol for the primary modifier
 * Mac: "⌘", Windows/Linux: "Ctrl"
 */
export function getModifierSymbol(): string {
  const platform = detectPlatform();
  return platform === "mac" ? "⌘" : "Ctrl";
}

/**
 * Get the display label for the primary modifier
 * Mac: "⌘", Windows/Linux: "Ctrl"
 */
export function getModifierLabel(): string {
  const platform = detectPlatform();
  return platform === "mac" ? "⌘" : "Ctrl";
}

/**
 * Check if an event matches the primary modifier + key combination
 * Works cross-platform (Meta on Mac, Control on Windows/Linux)
 */
export function isPrimaryModifierPressed(event: KeyboardEvent): boolean {
  const platform = detectPlatform();
  return platform === "mac" ? event.metaKey : event.ctrlKey;
}

/**
 * Normalize shortcut array for current platform
 * Converts ["Meta", "K"] to ["Control", "K"] on Windows/Linux
 */
export function normalizeShortcut(shortcut: string[]): string[] {
  const platform = detectPlatform();
  if (platform === "mac") return shortcut;
  
  return shortcut.map(key => 
    key === "Meta" ? "Control" : key
  );
}

/**
 * Get display string for a shortcut array
 * Shows ⌘+K on Mac, Ctrl+K on Windows/Linux
 */
export function getShortcutDisplay(shortcut: string[]): string {
  const platform = detectPlatform();
  const modifier = platform === "mac" ? "⌘" : "Ctrl";
  
  return shortcut
    .map(key => {
      if (key === "Meta") return modifier;
      if (key === "Control") return "Ctrl";
      if (key === "ArrowUp") return "↑";
      if (key === "ArrowDown") return "↓";
      if (key === "ArrowLeft") return "←";
      if (key === "ArrowRight") return "→";
      return key;
    })
    .join(" + ");
}

/**
 * Check if a keyboard event matches a shortcut array
 * Handles cross-platform modifier differences
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: string[]): boolean {
  const normalized = normalizeShortcut(shortcut);
  
  // Check modifier keys
  const hasMeta = normalized.includes("Meta");
  const hasControl = normalized.includes("Control");
  const hasShift = normalized.includes("Shift");
  const hasAlt = normalized.includes("Alt");
  
  if (hasMeta && !event.metaKey) return false;
  if (hasControl && !event.ctrlKey) return false;
  if (hasShift && !event.shiftKey) return false;
  if (hasAlt && !event.altKey) return false;
  
  // Check if any non-modifier key matches
  const nonModifiers = normalized.filter(k => 
    !["Meta", "Control", "Shift", "Alt"].includes(k)
  );
  
  return nonModifiers.some(key => {
    if (key === " ") return event.key === " ";
    return event.key.toLowerCase() === key.toLowerCase();
  });
}

export default {
  detectPlatform,
  getPrimaryModifier,
  getModifierSymbol,
  getModifierLabel,
  isPrimaryModifierPressed,
  normalizeShortcut,
  getShortcutDisplay,
  matchesShortcut,
};