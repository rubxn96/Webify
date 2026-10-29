'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAudio } from '@/components/audio/AudioProvider';

export const DynamicBackdrop: React.FC = () => {
  const { currentTrack } = useAudio();
  const [rgbColor, setRgbColor] = useState<string>('225, 29, 72'); // Default subtle crimson
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!currentTrack?.thumbnail) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = currentTrack.thumbnail;

    img.onload = () => {
      try {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 40;
        canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);

        const imgData = ctx.getImageData(0, 0, 40, 40).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < imgData.length; i += 16) {
          r += imgData[i];
          g += imgData[i + 1];
          b += imgData[i + 2];
          count++;
        }

        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          setRgbColor(`${r}, ${g}, ${b}`);
        }
      } catch {
        // CORS fallback to default crimson
        setRgbColor('225, 29, 72');
      }
    };
  }, [currentTrack?.thumbnail]);

  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('webify_ambient_glow');
    if (saved === 'false') setEnabled(false);
  }, []);

  if (!enabled) return null;

  return (
    <div
      id="webify-dynamic-backdrop"
      className="pointer-events-none fixed inset-x-0 top-0 h-[38vh] transition-all duration-1000 ease-out z-0"
      style={{
        background: `radial-gradient(circle at 50% 0%, rgba(${rgbColor}, 0.16) 0%, rgba(${rgbColor}, 0.04) 45%, var(--color-canvas) 75%)`,
      }}
    />
  );
};

