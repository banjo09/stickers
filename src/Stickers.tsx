import React, { useState, useRef, useEffect } from 'react';
import {
  Trash2, RotateCw, RotateCcw, Image as ImageIcon, Type, Square,
  Circle, Triangle, Star, Hexagon, Heart, Diamond, Pentagon,
  Palette, ImageIcon as NewImageIcon, Smile
} from 'lucide-react';
import { IGif } from "@giphy/js-types";
import Giphy from './Giphy';


type shapeTypes = 'square' | 'circle' | 'triangle' | 'star' | 'hexagon' | 'heart' | 'diamond' | 'pentagon'

// DONT REMOVE
// interface StickerType {
//   id: string;
//   x: number;
//   y: number;
//   rotation: number;
//   scale: number;
//   url: string;
// }

interface EditModalType {
  type: 'text' | 'shape' | 'emoji';
  stickerId: string | null;
}

interface StickerType {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  width: number;
  height: number;
  type: 'image' | 'text' | 'shape' | 'emoji' | 'gif';
  content: string;
  style?: {
    color?: string;
    fontSize?: number;
    shapeType?: shapeTypes;
    backgroundColor?: string;
    backgroundImage?: string;
  };
}

// const ShapeSVGs = {
//   square: <rect width="100%" height="100%" />,
//   circle: <ellipse cx="50%" cy="50%" rx="50%" ry="50%" />,
//   triangle: <polygon points="50,0 100,100 0,100" />
// };

const ShapeSVGs = {
  square: <rect width="100%" height="100%" />,
  circle: <ellipse cx="50%" cy="50%" rx="50%" ry="50%" />,
  triangle: <polygon points="50%,0 100%,100% 0,100%" />,
  star: (
    <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" />
  ),
  hexagon: (
    <polygon points="25,0 75,0 100,50 75,100 25,100 0,50" />
  ),
  heart: (
    <path d="M50 80 C10 40, 10 10, 50 30 C90 10, 90 40, 50 80 Z" />
  ),
  diamond: (
    <polygon points="50,0 100,50 50,100 0,50" />
  ),
  pentagon: (
    <polygon points="50,0 100,38 81,100 19,100 0,38" />
  ),
};

