/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Configuration de Vite (l'outil qui lance le jeu en local et fabrique la version en ligne).
export default defineConfig({
  // Chemins relatifs : indispensable pour GitHub Pages, où le jeu vit dans un sous-dossier.
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    // Les tests du moteur tournent sans navigateur.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
