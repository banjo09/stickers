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
  const [image, setImage] = useState<string | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [dragOffset, setDragOffset] = useState<DragOffset>({});
  const [initialTouchDistance, setInitialTouchDistance] = useState<TouchDistance | null>(null);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [history, setHistory] = useState<Sticker[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stickerOptions = [
    '😊', '❤️', '🌟', '🎉', '👍', '🔥',
    '🌈', '🎨', '🎭', '🎪', '🎯', '🎲',
    '🌺', '🍕', '🎸', '🎮', '📸', '🎪'
  ];

  const addToHistory = useCallback((newStickers: Sticker[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newStickers);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setStickers(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setStickers(history[historyIndex + 1]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Date.now(),
      content: emoji,
      x: 150,
      y: 150,
      scale: 1,
      rotation: 0,
    };
    const newStickers = [...stickers, newSticker];
    setStickers(newStickers);
    addToHistory(newStickers);
  };

  const handleDeleteSticker = (stickerId: number) => {
    const newStickers = stickers.filter(s => s.id !== stickerId);
    setStickers(newStickers);
    addToHistory(newStickers);
    setSelectedSticker(null);
  };

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
  };

  const getAngle = (cx: number, cy: number, ex: number, ey: number) => {
    const dy = ey - cy;
    const dx = ex - cx;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  const handleMouseDown = (e: React.MouseEvent, sticker: Sticker, mode: HandleMode = 'move') => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setSelectedSticker(sticker);

    switch (mode) {
      case 'rotate':
        setIsRotating(true);
        setInitialRotation(sticker.rotation);
        const centerX = rect.left + sticker.x;
        const centerY = rect.top + sticker.y;
        setDragOffset({
          centerX,
          centerY,
          initialAngle: getAngle(centerX, centerY, e.clientX, e.clientY) - sticker.rotation
        });
        break;
      case 'scale':
        setIsScaling(true);
        setInitialScale(sticker.scale);
        setDragOffset({
          initialY: e.clientY,
          initialScale: sticker.scale
        });
        break;
      default:
        setIsDragging(true);
        setDragOffset({
          x: e.clientX - sticker.x,
          y: e.clientY - sticker.y
        });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedSticker || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const updatedSticker = { ...selectedSticker };

    if (isDragging && dragOffset.x !== undefined && dragOffset.y !== undefined) {
      updatedSticker.x = e.clientX - dragOffset.x;
      updatedSticker.y = e.clientY - dragOffset.y;
    } else if (isRotating && dragOffset.centerX !== undefined && dragOffset.centerY !== undefined) {
      const currentAngle = getAngle(dragOffset.centerX, dragOffset.centerY, e.clientX, e.clientY);
      updatedSticker.rotation = currentAngle - (dragOffset.initialAngle ?? 0);
    } else if (isScaling && dragOffset.initialY !== undefined && dragOffset.initialScale !== undefined) {
      const scaleDelta = (dragOffset.initialY - e.clientY) / 100;
      updatedSticker.scale = Math.max(0.5, Math.min(3, dragOffset.initialScale + scaleDelta));
    }

    setStickers(stickers.map(s => s.id === selectedSticker.id ? updatedSticker : s));
  };

  const handleMouseUp = () => {
    if (selectedSticker) {
      addToHistory(stickers);
    }
    setIsDragging(false);
    setIsRotating(false);
    setIsScaling(false);
    // Remove this line to keep the sticker selected:
    // setSelectedSticker(null);
  };

  // const handleTouchStart = (e: React.TouchEvent, sticker: Sticker) => {
  //   if (e.touches.length === 2) {
  //     e.preventDefault();
  //     const touch1 = e.touches[0];
  //     const touch2 = e.touches[1];
  //     setInitialTouchDistance({
  //       distance: getDistance(touch1, touch2),
  //       angle: getAngle(touch1.clientX, touch1.clientY, touch2.clientX, touch2.clientY),
  //       scale: sticker.scale,
  //       rotation: sticker.rotation
  //     });
  //     setSelectedSticker(sticker);
  //   } else if (e.touches.length === 1) {
  //     handleMouseDown({
  //       stopPropagation: () => { },
  //       clientX: e.touches[0].clientX,
  //       clientY: e.touches[0].clientY,
  //     } as React.MouseEvent, sticker);
  //   }
  // };

  // const handleTouchMove = (e: React.TouchEvent) => {
  //   if (e.touches.length === 2 && selectedSticker && initialTouchDistance) {
  //     e.preventDefault();
  //     const touch1 = e.touches[0];
  //     const touch2 = e.touches[1];

  //     const currentDistance = getDistance(touch1, touch2);
  //     const scaleFactor = currentDistance / initialTouchDistance.distance;
  //     const newScale = Math.max(0.5, Math.min(3, initialTouchDistance.scale * scaleFactor));

  //     const currentAngle = getAngle(touch1.clientX, touch1.clientY, touch2.clientX, touch2.clientY);
  //     const rotationDelta = currentAngle - initialTouchDistance.angle;
  //     const newRotation = initialTouchDistance.rotation + rotationDelta;

  //     setStickers(stickers.map(s =>
  //       s.id === selectedSticker.id
  //         ? { ...s, scale: newScale, rotation: newRotation }
  //         : s
  //     ));
  //   } else if (e.touches.length === 1) {
  //     handleMouseMove({
  //       clientX: e.touches[0].clientX,
  //       clientY: e.touches[0].clientY,
  //     } as React.MouseEvent);
  //   }
  // };

  // const handleTouchEnd = () => {
  //   if (selectedSticker) {
  //     addToHistory(stickers);
  //   }
  //   setInitialTouchDistance(null);
  //   setIsDragging(false);
  //   // Remove this line to keep the sticker selected:
  //   // setSelectedSticker(null);
  // };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the container
    if (e.target === containerRef.current) {
      setSelectedSticker(null);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, sticker: Sticker) => {
    if (e.touches.length === 2) {
      // Two-finger touch (scale and rotate)
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
  
      setInitialTouchDistance({
        distance: getDistance(touch1, touch2),
        angle: getAngle(touch1.clientX, touch1.clientY, touch2.clientX, touch2.clientY),
        scale: sticker.scale,
        rotation: sticker.rotation,
      });
  
      setSelectedSticker(sticker);
    } else if (e.touches.length === 1) {
      // Single-finger touch (move)
      handleMouseDown({
        stopPropagation: () => {},
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      } as React.MouseEvent, sticker);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && selectedSticker && initialTouchDistance) {
      e.preventDefault();
  
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
  
      // Calculate new distance and angle between the two touches
      const currentDistance = getDistance(touch1, touch2);
      const scaleFactor = currentDistance / initialTouchDistance.distance;
      const newScale = Math.max(0.5, Math.min(3, initialTouchDistance.scale * scaleFactor));
  
      const currentAngle = getAngle(touch1.clientX, touch1.clientY, touch2.clientX, touch2.clientY);
      const rotationDelta = currentAngle - initialTouchDistance.angle;
      const newRotation = initialTouchDistance.rotation + rotationDelta;
  
      setStickers(stickers.map(s =>
        s.id === selectedSticker.id
          ? { ...s, scale: newScale, rotation: newRotation }
          : s
      ));
    } else if (e.touches.length === 1) {
      // Handle dragging with a single touch (move)
      handleMouseMove({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      } as React.MouseEvent);
    }
  };
  
  const handleTouchEnd = () => {
    if (selectedSticker) {
      addToHistory(stickers);
    }
    setInitialTouchDistance(null);
    setIsDragging(false);
  };
  

  return (
    // <Card className="p-4 w-full max-w-2xl mx-auto">
    <Card className="p-4 w-full max-w-2xl ">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <ImageIcon className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Sticker Editor</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex === 0}
          >
            <UndoIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex === history.length - 1}
          >
            <RedoIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {stickerOptions.map((emoji, index) => (
          <Button
            key={emoji + index}
            variant="outline"
            className="text-2xl p-2 h-12 w-12"
            onClick={() => handleAddSticker(emoji)}
          >
            {emoji}
          </Button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleContainerClick}
      >
        {image ? (
          <img
            src={image}
            alt="Uploaded"
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}

        {stickers.map((sticker) => (
          <div
            key={sticker.id}
            className="absolute"
            style={{
              transform: `translate(${sticker.x}px, ${sticker.y}px)`,
              touchAction: 'none',
            }}
          >
            <div
              className="relative"
              style={{
                transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              }}
            >
              <div
                className="cursor-move select-none text-4xl"
                onMouseDown={(e) => handleMouseDown(e, sticker)}
                onTouchStart={(e) => handleTouchStart(e, sticker)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {sticker.content}
              </div>

              {selectedSticker?.id === sticker.id && (
                <>
                  <div
                    className="absolute -top-6 left-1/2 transform -translate-x-1/2 cursor-pointer 
                             hover:text-blue-500 transition-colors"
                    onMouseDown={(e) => handleMouseDown(e, sticker, 'rotate')}
                  >
                    <RotateCwIcon className="w-4 h-4" />
                  </div>
                  <div
                    className="absolute top-1/2 -right-6 transform -translate-y-1/2 cursor-pointer 
                             hover:text-blue-500 transition-colors"
                    onMouseDown={(e) => handleMouseDown(e, sticker, 'scale')}
                  >
                    <MaximizeIcon className="w-4 h-4" />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
                    onClick={() => handleDeleteSticker(sticker.id)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <MoveIcon className="w-4 h-4" />
          <span>Drag to move • Use handles to rotate and scale</span>
        </div>
        <div className="flex items-center gap-2">
          <SmileIcon className="w-4 h-4" />
          <span>Two-finger pinch to scale • Two-finger twist to rotate</span>
        </div>
      </div>
    </Card>
  );
};

export default App;