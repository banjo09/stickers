import React, { useState, useRef, useEffect } from 'react';
import { Trash2, RotateCw, RotateCcw, Image as ImageIcon, Type, Square, Circle, Triangle } from 'lucide-react';

// interface StickerType {
//   id: string;
//   x: number;
//   y: number;
//   rotation: number;
//   scale: number;
//   url: string;
// }

interface StickerType {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  type: 'image' | 'text' | 'shape';
  content: string;
  style?: {
    color?: string;
    fontSize?: number;
    shapeType?: 'square' | 'circle' | 'triangle';
    backgroundColor?: string;
  };
}

const ShapeSVGs = {
  square: <rect width="100" height="100" />,
  circle: <circle cx="50" cy="50" r="50" />,
  triangle: <polygon points="50,0 100,100 0,100" />
};

interface Action {
  type: 'ADD' | 'MOVE' | 'ROTATE' | 'SCALE' | 'DELETE';
  sticker: StickerType;
}

const STICKER_OPTIONS = [
  '/api/placeholder/64/64',
  '/api/placeholder/64/64',
  '/api/placeholder/64/64',
];

const STICKER_OPTIONS_IMG = [
  '/love.webp',
  '/love-vector.svg',
  // '/api/placeholder/64/64',
];

const StickerEditor: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [stickers, setStickers] = useState<StickerType[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Action[]>([]);
  const [redoStack, setRedoStack] = useState<Action[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const initialRotationRef = useRef<number>(0);
  const currentStickerRotation = useRef<number>(0);
  const dragStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const stickerStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });


  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [shapeColor, setShapeColor] = useState('#FF5733');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addTextSticker = () => {
    if (!textInput.trim()) return;

    const newSticker: StickerType = {
      id: Math.random().toString(36).substr(2, 9),
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      type: 'text',
      content: textInput,
      style: {
        color: textColor,
        fontSize: fontSize
      }
    };

    setStickers([...stickers, newSticker]);
    setTextInput('');
    setIsModalOpen(false);
  };

  const addShapeSticker = (shapeType: 'square' | 'circle' | 'triangle') => {
    const newSticker: StickerType = {
      id: Math.random().toString(36).substr(2, 9),
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      type: 'shape',
      content: '',
      style: {
        shapeType: shapeType,
        backgroundColor: shapeColor
      }
    };

    setStickers([...stickers, newSticker]);
  };

  const renderSticker = (sticker: StickerType) => {
    switch (sticker.type) {
      case 'text':
        return (
          <div
            style={{
              color: sticker.style?.color,
              fontSize: `${sticker.style?.fontSize}px`,
              padding: '10px',
              whiteSpace: 'nowrap'
            }}
          >
            {sticker.content}
          </div>
        );
      case 'shape':
        return (
          <svg width="100" height="100" viewBox="0 0 100 100">
            {React.cloneElement(ShapeSVGs[sticker.style?.shapeType || 'square'], {
              fill: sticker.style?.backgroundColor
            })}
          </svg>
        );
      default:
        return <img src={sticker.content} alt="sticker" draggable="false" />;
    }
  };

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

  // const addSticker = (url: string) => {
  //   const newSticker: StickerType = {
  //     id: Math.random().toString(36).substr(2, 9),
  //     x: 100,
  //     y: 100,
  //     rotation: 0,
  //     scale: 1,
  //     url,
  //   };

  //   setStickers([...stickers, newSticker]);
  //   setUndoStack([...undoStack, { type: 'ADD', sticker: newSticker }]);
  //   setRedoStack([]);
  // };

  const deleteSticker = (id: string) => {
    const stickerToDelete = stickers.find(s => s.id === id);
    if (stickerToDelete) {
      setStickers(stickers.filter(s => s.id !== id));
      setUndoStack([...undoStack, { type: 'DELETE', sticker: stickerToDelete }]);
      setRedoStack([]);
      setSelectedSticker(null);
    }
  };

  // Calculate angle between two points
  const getAngle = (cx: number, cy: number, ex: number, ey: number) => {
    const dy = ey - cy;
    const dx = ex - cx;
    const rad = Math.atan2(dy, dx);
    return rad * 180 / Math.PI;
  };

  // Handle rotation start
  const handleRotateStart = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    setIsRotating(true);
    setSelectedSticker(id);

    const stickerElement = stickerRefs.current[id];
    if (!stickerElement) return;

    const rect = stickerElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    initialRotationRef.current = getAngle(centerX, centerY, event.clientX, event.clientY);
    const sticker = stickers.find(s => s.id === id);
    currentStickerRotation.current = sticker?.rotation || 0;
  };

  // Handle rotation move
  const handleRotateMove = (event: MouseEvent) => {
    if (!isRotating || !selectedSticker) return;

    const stickerElement = stickerRefs.current[selectedSticker];
    if (!stickerElement) return;

    const rect = stickerElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const currentAngle = getAngle(centerX, centerY, event.clientX, event.clientY);
    const deltaAngle = currentAngle - initialRotationRef.current;

    const newRotation = currentStickerRotation.current + deltaAngle;

    setStickers(stickers.map(sticker =>
      sticker.id === selectedSticker
        ? { ...sticker, rotation: newRotation }
        : sticker
    ));
  };

  // Handle sticker dragging
  const handleStickerDragStart = (event: React.MouseEvent, id: string) => {
    if (isRotating) return;
    event.preventDefault();
    setSelectedSticker(id);
    setIsDragging(true);

    dragStartPositionRef.current = {
      x: event.clientX,
      y: event.clientY
    };

    const sticker = stickers.find(s => s.id === id);
    if (sticker) {
      stickerStartPositionRef.current = {
        x: sticker.x,
        y: sticker.y
      };
    }
  };

  const handleStickerDragMove = (event: MouseEvent) => {
    if (!isDragging || !selectedSticker) return;

    const deltaX = event.clientX - dragStartPositionRef.current.x;
    const deltaY = event.clientY - dragStartPositionRef.current.y;

    setStickers(stickers.map(sticker =>
      sticker.id === selectedSticker
        ? {
          ...sticker,
          x: stickerStartPositionRef.current.x + deltaX,
          y: stickerStartPositionRef.current.y + deltaY
        }
        : sticker
    ));
  };

  // Handle scaling with mouse wheel
  const handleWheel = (event: React.WheelEvent, id: string) => {
    event.preventDefault();
    if (id !== selectedSticker) return;

    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;

    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, sticker.scale * scaleFactor));

    const updatedSticker = {
      ...sticker,
      scale: newScale
    };

    setStickers(stickers.map(s =>
      s.id === id ? updatedSticker : s
    ));

    // Add scale action to undo stack after a delay
    clearTimeout(window.setTimeout(() => {
      setUndoStack([...undoStack, { type: 'SCALE', sticker: updatedSticker }]);
      setRedoStack([]);
    }, 500));
  };

  // Handle drag and rotation end
  const handleInteractionEnd = () => {
    if (selectedSticker) {
      const sticker = stickers.find(s => s.id === selectedSticker);
      if (sticker) {
        const actionType = isRotating ? 'ROTATE' : 'MOVE';
        setUndoStack([...undoStack, { type: actionType, sticker }]);
        setRedoStack([]);
      }
    }
    setIsDragging(false);
    setIsRotating(false);
  };

  // Add global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleStickerDragMove);
      document.addEventListener('mouseup', handleInteractionEnd);
    }
    if (isRotating) {
      document.addEventListener('mousemove', handleRotateMove);
      document.addEventListener('mouseup', handleInteractionEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleStickerDragMove);
      document.removeEventListener('mousemove', handleRotateMove);
      document.removeEventListener('mouseup', handleInteractionEnd);
    };
  }, [isDragging, isRotating, selectedSticker]);

  const handleRef = (el, sticker) => {
    stickerRefs.current[sticker.id] = el
  }

  return (
    <div className="editor-container">
      {/* <div className="toolbar">
        <label className="upload-button">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <ImageIcon />
        </label>
      </div> */}
      <div className="toolbar">
        <button className="toolbar-button" onClick={() => setIsModalOpen(true)}>
          <Type size={20} />
        </button>

        <div className="shape-tools">
          <button className="toolbar-button" onClick={() => addShapeSticker('square')}>
            <Square size={20} />
          </button>
          <button className="toolbar-button" onClick={() => addShapeSticker('circle')}>
            <Circle size={20} />
          </button>
          <button className="toolbar-button" onClick={() => addShapeSticker('triangle')}>
            <Triangle size={20} />
          </button>
          <input
            type="color"
            value={shapeColor}
            onChange={(e) => setShapeColor(e.target.value)}
            className="color-picker"
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Text Sticker</h2>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="text-input"
            />
            <div className="control-group">
              <label>
                Color:
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="color-picker"
                />
              </label>
            </div>
            <div className="control-group">
              <label>
                Font Size:
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  min="12"
                  max="72"
                  className="number-input"
                />
              </label>
            </div>
            <div className="modal-buttons">
              <button onClick={addTextSticker} className="button primary">Add</button>
              <button onClick={() => setIsModalOpen(false)} className="button">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="canvas-container"
        style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none' }}
      >
        {stickers.map((sticker) => (
          <div
            key={sticker.id}
            // ref={el => stickerRefs.current[sticker.id] = el}
            ref={(el) => handleRef(el, sticker)}
            className={`sticker ${selectedSticker === sticker.id ? 'selected' : ''}`}
            style={{
              transform: `translate(${sticker.x}px, ${sticker.y}px) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              position: 'absolute',
            }}
            onMouseDown={(e) => handleStickerDragStart(e, sticker.id)}
            onWheel={(e) => handleWheel(e, sticker.id)}
          >
            {/* <img src={sticker.url} alt="sticker" draggable="false" /> */}
            {renderSticker(sticker)}
            {selectedSticker === sticker.id && (
              <>
                <button
                  className="delete-button"
                  onClick={() => deleteSticker(sticker.id)}
                >
                  <Trash2 size={16} />
                </button>
                <div
                  className="rotate-handle"
                  onMouseDown={(e) => handleRotateStart(e, sticker.id)}
                >
                  <RotateCw size={16} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>


      {/* <div className="sticker-options">
        {STICKER_OPTIONS_IMG.map((url, index) => (
          <button
            key={index}
            className="sticker-option"
            onClick={() => addSticker(url)}
          >
            <img src={url} alt={`sticker option ${index + 1}`} />
          </button>
        ))}
      </div> */}

      {/* <div className="instructions">
        • Click and drag sticker to move
        • Use rotation handle (↻) to rotate
        • Mouse wheel to scale up/down
      </div> */}

      <div className="instructions">
        • Click text icon to add custom text
        • Click shape icons to add shapes
        • Use color picker to change shape colors
        • Click and drag to move
        • Use rotation handle (↻) to rotate
        • Mouse wheel to scale up/down
      </div>

      {/* <style>
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
            cursor: move;
            user-select: none;
            transition: transform 0.05s ease-out;
          }

          .sticker img {
            width: 100px;
            height: 100px;
            pointer-events: none;
          }

          .sticker.selected {
            outline: 2px solid #007bff;
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
            z-index: 2;
          }

          .rotate-handle {
            position: absolute;
            bottom: -20px;
            right: -20px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2;
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

          .instructions {
            margin-top: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 14px;
            line-height: 1.5;
          }
        `}
      </style> */}
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
            gap: 20px;
            margin-bottom: 20px;
            align-items: center;
          }

          .toolbar-button {
            padding: 8px;
            border: 1px solid #ccc;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .toolbar-button:hover {
            background: #f0f0f0;
          }

          .shape-tools {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .color-picker {
            width: 40px;
            height: 40px;
            padding: 0;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal {
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 100%;
            max-width: 400px;
          }

          .modal h2 {
            margin: 0 0 20px 0;
          }

          .text-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-bottom: 15px;
          }

          .control-group {
            margin-bottom: 15px;
          }

          .control-group label {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .number-input {
            width: 60px;
            padding: 4px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }

          .modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
          }

          .button {
            padding: 8px 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
            background: white;
          }

          .button.primary {
            background: #007bff;
            color: white;
            border-color: #0056b3;
          }

          .button:hover {
            opacity: 0.9;
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
            cursor: move;
            user-select: none;
            transition: transform 0.05s ease-out;
          }

          .sticker.selected {
            outline: 2px solid #007bff;
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
            z-index: 2;
          }

          .rotate-handle {
            position: absolute;
            bottom: -20px;
            right: -20px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2;
          }

          .instructions {
            margin-top: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 14px;
            line-height: 1.5;
          }
        `}
      </style>
    </div>
  );
};

export default StickerEditor;