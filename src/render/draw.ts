// Dessin d'une Table sur un canvas de 160 × 64 pixels, agrandi par le CSS sans flou.
import type { Ambiance } from '../data/names/casinos';
import { SCENE_HEIGHT, SCENE_WIDTH, type Scene } from './scene';
import { BOSS, CAMERA, CHANDELIER, CHIP, CLASS_SPRITES, GUARD, LAMP, PALETTE, SLOT_MACHINE, type Sprite } from './sprites';

export interface DrawOptions {
  /** Numéro d'image, pour les animations (12 par seconde). */
  frame: number;
  /** false : animations réduites (réglage de l'appareil). */
  motion: boolean;
  /** Un Jackpot vient d'avoir lieu : flash doré. */
  flash: boolean;
}

const TABLE = { left: 40, right: 120, top: 28, bottom: 42, centerX: 80, centerY: 35 };

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function sprite(ctx: CanvasRenderingContext2D, art: Sprite, x: number, y: number, scale = 1) {
  art.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const color = PALETTE[row[dx]!];
      if (color) rect(ctx, x + dx * scale, y + dy * scale, scale, scale, color);
    }
  });
}

/** Les personnages sont dessinés en gros pixels (2 × 2) pour être lisibles. */
const PEOPLE_SCALE = 2;

