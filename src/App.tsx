import React, { useState, useRef, useCallback } from 'react';
import { SmileIcon, ImageIcon, MoveIcon, RotateCwIcon, TrashIcon, UndoIcon, RedoIcon, MaximizeIcon } from 'lucide-react';

import { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
}

export function Card({ className = "", children }: CardProps) {
  return (
    <div
      className={`card ${className}`}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#fff",
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        borderBottom: "1px solid #eee",
        paddingBottom: "8px",
        fontSize: "18px",
        fontWeight: "bold",
      }}
    >
      {children}
    </div>
  );
}

export function CardContent({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: "8px",
        fontSize: "14px",
        color: "#555",
      }}
    >
      {children}
    </div>
  );
}

import { ButtonHTMLAttributes } from "react";
import StickerEditor from './Stickers';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "destructive";
  size?: string;
}

export function Button({ variant = "default", style, ...props }: ButtonProps) {
  const baseStyle = {
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "bold",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    ...(variant === "default"
      ? { backgroundColor: "#007bff", color: "white", border: "none" }
      : { backgroundColor: "transparent", color: "#007bff", border: "1px solid #007bff" }),
  };

  return <button style={{ ...baseStyle, ...style }} {...props} />;
}


// Types
type HandleMode = 'move' | 'rotate' | 'scale';

interface Sticker {
  id: number;
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface DragOffset {
  x?: number;
  y?: number;
  centerX?: number;
  centerY?: number;
  initialAngle?: number;
  initialY?: number;
  initialScale?: number;
}

interface TouchDistance {
  distance: number;
  angle: number;
  scale: number;
  rotation: number;
}

const App = () => {
  return (
    <StickerEditor />
  );
};

export default App;