import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, X, Check, RotateCcw } from 'lucide-react';

const CROP_PX   = 280;   // visible crop circle diameter (px)
const CANVAS_PX = 400;   // output image size (px)
const MAX_ZOOM  = 4;

export default function ImageCropModal({ file, onConfirm, onCancel }) {
  const [zoom,    setZoom]    = useState(1);
  const [minZoom, setMinZoom] = useState(0.05);
  const [offset,  setOffset]  = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [imgSrc,  setImgSrc]  = useState('');
  const [ready,   setReady]   = useState(false);

  const containerRef = useRef(null);
  const dragStart    = useRef(null);
  const imgElRef     = useRef(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    const img = new Image();
    img.onload = () => {
      imgElRef.current = img;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setImgSize({ w, h });
      // min zoom = smaller side exactly fills the crop circle
      const fitZoom = CROP_PX / Math.min(w, h);
      setMinZoom(fitZoom);
      setZoom(fitZoom);
      setOffset({ x: 0, y: 0 });
      setReady(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Clamp offset so the image always covers the crop circle
  const clampOffset = useCallback((ox, oy, z) => {
    const maxX = Math.max(0, (imgSize.w * z - CROP_PX) / 2);
    const maxY = Math.max(0, (imgSize.h * z - CROP_PX) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, ox)),
      y: Math.min(maxY, Math.max(-maxY, oy)),
    };
  }, [imgSize]);

  const applyZoom = useCallback((newZ, minZ = minZoom) => {
    const z = Math.min(MAX_ZOOM, Math.max(minZ, newZ));
    setZoom(z);
    setOffset(prev => clampOffset(prev.x, prev.y, z));
  }, [minZoom, clampOffset]);

  // Mouse drag
  const onMouseMove = useCallback(e => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom));
  }, [zoom, clampOffset]);

  const onMouseUp = useCallback(() => {
    dragStart.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = e => {
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Touch drag
  const onTouchStart = e => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    dragStart.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
  };
  const onTouchMove = e => {
    if (!dragStart.current || e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    setOffset(clampOffset(
      dragStart.current.ox + t.clientX - dragStart.current.mx,
      dragStart.current.oy + t.clientY - dragStart.current.my,
      zoom,
    ));
  };
  const onTouchEnd = () => { dragStart.current = null; };

  // Scroll wheel zoom
  const onWheel = e => {
    e.preventDefault();
    applyZoom(zoom - e.deltaY * 0.003);
  };

  const reset = () => {
    setZoom(minZoom);
    setOffset({ x: 0, y: 0 });
  };

  // Canvas crop → blob
  const confirm = () => {
    const img = imgElRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width  = CANVAS_PX;
    canvas.height = CANVAS_PX;
    const ctx = canvas.getContext('2d');
    const srcW = CROP_PX / zoom;
    const srcH = CROP_PX / zoom;
    const srcX = img.naturalWidth  / 2 - offset.x / zoom - srcW / 2;
    const srcY = img.naturalHeight / 2 - offset.y / zoom - srcH / 2;
    ctx.beginPath();
    ctx.arc(CANVAS_PX / 2, CANVAS_PX / 2, CANVAS_PX / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CANVAS_PX, CANVAS_PX);
    canvas.toBlob(blob => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.92);
  };

  const containerSz  = CROP_PX + 40;
  const sliderMin    = Math.round(minZoom * 100);
  const sliderMax    = MAX_ZOOM * 100;
  const sliderVal    = Math.round(zoom * 100);

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Adjust Profile Photo</h2>
            <p className="text-xs text-gray-400 mt-0.5">Drag to reposition · scroll or slider to zoom</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Crop preview */}
        <div className="flex items-center justify-center py-6 bg-gray-950">
          <div
            ref={containerRef}
            style={{ width: containerSz, height: containerSz, position: 'relative', overflow: 'hidden', borderRadius: 8 }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onWheel={onWheel}
            className="cursor-grab active:cursor-grabbing select-none"
          >
            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none', zIndex: 2 }} />

            {/* Circular cutout */}
            <div style={{
              position: 'absolute',
              left: (containerSz - CROP_PX) / 2,
              top:  (containerSz - CROP_PX) / 2,
              width: CROP_PX,
              height: CROP_PX,
              borderRadius: '50%',
              boxShadow: `0 0 0 ${containerSz}px rgba(0,0,0,0.55)`,
              border: '2px solid rgba(255,255,255,0.75)',
              pointerEvents: 'none',
              zIndex: 3,
            }} />

            {/* Image */}
            {ready && imgSrc && (
              <img
                src={imgSrc}
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top:  '50%',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                  transformOrigin: 'center',
                  width:  imgSize.w,
                  height: imgSize.h,
                  maxWidth: 'none',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => applyZoom(zoom - (MAX_ZOOM - minZoom) / 20)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"
            >
              <ZoomOut size={15} />
            </button>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              value={sliderVal}
              onChange={e => applyZoom(parseInt(e.target.value) / 100)}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
            />
            <button
              onClick={() => applyZoom(zoom + (MAX_ZOOM - minZoom) / 20)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"
            >
              <ZoomIn size={15} />
            </button>
            <button onClick={reset} title="Fit" className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400">
              <RotateCcw size={13} />
            </button>
          </div>
          <p className="text-center text-[11px] text-gray-400">{sliderVal}% zoom</p>

          <div className="flex gap-2 pt-1">
            <button onClick={onCancel} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={confirm} disabled={!ready} className="btn btn-primary flex-1 disabled:opacity-50">
              <Check size={14} className="mr-1" /> Save Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