function background(ctx: CanvasRenderingContext2D, ambiance: Ambiance, frame: number, motion: boolean) {
  const floorTop = 50;
  switch (ambiance) {
    case 'docks': {
      // Arrière-salle de planches, lampe suspendue et fumée.
      rect(ctx, 0, 0, SCENE_WIDTH, floorTop, '#1f1612');
      for (let x = 0; x < SCENE_WIDTH; x += 12) rect(ctx, x, 0, 1, floorTop, '#2a1d16');
      rect(ctx, 0, floorTop, SCENE_WIDTH, SCENE_HEIGHT - floorTop, '#140e0b');
      rect(ctx, 80, 0, 1, 6, '#3a3640');
      sprite(ctx, LAMP, 79, 6);
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = PALETTE.Y!;
      ctx.beginPath();
      ctx.moveTo(80, 9);
      ctx.lineTo(TABLE.left - 6, TABLE.bottom);
      ctx.lineTo(TABLE.right + 6, TABLE.bottom);
      ctx.fill();
      ctx.globalAlpha = 0.25;
      for (let k = 0; k < 3; k++) {
        const x = ((motion ? frame * 0.4 : 0) + k * 55) % (SCENE_WIDTH + 10) - 5;
        rect(ctx, x, 12 + k * 3, 6, 2, '#6b6570');
        rect(ctx, x + 2, 11 + k * 3, 3, 1, '#6b6570');
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'neon': {
      // Néons et machines à sous qui clignotent.
      rect(ctx, 0, 0, SCENE_WIDTH, floorTop, '#160c1e');
      const swap = motion && frame % 20 < 10;
      for (let x = 0; x < SCENE_WIDTH; x += 8) rect(ctx, x, 3, 6, 1, (x / 8) % 2 === (swap ? 1 : 0) ? PALETTE.n! : PALETTE.c!);
      rect(ctx, 0, floorTop, SCENE_WIDTH, SCENE_HEIGHT - floorTop, '#0d0812');
      sprite(ctx, SLOT_MACHINE, 4, 30);
      sprite(ctx, SLOT_MACHINE, 150, 30);
      break;
    }
    case 'velvet': {
      // Salon de velours rayé, rideaux.
      rect(ctx, 0, 0, SCENE_WIDTH, floorTop, '#3a0f19');
      for (let x = 0; x < SCENE_WIDTH; x += 6) rect(ctx, x, 0, 2, floorTop, '#45131f');
      rect(ctx, 0, 0, 10, floorTop, '#24070e');
      rect(ctx, SCENE_WIDTH - 10, 0, 10, floorTop, '#24070e');
      rect(ctx, 0, floorTop, SCENE_WIDTH, SCENE_HEIGHT - floorTop, '#1a0a0e');
      break;
    }
    case 'gold': {
      // Palace doré : colonnes et lustre.
      rect(ctx, 0, 0, SCENE_WIDTH, floorTop, '#1a140a');
      for (const x of [10, 146]) {
        rect(ctx, x, 0, 4, floorTop, PALETTE.y!);
        rect(ctx, x + 1, 0, 1, floorTop, PALETTE.Y!);
      }
      sprite(ctx, CHANDELIER, 76, 2);
      rect(ctx, 0, floorTop, SCENE_WIDTH, SCENE_HEIGHT - floorTop, '#120d06');
      rect(ctx, 0, floorTop, SCENE_WIDTH, 1, PALETTE.y!);
      break;
    }
  }
}

function table(ctx: CanvasRenderingContext2D, kind: Scene['table'], frame: number, motion: boolean) {
  const { left, right, top, bottom, centerX, centerY } = TABLE;
  // Plateau arrondi : bord en bois, tapis vert.
  rect(ctx, left + 2, top, right - left - 4, bottom - top, PALETTE.o!);
  rect(ctx, left, top + 2, right - left, bottom - top - 4, PALETTE.o!);
  rect(ctx, left + 3, top + 1, right - left - 6, bottom - top - 2, PALETTE.e!);
  rect(ctx, left + 1, top + 3, right - left - 2, bottom - top - 6, PALETTE.e!);
  rect(ctx, left + 4, top + 2, right - left - 8, 1, PALETTE.E!);
  rect(ctx, left + 2, bottom, right - left - 4, 2, PALETTE.O!);

  if (kind === 'poker') {
    for (const dx of [-8, -3, 2]) rect(ctx, centerX + dx, centerY - 2, 4, 5, PALETTE.w!);
    sprite(ctx, CHIP, centerX + 10, centerY - 1);
    sprite(ctx, CHIP, centerX + 10, centerY - 3);
  } else {
    // Roue de roulette qui tourne.
    const radius = 5;
    for (let a = 0; a < 16; a++) {
      const angle = (a / 16) * Math.PI * 2 + (motion ? frame * 0.3 : 0);
      rect(ctx, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * (radius - 1), 1, 1, a % 2 ? PALETTE.r! : PALETTE.k!);
    }
    rect(ctx, centerX - 1, centerY - 1, 2, 2, PALETTE.y!);
    const ball = motion ? -frame * 0.5 : 0;
    rect(ctx, centerX + Math.cos(ball) * 3, centerY + Math.sin(ball) * 2, 1, 1, PALETTE.w!);
  }
}

export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, options: DrawOptions) {
  const { frame, motion, flash } = options;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);

  background(ctx, scene.ambiance, frame, motion);

  // Surveillance : caméras au plafond, vigiles le long du mur.
  [6, 150, 34, 122].slice(0, scene.cameras).forEach((x) => sprite(ctx, CAMERA, x, 1));
  [
    { x: 2, y: 22 },
    { x: 142, y: 22 },
    { x: 20, y: 20 },
    { x: 124, y: 20 },
  ]
    .slice(0, scene.guards)
    .forEach(({ x, y }) => sprite(ctx, GUARD, x, y, PEOPLE_SCALE));

  // Le Boss s'assoit derrière la Table, face à l'Équipe.
  if (scene.boss) sprite(ctx, BOSS, TABLE.centerX - 8, TABLE.top - 20, PEOPLE_SCALE);

  table(ctx, scene.table, frame, motion);

  scene.seats.forEach((seat, i) => {
    const bob = motion && Math.floor(frame / 6 + i) % 2 === 0 ? 1 : 0;
    sprite(ctx, CLASS_SPRITES[seat.classId], seat.x, seat.y + bob, PEOPLE_SCALE);
    // Les jetons raflés volent de la Table vers chaque Joueur.
    if (motion) {
      const t = ((frame + i * 4) % 12) / 12;
      sprite(ctx, CHIP, TABLE.centerX + (seat.x + 7 - TABLE.centerX) * t, TABLE.centerY + (seat.y - TABLE.centerY) * t);
    }
  });

  if (scene.empty) {
    ctx.globalAlpha = 0.35;
    rect(ctx, 0, 0, SCENE_WIDTH, SCENE_HEIGHT, PALETTE.k!);
    ctx.globalAlpha = 1;
  }

  if (scene.alert && (!motion || frame % 8 < 4)) {
    rect(ctx, 0, 0, 6, 3, PALETTE.r!);
    rect(ctx, SCENE_WIDTH - 6, 0, 6, 3, PALETTE.r!);
    ctx.globalAlpha = 0.12;
    rect(ctx, 0, 0, SCENE_WIDTH, SCENE_HEIGHT, PALETTE.r!);
    ctx.globalAlpha = 1;
  }

  if (flash) {
    ctx.globalAlpha = 0.25;
    rect(ctx, 0, 0, SCENE_WIDTH, SCENE_HEIGHT, PALETTE.Y!);
    ctx.globalAlpha = 1;
    for (let k = 0; k < 10; k++) {
      rect(ctx, (k * 37 + frame * 7) % SCENE_WIDTH, (k * 13 + frame * 3) % 40, 1, 1, PALETTE.Y!);
    }
  }
}
