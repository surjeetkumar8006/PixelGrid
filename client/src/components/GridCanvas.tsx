import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move, RefreshCw, Maximize2 } from 'lucide-react';
import { BlockData, UserCursor, UserProfile } from '../types';

interface GridCanvasProps {
  grid: BlockData[];
  currentUser: UserProfile | null;
  userCursors: Map<string, UserCursor>;
  onSelectBlock: (block: BlockData) => void;
  onCursorMove: (x: number, y: number) => void;
  onResetGrid: () => void;
}

const COLS = 30;
const ROWS = 30;
const BASE_CELL_SIZE = 28;
const GAP = 2;
const BOARD_SIZE = COLS * BASE_CELL_SIZE + (COLS + 1) * GAP; // 902px

export const GridCanvas: React.FC<GridCanvasProps> = ({
  grid,
  currentUser,
  userCursors,
  onSelectBlock,
  onCursorMove,
  onResetGrid,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Hovered Cell
  const [hoveredCell, setHoveredCell] = useState<BlockData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Auto-fit zoom & centering calculation
  const resetToFit = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const fitZoom = Math.min(
        (rect.width - 40) / BOARD_SIZE,
        (rect.height - 40) / BOARD_SIZE
      );
      const clampedZoom = Math.max(0.4, Math.min(1.5, fitZoom));
      setZoom(clampedZoom);

      const centeredX = (rect.width - BOARD_SIZE * clampedZoom) / 2;
      const centeredY = (rect.height - BOARD_SIZE * clampedZoom) / 2;
      setPan({ x: Math.max(10, centeredX), y: Math.max(10, centeredY) });
    }
  }, []);

  useEffect(() => {
    resetToFit();
  }, [resetToFit]);

  // Quick lookup map for grid blocks
  const blockMap = useRef<Map<number, BlockData>>(new Map());
  useEffect(() => {
    const map = new Map<number, BlockData>();
    grid.forEach((b) => map.set(b.id, b));
    blockMap.current = map;
  }, [grid]);

  // Main Canvas Render Loop
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Apply Pan & Zoom transformations
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw Cyber Outer Board Shadow & Container
    ctx.fillStyle = '#080d1a'; // Deep space dark
    ctx.beginPath();
    ctx.roundRect(0, 0, BOARD_SIZE, BOARD_SIZE, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)'; // slate-700
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render 900 Grid Cells
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const id = y * COLS + x;
        const cell = blockMap.current.get(id);
        const posX = GAP + x * (BASE_CELL_SIZE + GAP);
        const posY = GAP + y * (BASE_CELL_SIZE + GAP);

        const isHovered = hoveredCell?.id === id;
        const isOwnedByMe = currentUser && cell?.ownerId === currentUser.id;

        // Cell background color
        if (cell?.ownerColor) {
          ctx.fillStyle = cell.ownerColor;
        } else {
          ctx.fillStyle = isHovered ? '#334155' : '#172033'; // dark blue empty cell
        }

        ctx.beginPath();
        ctx.roundRect(posX, posY, BASE_CELL_SIZE, BASE_CELL_SIZE, 5);
        ctx.fill();

        // Draw Cell Borders & Highlights
        if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (isOwnedByMe) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        } else if (cell?.ownerColor) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw Cell Index Number when zoomed in enough or hovered
        if (zoom >= 0.65 || isHovered) {
          ctx.fillStyle = cell?.ownerColor ? 'rgba(255, 255, 255, 0.85)' : '#475569';
          ctx.font = '600 8.5px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            `#${id}`,
            posX + BASE_CELL_SIZE / 2,
            posY + BASE_CELL_SIZE / 2
          );
        }
      }
    }

    // Draw Live User Cursors
    userCursors.forEach((cursor) => {
      const cursorX = cursor.x;
      const cursorY = cursor.y;

      // Glow effect under cursor
      ctx.fillStyle = cursor.color || '#3B82F6';
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Cursor Name Tag Card
      ctx.font = '700 10px Inter, sans-serif';
      const textWidth = ctx.measureText(cursor.username).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.roundRect(cursorX + 8, cursorY - 14, textWidth + 12, 18, 5);
      ctx.fill();

      ctx.strokeStyle = cursor.color || '#3B82F6';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = cursor.color || '#3B82F6';
      ctx.fillText(cursor.username, cursorX + 14, cursorY - 2);
    });

    ctx.restore();
  }, [pan, zoom, hoveredCell, currentUser, userCursors]);

  // Canvas Resize Listener
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        drawCanvas();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, grid]);

  // Coordinate Conversion Helper: Screen (Canvas Event) -> Board World Coords
  const screenToWorld = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { worldX: 0, worldY: 0, canvasX: 0, canvasY: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const worldX = (canvasX - pan.x) / zoom;
    const worldY = (canvasY - pan.y) / zoom;

    return { worldX, worldY, canvasX, canvasY };
  };

  // Convert World Coords to Grid Cell Object
  const getCellFromWorldCoords = (worldX: number, worldY: number): BlockData | null => {
    if (worldX < 0 || worldX >= BOARD_SIZE || worldY < 0 || worldY >= BOARD_SIZE) {
      return null;
    }

    const gridX = Math.floor(worldX / (BASE_CELL_SIZE + GAP));
    const gridY = Math.floor(worldY / (BASE_CELL_SIZE + GAP));

    if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
      const id = gridY * COLS + gridX;
      return (
        blockMap.current.get(id) || {
          id,
          x: gridX,
          y: gridY,
          ownerId: null,
          ownerName: null,
          ownerColor: null,
          claimedAt: null,
        }
      );
    }
    return null;
  };

  // Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY, canvasX, canvasY } = screenToWorld(e.clientX, e.clientY);
    setMousePos({ x: canvasX, y: canvasY });

    if (isPanning) {
      const dx = e.clientX - startPan.x;
      const dy = e.clientY - startPan.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }

    const cell = getCellFromWorldCoords(worldX, worldY);
    setHoveredCell(cell);

    // Send cursor position to socket
    onCursorMove(worldX, worldY);
  };

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setStartPan({ x: e.clientX, y: e.clientY });
    if (e.button === 0 && (e.shiftKey || e.altKey)) {
      setIsPanning(true);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Click Cell Event Handler
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const dragDistance = Math.hypot(e.clientX - startPan.x, e.clientY - startPan.y);
    if (dragDistance > 6) return; // Ignore drag movements

    const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
    const cell = getCellFromWorldCoords(worldX, worldY);
    if (cell) {
      onSelectBlock(cell);
    }
  };

  // Native Non-Passive Wheel Event Listener (Prevents Chrome passive listener console warnings)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(2.8, Math.max(0.4, zoom * zoomFactor));

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [zoom, pan]);

  // Zoom Controls
  const handleZoomIn = () => setZoom((prev) => Math.min(2.8, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, prev - 0.25));
  const handleResetView = () => {
    resetToFit();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[540px] lg:h-[calc(100vh-270px)] min-h-[480px] bg-slate-950/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl select-none group transition-all"
    >
      {/* Floating Glass Tooltip for Hovered Cell */}
      {hoveredCell && mousePos && !isPanning && (
        <div
          className="pointer-events-none fixed z-30 bg-slate-900/95 border border-indigo-500/40 backdrop-blur-xl rounded-xl p-3 shadow-2xl text-xs text-white transform -translate-x-1/2 -translate-y-full -mt-4 animate-fadeIn ring-1 ring-white/10"
          style={{
            left: `${mousePos.x + (canvasRef.current?.getBoundingClientRect().left || 0)}px`,
            top: `${mousePos.y + (canvasRef.current?.getBoundingClientRect().top || 0)}px`,
          }}
        >
          <div className="flex items-center gap-2 mb-1.5 border-b border-slate-800 pb-1">
            <span className="font-mono font-extrabold text-indigo-400 text-sm">
              Block #{hoveredCell.id}
            </span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
              ({hoveredCell.x}, {hoveredCell.y})
            </span>
          </div>

          {hoveredCell.ownerName ? (
            <div className="flex items-center gap-2 font-semibold">
              <span
                className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: hoveredCell.ownerColor || '#fff' }}
              />
              <span className="text-slate-200">Owner: {hoveredCell.ownerName}</span>
            </div>
          ) : (
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Status: Available</span>
            </div>
          )}
        </div>
      )}

      {/* Main HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className={`w-full h-full ${
          isPanning ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
      />

      {/* Canvas Floating Overlay Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl p-2 rounded-2xl shadow-xl">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-all active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-all active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          title="Fit Board to View"
          className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
        >
          <Maximize2 className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Fit View</span>
        </button>
        <div className="h-4 w-px bg-slate-800 mx-1" />
        <button
          onClick={onResetGrid}
          title="Reset All Claims (Demo Utility)"
          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Grid</span>
        </button>
      </div>

      {/* Canvas Hint Badge */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none bg-slate-900/80 border border-slate-800/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 flex items-center gap-2 shadow-lg">
        <Move className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span>Click cell to capture • Wheel to zoom • Shift + Drag to pan</span>
      </div>
    </div>
  );
};
