import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, X, Check, RotateCcw } from 'lucide-react';

const CROP_PX   = 280;   // visible crop circle diameter (px)
const CANVAS_PX = 400;   // output image size (px)
const MIN_ZOOM  = 0.5;
const MAX_ZOOM  = 4;

export default function ImageCropModal({ file, onConfirm, onCancel }) {
  const [zoom,    setZoom]    = useState(1);
  const [offset,  setOffset]  = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [imgSrc,  setImgSrc]  = useState('');
  const [ready,   setReady]   = useState(false);

  const containerRef = useRef(null);
  const dragStart    = useRef(null);
  const imgElRef     = useRef(null);   // loaded Image element for canvas

  // Load the image and set natural size
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    const img = new Image();
    img.onload = () => {
      imgElRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      // Initial zoom: fit the smaller side to fill the crop circle
      const fit = CROP_PX / Math.min(img.naturalWidth, img.naturalHeight);
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fit)));
      setOffset({ x: 0, y: 0 });
      setReady(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Clamp offset so image always covers the crop circle
  const clampOffset = useCallback((ox, oy, z) => {
    const dispW = imgSize.w * z;
    const dispH = imgSize.h * z;
    const maxX = Math.max(0, (dispW - CROP_PX) / 2);
    const maxY = Math.max(0, (dispH - CROP_PX) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, ox)), y: Math.min(maxY, Math.max(-maxY, oy)) };
  }, [imgSize]);

  const applyZoom = useCallback(newZ => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZ));
    setZoom(z);
    setOffset(prev => clampOffset(prev.x, prev.y, z));
  }, [clampOffset]);

  // Mouse drag
  const onMouseDown = e => {
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = useCallback(e => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const c = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom);
    setOffset(c);
  }, [zoom, clampOffset]);
  const onMouseUp = () => {
    dragStart.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
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
    const dx = t.clientX - dragStart.current.mx;
    const dy = t.clientY - dragStart.current.my;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom));
  };
  const onTouchEnd = () => { dragStart.current = null; };

  // Scroll to zoom
  const onWheel = e => {
    e.preventDefault();
    applyZoom(zoom - e.deltaY * 0.002);
  };

  const reset = () => {
    if (!imgSize.w) return;
    const fit = CROP_PX / Math.min(imgSize.w, imgSize.h);
    applyZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fit)));
    setOffset({ x: 0, y: 0 });
  };

  // Produce cropped canvas → blob
  const confirm = () => {
    const img = imgElRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width  = CANVAS_PX;
    canvas.height = CANVAS_PX;
    const ctx = canvas.getContext('2d');

    // Map the center CROP_PX×CROP_PX area back to natural image coords
    const srcW = CROP_PX / zoom;
    const srcH = CROP_PX / zoom;
    const srcX = img.naturalWidth  / 2 - offset.x / zoom - srcW / 2;
    const srcY = img.naturalHeight / 2 - offset.y / zoom - srcH / 2;

    // Draw circular clip
    ctx.beginPath();
    ctx.arc(CANVAS_PX / 2, CANVAS_PX / 2, CANVAS_PX / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CANVAS_PX, CANVAS_PX);

    canvas.toBlob(blob => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.92);
  };

  const containerSz = CROP_PX + 40;  // padding around crop circle

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

        {/* Crop area */}
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
            {/* Dimmed bg */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none', zIndex: 2 }} />

            {/* Circular cutout via box-shadow */}
            <div style={{
              position: 'absolute',
              left: (containerSz - CROP_PX) / 2,
              top:  (containerSz - CROP_PX) / 2,
              width: CROP_PX,
              height: CROP_PX,
              borderRadius: '50%',
              boxShadow: `0 0 0 ${containerSz}px rgba(0,0,0,0.55)`,
              border: '2px solid rgba(255,255,255,0.7)',
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

        {/* Zoom controls */}
        <div className="px-5 py-4 space-y-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button onClick={() => applyZoom(zoom - 0.15)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500">
              <ZoomOut size={15} />
            </button>
            <input
              type="range"
              min={MIN_ZOOM * 100}
              max={MAX_ZOOM * 100}
              value={Math.round(zoom * 100)}
              onChange={e => applyZoom(parseInt(e.target.value) / 100)}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
            />
            <button onClick={() => applyZoom(zoom + 0.15)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500">
              <ZoomIn size={15} />
            </button>
            <button onClick={reset} title="Reset" className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400">
              <RotateCcw size={13} />
            </button>
          </div>
          <p className="text-center text-[11px] text-gray-400">{Math.round(zoom * 100)}% zoom</p>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={onCancel} className="btn btn-secondary flex-1">
              Cancel
            </button>
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
