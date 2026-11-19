// La Table en pixel art, animée à 12 images par seconde (en pause si l'onglet est caché).
import { useEffect, useRef } from 'react';
import { drawScene } from '../render/draw';
import { SCENE_HEIGHT, SCENE_WIDTH, type Scene } from '../render/scene';

const FPS = 12;

export function TableCanvas({ scene, flash }: { scene: Scene; flash: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ scene, flash });
  latest.current = { scene, flash };

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let frame = 0;
    const draw = () => {
      if (document.hidden) return;
      drawScene(ctx, latest.current.scene, { frame, motion: !reduced, flash: latest.current.flash });
      frame += 1;
    };
    draw();
    const timer = window.setInterval(draw, 1000 / FPS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <canvas
      ref={canvas}
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      className="pixelated mb-2 block aspect-[5/2] w-full rounded border border-stone-800 bg-night"
      role="img"
      aria-label="La Table de jeu"
    />
  );
}
