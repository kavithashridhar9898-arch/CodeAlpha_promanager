'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PenTool, Eraser, Trash2, Download } from 'lucide-react';
import { useSocketStore } from '@/store/socketStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

interface Point { x: number; y: number }
interface Stroke {
  color: string;
  size: number;
  points: Point[];
  isEraser: boolean;
}

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export function WhiteboardModal({ isOpen, onClose, conversationId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { socket } = useSocketStore();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Initial draw loop
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust for retina displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    
    redraw(ctx, strokes);
  }, [isOpen, strokes]);

  // Socket sync
  useEffect(() => {
    if (!socket || !isOpen) return;
    
    socket.on('whiteboard_draw_receive', (stroke: Stroke) => {
      setStrokes((prev) => [...prev, stroke]);
    });

    socket.on('whiteboard_clear_receive', () => {
      setStrokes([]);
    });

    return () => {
      socket.off('whiteboard_draw_receive');
      socket.off('whiteboard_clear_receive');
    };
  }, [socket, isOpen]);

  const redraw = (ctx: CanvasRenderingContext2D, allStrokes: Stroke[]) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    allStrokes.forEach((stroke) => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color;
      ctx.lineWidth = stroke.size;
      stroke.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const p = getCoordinates(e);
    if (!p) return;
    setIsDrawing(true);
    currentStrokeRef.current = { color, size, isEraser, points: [p] };
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    const p = getCoordinates(e);
    if (!p) return;
    
    currentStrokeRef.current.points.push(p);
    
    // Quick redraw for performance (just the current stroke over existing)
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
      ctx.lineWidth = size;
      const points = currentStrokeRef.current.points;
      ctx.beginPath();
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentStrokeRef.current) return;
    setIsDrawing(false);
    
    const finalStroke = currentStrokeRef.current;
    setStrokes((prev) => [...prev, finalStroke]);
    
    // Emit to others
    socket?.emit('whiteboard_draw' as any, { conversationId, stroke: finalStroke });
    currentStrokeRef.current = null;
  };

  const clearCanvas = () => {
    setStrokes([]);
    socket?.emit('whiteboard_clear' as any, { conversationId });
  };

  const downloadCanvas = () => {
    if (!canvasRef.current) return;
    // Fill white background before download
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(canvasRef.current, 0, 0);
      
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm shrink-0">
            <div className="flex items-center gap-6">
              <h2 className="text-lg font-bold">Collaborative Whiteboard</h2>
              
              {/* Toolbar */}
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-1 border border-border">
                <button
                  onClick={() => setIsEraser(false)}
                  className={`p-2 rounded-lg transition-colors ${!isEraser ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
                  title="Pen"
                >
                  <PenTool className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEraser(true)}
                  className={`p-2 rounded-lg transition-colors ${isEraser ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
                  title="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                {!isEraser && COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-primary shadow-sm' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="w-px h-6 bg-border mx-1" />
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-24 accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearCanvas}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={downloadCanvas}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="w-px h-6 bg-border mx-2" />
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 w-full bg-white relative cursor-crosshair overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
