import React, { useState, useRef, useEffect } from 'react';
import { Trash2, RotateCw, RotateCcw, Image as ImageIcon, Sticker } from 'lucide-react';

// Types
interface StickerType {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  url: string;
}

interface Action {
  type: 'ADD' | 'MOVE' | 'ROTATE' | 'SCALE' | 'DELETE';
  sticker: StickerType;
}

interface Position {
  x: number;
  y: number;
}

// Available stickers
const STICKER_OPTIONS_IMG = [
  '/love.webp',
  '/love-vector.svg',
  // '/api/placeholder/64/64',
];

const STICKER_OPTIONS = [
  '😊', '❤️', '🌟', '🎉', '👍', '🔥',
  '🌈', '🎨', '🎭', '🎪', '🎯', '🎲',
  '🌺', '🍕', '🎸', '🎮', '📸', '🎪'
];
const STICKER_OPTIONSp = [
  '/api/placeholder/64/64',
  '/api/placeholder/64/64',
  '/api/placeholder/64/64',
];

const StickerEditor: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [stickers, setStickers] = useState<StickerType[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Action[]>([]);
  const [redoStack, setRedoStack] = useState<Action[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const initialTouchRef = useRef<{ x: number; y: number; angle: number; distance: number } | null>(null);
  const initialMouseRef = useRef<Position | null>(null);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add sticker
  const addSticker = (url: string) => {
    const newSticker: StickerType = {
      id: Math.random().toString(36).substr(2, 9),
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      url,
    };
    
    const action: Action = { type: 'ADD', sticker: newSticker };
    setStickers([...stickers, newSticker]);
    setUndoStack([...undoStack, action]);
    setRedoStack([]);
  };

  // Delete sticker
  const deleteSticker = (id: string) => {
    const stickerToDelete = stickers.find(s => s.id === id);
    if (stickerToDelete) {
      const action: Action = { type: 'DELETE', sticker: stickerToDelete };
      setStickers(stickers.filter(s => s.id !== id));
      setUndoStack([...undoStack, action]);
      setRedoStack([]);
      setSelectedSticker(null);
    }
  };

  // Mouse Events
  const handleMouseDown = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    setSelectedSticker(id);
    setIsDragging(true);
    initialMouseRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!isDragging || !selectedSticker || !initialMouseRef.current) return;

    const sticker = stickers.find(s => s.id === selectedSticker);
    if (!sticker) return;

    const deltaX = event.clientX - initialMouseRef.current.x;
    const deltaY = event.clientY - initialMouseRef.current.y;

    const updatedSticker = {
      ...sticker,
      x: sticker.x + deltaX,
      y: sticker.y + deltaY,
    };

    setStickers(stickers.map(s => 
      s.id === selectedSticker ? updatedSticker : s
    ));

    initialMouseRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleMouseUp = () => {
    if (selectedSticker && isDragging) {
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        const action: Action = { type: 'MOVE', sticker };
        setUndoStack([...undoStack, action]);
        setRedoStack([]);
      }
    }
    setIsDragging(false);
    initialMouseRef.current = null;
  };

  // Handle touch start
  const handleTouchStart = (event: React.TouchEvent, id: string) => {
    event.preventDefault();
    setSelectedSticker(id);
    
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      initialTouchRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        angle,
        distance,
      };
    } else {
      initialTouchRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        angle: 0,
        distance: 0,
      };
    }
  };

  // Handle touch move
  const handleTouchMove = (event: React.TouchEvent) => {
    event.preventDefault();
    if (!selectedSticker || !initialTouchRef.current) return;

    const sticker = stickers.find(s => s.id === selectedSticker);
    if (!sticker) return;

    if (event.touches.length === 2) {
      // Handle rotation and scaling
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const deltaAngle = angle - initialTouchRef.current.angle;
      const deltaScale = distance / initialTouchRef.current.distance;

      const updatedSticker = {
        ...sticker,
        rotation: sticker.rotation + (deltaAngle * 180) / Math.PI,
        scale: sticker.scale * deltaScale,
      };

      setStickers(stickers.map(s => 
        s.id === selectedSticker ? updatedSticker : s
      ));
      
      initialTouchRef.current = {
        ...initialTouchRef.current,
        angle,
        distance,
      };
    } else {
      // Handle movement
      const touch = event.touches[0];
      const deltaX = touch.clientX - initialTouchRef.current.x;
      const deltaY = touch.clientY - initialTouchRef.current.y;

      const updatedSticker = {
        ...sticker,
        x: sticker.x + deltaX,
        y: sticker.y + deltaY,
      };

      setStickers(stickers.map(s => 
        s.id === selectedSticker ? updatedSticker : s
      ));
      
      initialTouchRef.current = {
        ...initialTouchRef.current,
        x: touch.clientX,
        y: touch.clientY,
      };
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (selectedSticker) {
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        const action: Action = { type: 'MOVE', sticker };
        setUndoStack([...undoStack, action]);
        setRedoStack([]);
      }
    }
    setSelectedSticker(null);
    initialTouchRef.current = null;
  };

  // Clean up event listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [selectedSticker, stickers]);

  // Undo function
  const undo = () => {
    if (undoStack.length === 0) return;
    
    const action = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    
    switch (action.type) {
      case 'ADD':
        setStickers(stickers.filter(s => s.id !== action.sticker.id));
        break;
      case 'DELETE':
        setStickers([...stickers, action.sticker]);
        break;
      case 'MOVE':
      case 'ROTATE':
      case 'SCALE':
        setStickers(stickers.map(s => 
          s.id === action.sticker.id ? action.sticker : s
        ));
        break;
    }
    
    setRedoStack([...redoStack, action]);
  };

  // Redo function
  const redo = () => {
    if (redoStack.length === 0) return;
    
    const action = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    
    switch (action.type) {
      case 'ADD':
        setStickers([...stickers, action.sticker]);
        break;
      case 'DELETE':
        setStickers(stickers.filter(s => s.id !== action.sticker.id));
        break;
      case 'MOVE':
      case 'ROTATE':
      case 'SCALE':
        setStickers(stickers.map(s => 
          s.id === action.sticker.id ? action.sticker : s
        ));
        break;
    }
    
    setUndoStack([...undoStack, action]);
  };

  return (
    <div className="editor-container">
      <div className="toolbar">
        <label className="upload-button">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <ImageIcon />
        </label>
        
        <button onClick={undo} disabled={undoStack.length === 0}>
          <RotateCcw />
        </button>
        
        <button onClick={redo} disabled={redoStack.length === 0}>
          <RotateCw />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="canvas-container"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {stickers.map((sticker) => (
          <div
            key={sticker.id}
            className={`sticker ${selectedSticker === sticker.id ? 'selected' : ''}`}
            style={{
              transform: `translate(${sticker.x}px, ${sticker.y}px) 
                         rotate(${sticker.rotation}deg) 
                         scale(${sticker.scale})`,
            }}
            onMouseDown={(e) => handleMouseDown(e, sticker.id)}
            onMouseMove={handleMouseMove}
            onTouchStart={(e) => handleTouchStart(e, sticker.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img src={sticker.url} alt="sticker" />
            {selectedSticker === sticker.id && (
              <button
                className="delete-button"
                onClick={() => deleteSticker(sticker.id)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="sticker-options">
        {STICKER_OPTIONS.map((url, index) => (
          <button
            key={index}
            className="sticker-option"
            onClick={() => addSticker(url)}
          >
            <img src={url} alt={`sticker option ${index + 1}`} />
          </button>
        ))}
      </div>
      <div className="sticker-options">
        {STICKER_OPTIONS_IMG.map((url, index) => (
          <button
            key={index}
            className="sticker-option"
            onClick={() => addSticker(url)}
          >
            <img src={url} alt={`sticker option ${index + 1}`} />
            {url}
          </button>
        ))}
      </div>
      {/* <div className="flex flex-wrap gap-2 mb-4">
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
      </div> */}

      <style>
        {`
          .editor-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }

          .toolbar {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
          }

          .toolbar button {
            padding: 8px;
            background: none;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
          }

          .toolbar button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .canvas-container {
            width: 100%;
            height: 500px;
            border: 2px solid #ccc;
            position: relative;
            overflow: hidden;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            background-color: #f0f0f0;
          }

          .sticker {
            position: absolute;
            cursor: move;
            touch-action: none;
            user-select: none;
          }

          .sticker.selected {
            outline: 2px solid #007bff;
          }

          .sticker img {
            width: 100px;
            height: 100px;
            pointer-events: none;
            user-select: none;
          }

          .delete-button {
            position: absolute;
            top: -20px;
            right: -20px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 50%;
            padding: 4px;
            cursor: pointer;
          }

          .sticker-options {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            overflow-x: auto;
            padding: 10px;
          }

          .sticker-option {
            width: 60px;
            height: 60px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: white;
            cursor: pointer;
          }

          .sticker-option img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        `}
      </style>
    </div>
  );
};

export default StickerEditor;