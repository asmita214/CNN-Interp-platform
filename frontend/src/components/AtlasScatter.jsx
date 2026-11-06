import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getClusterColor } from '../lib/clusters';

export function AtlasScatter({
  data = [],
  selectedId = null,
  onPointClick = () => {},
  height = 620,
  interactive = true,
  highlightCluster = null,
}) {
  const canvasRef = useRef(null);
  const miniCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // Pan and Zoom transform state
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTransformRef = useRef({ x: 0, y: 0, k: 1 });

  // Compute bounding box for auto-scaling
  const bounds = useMemo(() => {
    if (!data.length) return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const padX = (maxX - minX) * 0.08 || 1;
    const padY = (maxY - minY) * 0.08 || 1;
    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [data]);

  // Transform coordinates from data space to screen pixel space
  const dataToScreen = useCallback((x, y, width, h, trans = transform) => {
    const normX = (x - bounds.minX) / (bounds.maxX - bounds.minX || 1);
    const normY = (y - bounds.minY) / (bounds.maxY - bounds.minY || 1);

    const baseScreenX = normX * width;
    const baseScreenY = (1 - normY) * h; // invert Y for canvas

    const screenX = (baseScreenX - width / 2) * trans.k + width / 2 + trans.x;
    const screenY = (baseScreenY - h / 2) * trans.k + h / 2 + trans.y;

    return { x: screenX, y: screenY };
  }, [bounds, transform]);

  // Transform coordinates from screen pixel space to data space
  const screenToData = useCallback((sx, sy, width, h, trans = transform) => {
    const baseScreenX = (sx - trans.x - width / 2) / trans.k + width / 2;
    const baseScreenY = (sy - trans.y - h / 2) / trans.k + h / 2;

    const normX = baseScreenX / width;
    const normY = 1 - (baseScreenY / h);

    const x = normX * (bounds.maxX - bounds.minX) + bounds.minX;
    const y = normY * (bounds.maxY - bounds.minY) + bounds.minY;

    return { x, y };
  }, [bounds, transform]);

  // Render main canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const h = rect.height;

    canvas.width = width * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.clearRect(0, 0, width, h);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40 * transform.k;
    const offsetX = (transform.x + width / 2) % gridSize;
    const offsetY = (transform.y + h / 2) % gridSize;

    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw points
    const pointRadius = Math.max(2.2, Math.min(5.5, 3.2 * Math.sqrt(transform.k)));

    // First pass: unclustered points (muted)
    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      if (p.cluster !== -1) continue;

      const { x: sx, y: sy } = dataToScreen(p.x, p.y, width, h);
      if (sx < -10 || sx > width + 10 || sy < -10 || sy > h + 10) continue;

      ctx.fillStyle = 'rgba(113, 113, 122, 0.35)';
      ctx.beginPath();
      ctx.arc(sx, sy, pointRadius * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    // Second pass: clustered points
    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      if (p.cluster === -1) continue;

      const isDimmed = highlightCluster !== null && p.cluster !== highlightCluster;
      const isSelected = selectedId === p.feature_id;

      const { x: sx, y: sy } = dataToScreen(p.x, p.y, width, h);
      if (sx < -10 || sx > width + 10 || sy < -10 || sy > h + 10) continue;

      const color = getClusterColor(p.cluster);

      if (isDimmed) {
        ctx.fillStyle = 'rgba(100, 100, 120, 0.18)';
        ctx.beginPath();
        ctx.arc(sx, sy, pointRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sx, sy, isSelected ? pointRadius * 1.5 : pointRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Third pass: Selected Point highlight ring
    if (selectedId != null) {
      const sel = data.find((p) => p.feature_id === selectedId);
      if (sel) {
        const { x: sx, y: sy } = dataToScreen(sel.x, sel.y, width, h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, pointRadius * 2.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, pointRadius * 3.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Fourth pass: Hovered Point highlight
    if (hoveredPoint && hoveredPoint.feature_id !== selectedId) {
      const { x: sx, y: sy } = dataToScreen(hoveredPoint.x, hoveredPoint.y, width, h);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, pointRadius * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [data, bounds, transform, selectedId, hoveredPoint, highlightCluster, dataToScreen]);

  // Render mini-map preview
  useEffect(() => {
    const miniCanvas = miniCanvasRef.current;
    if (!miniCanvas || !data.length) return;
    const ctx = miniCanvas.getContext('2d');
    if (!ctx) return;

    const w = miniCanvas.width;
    const h = miniCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw all data points scaled down
    for (let i = 0; i < data.length; i += 2) {
      const p = data[i];
      const normX = (p.x - bounds.minX) / (bounds.maxX - bounds.minX || 1);
      const normY = 1 - (p.y - bounds.minY) / (bounds.maxY - bounds.minY || 1);
      const px = normX * w;
      const py = normY * h;

      ctx.fillStyle = p.cluster === -1 ? 'rgba(100,100,110,0.3)' : getClusterColor(p.cluster);
      ctx.fillRect(px, py, 1.2, 1.2);
    }

    // Draw viewport rectangle on mini-map
    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      const mw = mainCanvas.clientWidth;
      const mh = mainCanvas.clientHeight;
      const topLeft = screenToData(0, 0, mw, mh);
      const bottomRight = screenToData(mw, mh, mw, mh);

      const vx1 = Math.max(0, ((topLeft.x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * w);
      const vy1 = Math.max(0, (1 - (topLeft.y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * h);
      const vx2 = Math.min(w, ((bottomRight.x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * w);
      const vy2 = Math.min(h, (1 - (bottomRight.y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * h);

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx1, vy1, Math.max(4, vx2 - vx1), Math.max(4, vy2 - vy1));
    }
  }, [data, bounds, transform, screenToData]);

  // Find nearest point on hover
  const handleMouseMove = (e) => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setMousePos({ x: mouseX, y: mouseY });

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setTransform({
        x: lastTransformRef.current.x + dx,
        y: lastTransformRef.current.y + dy,
        k: lastTransformRef.current.k,
      });
      return;
    }

    const { x: dataX, y: dataY } = screenToData(mouseX, mouseY, rect.width, rect.height);
    const radiusThreshold = 18 / (transform.k * (rect.width / (bounds.maxX - bounds.minX || 1)));

    let closest = null;
    let minDist = radiusThreshold * radiusThreshold;

    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      const dx = p.x - dataX;
      const dy = p.y - dataY;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }

    setHoveredPoint(closest);
  };

  const handleMouseDown = (e) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastTransformRef.current = { ...transform };
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  };

  const handleClick = () => {
    if (!interactive) return;
    if (hoveredPoint) {
      onPointClick(hoveredPoint);
    }
  };

  const handleWheel = (e) => {
    if (!interactive) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.18 : 0.85;
    const nextK = Math.max(0.6, Math.min(18, transform.k * zoomFactor));

    const nextX = mouseX - (mouseX - transform.x) * (nextK / transform.k);
    const nextY = mouseY - (mouseY - transform.y) * (nextK / transform.k);

    setTransform({ x: nextX, y: nextY, k: nextK });
  };

  const zoomIn = () => {
    setTransform((t) => ({ ...t, k: Math.min(18, t.k * 1.35) }));
  };

  const zoomOut = () => {
    setTransform((t) => ({ ...t, k: Math.max(0.6, t.k * 0.74) }));
  };

  const resetTransform = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#08080b] select-none"
      style={{ height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        className={`h-full w-full ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDraggingRef.current = false;
          setHoveredPoint(null);
        }}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Floating Zoom & Pan Controls (Top Left) */}
      {interactive && (
        <div className="absolute left-3 top-3 flex flex-col gap-1 rounded-lg border border-white/10 bg-[#0e0e13]/90 p-1 backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={zoomIn}
            title="Zoom In"
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            title="Zoom Out"
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <div className="h-px bg-white/[0.06] my-0.5" />
          <button
            type="button"
            onClick={resetTransform}
            title="Reset View"
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Floating Hover Card */}
      {interactive && hoveredPoint && (
        <div
          className="pointer-events-none absolute z-30 w-56 rounded-xl border border-white/15 bg-[#101016]/95 p-3 text-left shadow-2xl backdrop-blur-md transition-all duration-75"
          style={{
            left: `${mousePos.x + 14}px`,
            top: `${mousePos.y + 14}px`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-white">
              Feature #{hoveredPoint.feature_id}
            </span>
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: getClusterColor(hoveredPoint.cluster) }}
            />
          </div>

          <div className="mt-1 text-xs font-semibold capitalize text-zinc-200">
            {hoveredPoint.label}
          </div>

          <div className="mt-2 space-y-1 text-[11px] text-zinc-400">
            <div className="flex justify-between">
              <span className="text-zinc-500">Cluster:</span>
              <span className="text-zinc-300">
                {hoveredPoint.cluster === -1 ? 'Unclustered' : `Cluster #${hoveredPoint.cluster}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Confidence:</span>
              <span className="capitalize text-zinc-300">{hoveredPoint.confidence}</span>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-zinc-500">
              <span>UMAP:</span>
              <span>({hoveredPoint.x.toFixed(1)}, {hoveredPoint.y.toFixed(1)})</span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.08] pt-1.5 font-mono text-[10px] text-zinc-400">
            <span>Click to inspect</span>
            <span>&rarr;</span>
          </div>
        </div>
      )}

      {/* Mini-Map density visualizer (Bottom Right) */}
      {interactive && (
        <div className="absolute bottom-3 right-3 overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0e]/95 p-1.5 shadow-xl backdrop-blur-md">
          <div className="mb-1 flex items-center justify-between px-1 text-[9px] font-mono text-zinc-500">
            <span>MANIFOLD 2D</span>
          </div>
          <canvas
            ref={miniCanvasRef}
            width={100}
            height={70}
            className="rounded bg-[#050508]"
          />
        </div>
      )}
    </div>
  );
}