const EMOJI_STICKERS = [
  '❤️', '😂', '🔥', '😍', '🥰', '✨', '😊', '🎉',
  '👍', '💯', '🙌', '💪', '🤔', '😎', '💕', '🌟'
];


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


  const [editModal, setEditModal] = useState<EditModalType | null>(null);
  const [imageUploadId, setImageUploadId] = useState<string | null>(null);


  const [giphURL, setGiphURL] = useState<string | undefined>(
    "https://media1.tenor.com/m/WMCy2kbsNLUAAAAC/wedding-we-want-a-wedding.gif"
  );
  const [giphyView, setGiphyView] = useState<boolean>(false);


  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const initialRotationRef = useRef<number>(0);
  const currentStickerRotation = useRef<number>(0);
  const dragStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const stickerStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });


  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const resizeStartRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const resizeStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });


  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [shapeColor, setShapeColor] = useState('#FF5733');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const setGif = (url: string) => {
    setGiphURL(url);
    setGiphyView(false);
  };

  const addTextSticker = () => {
    if (!textInput.trim()) return;

    const newSticker: StickerType = {
      id: Math.random().toString(36).substr(2, 9),
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      width: 200,
      height: 50,
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

  const addEmojiSticker = (emoji) => {
    const newSticker: StickerType = {
      id: Math.random().toString(36),
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      width: 200,
      height: 50,
      type: 'emoji',
      content: emoji,
      style: {
        color: textColor,
        fontSize: fontSize
      }
    };

    setStickers([...stickers, newSticker]);
  };

  const addGifSticker = (url) => {
    const newSticker: StickerType = {
      id: Math.random().toString(36),
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      width: 200,
      height: 50,
      type: 'gif',
      content: url,
      style: {}
    };

    setStickers([...stickers, newSticker]);
  };

  const addShapeSticker = (shapeType: shapeTypes) => {
    const newSticker: StickerType = {
      id: Math.random().toString(36).substr(2, 9),
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      width: 100,
      height: 100,
      type: 'shape',
      content: '',
      style: {
        shapeType: shapeType,
        backgroundColor: shapeColor
      }
    };

    setStickers([...stickers, newSticker]);
  };


  const handleResizeStart = (e: React.MouseEvent, id: string, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setSelectedSticker(id);
    setResizeDirection(direction);

    const sticker = stickers.find(s => s.id === id);
    if (sticker) {
      resizeStartRef.current = {
        width: sticker.width,
        height: sticker.height
      };
      resizeStartPosRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    }
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !selectedSticker || !resizeDirection) return;

    const deltaX = e.clientX - resizeStartPosRef.current.x;
    const deltaY = e.clientY - resizeStartPosRef.current.y;

    setStickers(stickers.map(sticker => {
      if (sticker.id !== selectedSticker) return sticker;

      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;

      if (resizeDirection.includes('e')) newWidth += deltaX;
      if (resizeDirection.includes('w')) newWidth -= deltaX;
      if (resizeDirection.includes('s')) newHeight += deltaY;
      if (resizeDirection.includes('n')) newHeight -= deltaY;

      // Enforce minimum dimensions
      newWidth = Math.max(20, newWidth);
      newHeight = Math.max(20, newHeight);

      return {
        ...sticker,
        width: newWidth,
        height: newHeight
      };
    }));
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeDirection(null);
  };

  const handleShapeBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && imageUploadId) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setStickers(stickers.map(sticker =>
          sticker.id === imageUploadId
            ? {
              ...sticker,
              style: {
                ...sticker.style,
                backgroundImage: e.target?.result as string
              }
            }
            : sticker
        ));
      };
      reader.readAsDataURL(file);
      setImageUploadId(null);
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, selectedSticker, resizeDirection]
  );


  const renderSticker = (sticker: StickerType) => {
    console.log('sticker', sticker)
    switch (sticker.type) {
      case 'text':
        return (
          <div
            style={{
              color: sticker.style?.color,
              fontSize: `${sticker.style?.fontSize}px`,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
            {sticker.content}
          </div>
        );
      // case 'shape':
      //   return (
      //     <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      //       {React.cloneElement(ShapeSVGs[sticker.style?.shapeType || 'square'], {
      //         fill: sticker.style?.backgroundColor
      //       })}
      //     </svg>
      //   );

      case 'shape':
        return (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundImage: sticker.style?.backgroundImage ? `url(${sticker.style.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              {React.cloneElement(ShapeSVGs[sticker.style?.shapeType || 'square'], {
                fill: sticker.style?.backgroundColor,
                style: {
                  opacity: sticker.style?.backgroundImage ? 0.5 : 1,
                }
              })}
            </svg>
          </div>
        );
      case 'emoji':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              fontSize: `${sticker.style?.fontSize}px`,
            }}
          >
            {sticker.content}
          </div>
        );
      default:
        return <img
          src={sticker.content}
          alt="sticker"
          draggable="false"
          width='100%'
          height='100%'
        />;
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
  // console.log('stickers', stickers)

  return (
    <div className="editor-container">
      <div className="toolbar">
        <label className="upload-button">
          <ImageIcon onClick={() => fileInputRef.current?.click()} />
        </label>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
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
          <button className="toolbar-button" onClick={() => addShapeSticker('star')}>
            <Star size={20} />
          </button>
          <button className="toolbar-button" onClick={() => addShapeSticker('hexagon')}>
            <Hexagon size={20} />
          </button>
          <button className="toolbar-button" onClick={() => addShapeSticker('heart')}>
            <Heart size={20} />
          </button>
          <button className="toolbar-button" onClick={() => addShapeSticker('diamond')}>
            <Diamond size={20} />
          </button>
          <button className="toolbar-button" onClick={() => addShapeSticker('pentagon')}>
            <Pentagon size={20} />
          </button>
          <input
            type="color"
            value={shapeColor}
            onChange={(e) => setShapeColor(e.target.value)}
            className="color-picker"
          />
        </div>
        {
          giphURL && <img
            src={giphURL}
            alt={"gif"}
            style={{
              marginTop: 4,
              width: "247px",
              height: "142px"
            }}
            onClick={() => addGifSticker(giphURL)}
          />
        }
        <div
          style={{
            cursor: "pointer"
          }}
          onClick={() => setGiphyView(true)}
        >
          {!giphURL ? "add gif" : "change gif"}
        </div>
      </div>
      {
        giphyView && <Giphy
          maxWidth={280}
          onClose={() => {
            setGiphyView(false);
          }}
          selectGiphyImage={(gif: IGif) => {
            setGif(gif.images.original.url);
          }}
        />
      }
      <div className="emoji-stickers">
        {EMOJI_STICKERS.map((emoji, index) => (
          <button
            key={index}
            className="emoji-button"
            onClick={() => addEmojiSticker(emoji)}
          >
            {emoji}
          </button>
        ))}
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
      {editModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editModal.type === 'text' ? 'Edit Text' : 'Edit Shape'}</h2>

            {editModal.type === 'text' && (
              <>
                <div className="control-group">
                  <label>
                    Font Size:
                    <input
                      type="number"
                      value={stickers.find(s => s.id === editModal.stickerId)?.style?.fontSize || 24}
                      onChange={(e) => {
                        setStickers(stickers.map(sticker =>
                          sticker.id === editModal.stickerId
                            ? {
                              ...sticker,
                              style: { ...sticker.style, fontSize: Number(e.target.value) }
                            }
                            : sticker
                        ));
                      }}
                      min="12"
                      max="72"
                      className="number-input"
                    />
                  </label>
                </div>
              </>
            )}
            {editModal.type === 'emoji' && (
              <div className="control-group">
                <label>
                  Emoji Size:
                  <input
                    type="number"
                    value={stickers.find(s => s.id === editModal.stickerId)?.style?.fontSize || 48}
                    onChange={(e) => {
                      setStickers(stickers.map(sticker =>
                        sticker.id === editModal.stickerId
                          ? {
                            ...sticker,
                            style: { ...sticker.style, fontSize: Number(e.target.value) }
                          }
                          : sticker
                      ));
                    }}
                    min="24"
                    max="120"
                    className="number-input"
                  />
                </label>
              </div>
            )}

            {(editModal.type === 'text' || editModal.type === 'shape') && (
              <div className="control-group">
                <label>
                  {editModal.type === 'text' ? 'Text Color' : 'Shape Color'}:
                  <input
                    type="color"
                    value={stickers.find(s => s.id === editModal.stickerId)?.style?.color ||
                      stickers.find(s => s.id === editModal.stickerId)?.style?.backgroundColor ||
                      '#000000'}
                    onChange={(e) => {
                      setStickers(stickers.map(sticker =>
                        sticker.id === editModal.stickerId
                          ? {
                            ...sticker,
                            style: {
                              ...sticker.style,
                              [editModal.type === 'text' ? 'color' : 'backgroundColor']: e.target.value
                            }
                          }
                          : sticker
                      ));
                    }}
                    className="color-picker"
                  />
                </label>
              </div>
            )}

            <div className="modal-buttons">
              <button onClick={() => setEditModal(null)} className="button">Close</button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="canvas-container"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          objectFit: "cover"
        }}
      >
        {stickers.map((sticker) => (
          <div
            key={sticker.id}
            ref={(el) => handleRef(el, sticker)}
            className={`sticker ${selectedSticker === sticker.id ? 'selected' : ''}`}
            style={{
              transform: `translate(${sticker.x}px, ${sticker.y}px) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              position: 'absolute',
              width: `${sticker.width}px`,
              height: `${sticker.height}px`
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
                <div className="resize-handles">
                  <div className="resize-handle n" onMouseDown={(e) => handleResizeStart(e, sticker.id, 'n')} />
                  <div className="resize-handle e" onMouseDown={(e) => handleResizeStart(e, sticker.id, 'e')} />
                  <div className="resize-handle s" onMouseDown={(e) => handleResizeStart(e, sticker.id, 's')} />
                  <div className="resize-handle w" onMouseDown={(e) => handleResizeStart(e, sticker.id, 'w')} />
                  <div className="resize-handle nw" onMouseDown={(e) => handleResizeStart(e, sticker.id, 'nw')} />
                  <div className="resize-handle ne" onMouseDown={(e) => handleResizeStart(e, sticker.id, 'ne')} />
                  <div className="resize-handle se" onMouseDown={(e) => handleResizeStart(e, sticker.id, 'se')} />
                  <div className="resize-handle sw" onMouseDown={(e) => handleResizeStart(e, sticker.id, 'sw')} />
                </div>
                <div className="edit-controls">
                  {sticker.type === 'text' && (
                    <>
                      <button
                        className="edit-button"
                        onClick={() => setEditModal({ type: 'text', stickerId: sticker.id })}
                      >
                        <Type size={16} />
                      </button>
                    </>
                  )}
                  {sticker.type === 'shape' && (
                    <>
                      <button
                        className="edit-button"
                        onClick={() => setEditModal({ type: 'shape', stickerId: sticker.id })}
                      >
                        <Palette size={16} />
                      </button>
                      <label className="edit-button">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleShapeBackgroundUpload}
                          onClick={() => setImageUploadId(sticker.id)}
                          style={{ display: 'none' }}
                        />
                        <ImageIcon size={16} />
                      </label>
                    </>
                  )}
                  {sticker.type === 'emoji' && (
                    <>
                      <button
                        className="edit-button"
                        onClick={() => setEditModal({ type: 'emoji', stickerId: sticker.id })}
                      >
                        <Type size={16} />
                      </button>
                    </>
                  )}
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
            // max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            // background-color: white
            background-color: pink
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

          .resize-handles {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          }

          .resize-handle {
            position: absolute;
            width: 10px;
            height: 10px;
            background: white;
            border: 1px solid #007bff;
            border-radius: 50%;
          }

          .resize-handle.n {
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            cursor: ns-resize;
          }

          .resize-handle.e {
            right: -5px;
            top: 50%;
            transform: translateY(-50%);
            cursor: ew-resize;
          }

          .resize-handle.s {
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            cursor: ns-resize;
          }

          .resize-handle.w {
            left: -5px;
            top: 50%;
            transform: translateY(-50%);
            cursor: ew-resize;
          }

          .resize-handle.nw {
            top: -5px;
            left: -5px;
            cursor: nw-resize;
          }

          .resize-handle.ne {
            top: -5px;
            right: -5px;
            cursor: ne-resize;
          }

          .resize-handle.se {
            bottom: -5px;
            right: -5px;
            cursor: se-resize;
          }

          .resize-handle.sw {
            bottom: -5px;
            left: -5px;
            cursor: sw-resize;
          }

          .sticker {
            cursor: move;
            user-select: none;
            transition: transform 0.05s ease-out;
          }

          .edit-controls {
            position: absolute;
            top: -20px;
            left: -20px;
            display: flex;
            gap: 5px;
            z-index: 2;
          }

          .edit-button {
            background: white;
            border: 1px solid #ccc;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            padding: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .edit-button:hover {
            background: #f0f0f0;
          }
          .emoji-stickers {
            display: flex;
            flex-direction: row;
            gap: 5px;
            flex-wrap: wrap;
            margin-top: 10px;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }

          .emoji-button {
            font-size: 24px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: white;
            cursor: pointer;
          }

          .emoji-button:hover {
            background: #f0f0f0;
          }
        `}
      </style>
    </div>
  );
};

export default StickerEditor;