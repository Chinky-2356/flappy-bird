/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, Trophy, Sparkles, Download, Copy, Check, Gamepad2, Info } from 'lucide-react';

// --- Sound Synthesizer via Web Audio API (Zero external assets) ---
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playFlap() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playScore() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // High pitched ding chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.12);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.25);
  }

  playHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Punchy noise impact
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playDie() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  playSwoosh() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

// Global sound manager instance
const soundManager = new SoundManager();

// Game types
type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  passed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

// Standalone Single HTML Code generator for 1-click copy & export
function getStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Flappy Bird - Retro Classic</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }
    body {
      background-color: #1a1e29;
      color: #ffffff;
      font-family: 'Press Start 2P', system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      touch-action: manipulation;
    }
    #game-container {
      position: relative;
      width: 100%;
      max-width: 400px;
      height: min(95vh, 660px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 4px #2b3245;
      border-radius: 12px;
      overflow: hidden;
      background: #70c5ce;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
    }
    .instructions {
      margin-top: 12px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.6;
    }
    .key-badge {
      display: inline-block;
      background: #334155;
      color: #f8fafc;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: bold;
      border-bottom: 2px solid #1e293b;
    }
  </style>
</head>
<body>

  <div id="game-container">
    <canvas id="gameCanvas" width="360" height="640"></canvas>
  </div>

  <div class="instructions">
    Flap: <span class="key-badge">Space</span> / <span class="key-badge">↑ Up Arrow</span> / <span class="key-badge">Tap Screen</span>
  </div>

  <script>
    // --- Standalone Flappy Bird Game Engine ---
    (function () {
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      const container = document.getElementById('game-container');

      // Virtual dimensions
      const V_WIDTH = 360;
      const V_HEIGHT = 640;
      const GROUND_HEIGHT = 110;
      const PIPE_WIDTH = 58;
      const PIPE_GAP = 135;
      const PIPE_SPEED = 2.4;

      // Audio Synthesizer
      class SoundFX {
        constructor() {
          this.ctx = null;
        }
        init() {
          if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) this.ctx = new AC();
          }
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
          }
        }
        playFlap() {
          this.init();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
        }
        playScore() {
          this.init();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(987, now);
          osc2.frequency.setValueAtTime(1318, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.12);
          osc2.start(now + 0.08);
          osc2.stop(now + 0.25);
        }
        playHit() {
          this.init();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const bufLen = this.ctx.sampleRate * 0.12;
          const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.3));
          const noise = this.ctx.createBufferSource();
          noise.buffer = buf;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);
          filter.frequency.exponentialRampToValueAtTime(100, now + 0.12);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start(now);
        }
        playDie() {
          this.init();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
        }
      }

      const sounds = new SoundFX();

      // State
      let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER'
      let score = 0;
      let displayedScore = 0;
      let highScore = parseInt(localStorage.getItem('flappy_bird_high_score') || '0', 10);
      let frames = 0;
      let groundOffset = 0;
      let shakeTimer = 0;
      let flashAlpha = 0;
      let restartAllowedAt = 0;

      // Bird
      const bird = {
        x: 85,
        y: 260,
        radius: 13,
        velocity: 0,
        gravity: 0.28,
        jump: -5.8,
        rotation: 0,
        wingFrame: 0,
        reset() {
          this.x = 85;
          this.y = 260;
          this.velocity = 0;
          this.rotation = 0;
          this.wingFrame = 0;
        },
        flap() {
          this.velocity = this.jump;
          sounds.playFlap();
          createFeathers(this.x, this.y);
        },
        update() {
          if (gameState === 'START') {
            this.y = 260 + Math.sin(frames * 0.08) * 8;
            this.rotation = 0;
            this.wingFrame = (this.wingFrame + 0.15) % 3;
            return;
          }

          this.velocity += this.gravity;
          if (this.velocity > 9) this.velocity = 9;
          this.y += this.velocity;

          // Rotation
          if (this.velocity < 0) {
            this.rotation = Math.max(-0.45, this.velocity * 0.08);
          } else {
            this.rotation = Math.min(1.4, this.rotation + 0.06);
          }

          if (gameState === 'PLAYING') {
            this.wingFrame = (this.wingFrame + (this.velocity < 2 ? 0.25 : 0.1)) % 3;
          }
        }
      };

      // Pipes & Particles
      let pipes = [];
      let particles = [];

      function spawnPipe() {
        const minH = 60;
        const maxH = V_HEIGHT - GROUND_HEIGHT - PIPE_GAP - minH;
        const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
        pipes.push({
          x: V_WIDTH + 10,
          topHeight: topH,
          bottomY: topH + PIPE_GAP,
          width: PIPE_WIDTH,
          passed: false
        });
      }

      function createFeathers(x, y) {
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: x - 8,
            y: y + (Math.random() * 8 - 4),
            vx: -Math.random() * 2 - 0.5,
            vy: Math.random() * 2 - 1,
            size: Math.random() * 3 + 2,
            color: '#facc15',
            alpha: 1,
            decay: 0.03
          });
        }
      }

      function createExplosion(x, y) {
        for (let i = 0; i < 16; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 4 + 1;
          particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            color: i % 2 === 0 ? '#facc15' : '#f97316',
            alpha: 1,
            decay: 0.025
          });
        }
      }

      function checkCollisions() {
        // Ground
        if (bird.y + bird.radius >= V_HEIGHT - GROUND_HEIGHT) {
          bird.y = V_HEIGHT - GROUND_HEIGHT - bird.radius;
          triggerGameOver();
          return;
        }

        // Ceiling
        if (bird.y - bird.radius <= 0) {
          bird.y = bird.radius;
          bird.velocity = 0.5;
        }

        // Pipes
        for (let i = 0; i < pipes.length; i++) {
          const p = pipes[i];
          const birdLeft = bird.x - bird.radius + 3;
          const birdRight = bird.x + bird.radius - 3;
          const birdTop = bird.y - bird.radius + 3;
          const birdBottom = bird.y + bird.radius - 3;

          if (birdRight > p.x && birdLeft < p.x + p.width) {
            if (birdTop < p.topHeight || birdBottom > p.bottomY) {
              triggerGameOver();
              return;
            }
          }

          // Score check
          if (!p.passed && p.x + p.width / 2 < bird.x) {
            p.passed = true;
            score++;
            sounds.playScore();
            if (score > highScore) {
              highScore = score;
              localStorage.setItem('flappy_bird_high_score', highScore.toString());
            }
          }
        }
      }

      function triggerGameOver() {
        if (gameState === 'GAMEOVER') return;
        gameState = 'GAMEOVER';
        sounds.playHit();
        setTimeout(() => sounds.playDie(), 120);
        shakeTimer = 16;
        flashAlpha = 0.7;
        displayedScore = 0;
        restartAllowedAt = Date.now() + 400;
        createExplosion(bird.x, bird.y);
      }

      function resetGame() {
        bird.reset();
        pipes = [];
        particles = [];
        score = 0;
        displayedScore = 0;
        frames = 0;
        flashAlpha = 0;
        gameState = 'START';
      }

      function handleAction() {
        if (gameState === 'START') {
          gameState = 'PLAYING';
          bird.flap();
        } else if (gameState === 'PLAYING') {
          bird.flap();
        } else if (gameState === 'GAMEOVER') {
          if (Date.now() >= restartAllowedAt) {
            resetGame();
          }
        }
      }

      // Input listeners
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp' || e.key === 'ArrowUp') {
          e.preventDefault();
          handleAction();
        }
      });

      canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handleAction();
      });

      // --- Drawing Functions ---
      function drawBackground() {
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT - GROUND_HEIGHT);
        skyGrad.addColorStop(0, '#4ec0ca');
        skyGrad.addColorStop(1, '#8de5eb');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT - GROUND_HEIGHT);

        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        const cloudOffset = (frames * 0.4) % (V_WIDTH + 120);
        drawCloud(V_WIDTH - cloudOffset, 120, 1.2);
        drawCloud(V_WIDTH * 1.5 - cloudOffset, 80, 0.9);

        // Skyline silhouettes
        ctx.fillStyle = '#9fe3bd';
        const cityOffset = (frames * 0.6) % 180;
        for (let x = -cityOffset - 40; x < V_WIDTH + 60; x += 45) {
          const h = 45 + Math.sin(x * 0.05) * 18;
          ctx.fillRect(x, V_HEIGHT - GROUND_HEIGHT - h, 38, h);
          // Windows
          ctx.fillStyle = '#c5f2d9';
          ctx.fillRect(x + 6, V_HEIGHT - GROUND_HEIGHT - h + 10, 8, 8);
          ctx.fillRect(x + 22, V_HEIGHT - GROUND_HEIGHT - h + 10, 8, 8);
          ctx.fillRect(x + 6, V_HEIGHT - GROUND_HEIGHT - h + 24, 8, 8);
          ctx.fillRect(x + 22, V_HEIGHT - GROUND_HEIGHT - h + 24, 8, 8);
          ctx.fillStyle = '#9fe3bd';
        }

        // Bush hills
        ctx.fillStyle = '#72ce8e';
        const hillOffset = (frames * 1.0) % 200;
        for (let x = -hillOffset - 50; x < V_WIDTH + 100; x += 60) {
          ctx.beginPath();
          ctx.arc(x, V_HEIGHT - GROUND_HEIGHT, 40, Math.PI, 0, false);
          ctx.fill();
        }
      }

      function drawCloud(x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.arc(16, -6, 22, 0, Math.PI * 2);
        ctx.arc(36, 0, 18, 0, Math.PI * 2);
        ctx.arc(18, 8, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      function drawPipes() {
        for (let i = 0; i < pipes.length; i++) {
          const p = pipes[i];
          const capHeight = 24;
          const capOverhang = 3;

          // Top Pipe
          drawPipeBody(p.x, 0, p.width, p.topHeight - capHeight);
          drawPipeCap(p.x - capOverhang, p.topHeight - capHeight, p.width + capOverhang * 2, capHeight);

          // Bottom Pipe
          drawPipeCap(p.x - capOverhang, p.bottomY, p.width + capOverhang * 2, capHeight);
          drawPipeBody(p.x, p.bottomY + capHeight, p.width, V_HEIGHT - GROUND_HEIGHT - (p.bottomY + capHeight));
        }
      }

      function drawPipeBody(x, y, w, h) {
        if (h <= 0) return;
        ctx.save();
        // Pipe 3D gradient
        const grad = ctx.createLinearGradient(x, 0, x + w, 0);
        grad.addColorStop(0, '#2d7a1d');
        grad.addColorStop(0.15, '#73c834');
        grad.addColorStop(0.4, '#a8e74a');
        grad.addColorStop(0.7, '#65b82b');
        grad.addColorStop(1, '#1b5212');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#10390a';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      }

      function drawPipeCap(x, y, w, h) {
        ctx.save();
        const grad = ctx.createLinearGradient(x, 0, x + w, 0);
        grad.addColorStop(0, '#2d7a1d');
        grad.addColorStop(0.15, '#7ad337');
        grad.addColorStop(0.4, '#b5f553');
        grad.addColorStop(0.7, '#65b82b');
        grad.addColorStop(1, '#1b5212');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#10390a';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        // Highlight line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x + 8, y + 3, 4, h - 6);
        ctx.restore();
      }

      function drawGround() {
        const groundY = V_HEIGHT - GROUND_HEIGHT;
        ctx.save();

        // Top green stripe
        ctx.fillStyle = '#73bf2e';
        ctx.fillRect(0, groundY, V_WIDTH, 14);
        ctx.fillStyle = '#579e20';
        ctx.fillRect(0, groundY + 14, V_WIDTH, 4);

        // Dirt base
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, groundY + 18, V_WIDTH, GROUND_HEIGHT - 18);

        // Repeating diagonal grass stripes
        ctx.fillStyle = '#9ee54a';
        const stripeW = 16;
        const totalW = V_WIDTH + stripeW * 2;
        ctx.beginPath();
        for (let x = -groundOffset; x < totalW; x += stripeW) {
          ctx.moveTo(x, groundY);
          ctx.lineTo(x + 8, groundY + 14);
          ctx.lineTo(x + 4, groundY + 14);
          ctx.lineTo(x - 4, groundY);
        }
        ctx.fill();

        // Ground border
        ctx.strokeStyle = '#432a13';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(V_WIDTH, groundY);
        ctx.stroke();

        ctx.restore();
      }

      function drawBird() {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.rotation);

        const wingPhase = Math.floor(bird.wingFrame);

        // Body Shadow / outline
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main Yellow Body
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly lighter yellow
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(-2, 3, 11, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Big Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(6, -4, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pupil
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(8, -4, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Beak (Orange)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(10, -1);
        ctx.lineTo(19, 2);
        ctx.lineTo(10, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Beak highlight
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.moveTo(10, -1);
        ctx.lineTo(16, 2);
        ctx.lineTo(10, 2);
        ctx.closePath();
        ctx.fill();

        // Wing
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (wingPhase === 0) {
          // Wing Up
          ctx.ellipse(-6, -6, 7, 4, -0.4, 0, Math.PI * 2);
        } else if (wingPhase === 1) {
          // Wing Mid
          ctx.ellipse(-6, 0, 7, 4, 0, 0, Math.PI * 2);
        } else {
          // Wing Down
          ctx.ellipse(-6, 5, 7, 4, 0.4, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
      }

      function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      function drawScoreDigits(num, centerX, y, size = 32) {
        const str = num.toString();
        ctx.save();
        ctx.font = \`900 \${size}px 'Courier New', monospace, sans-serif\`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Outer Shadow / Stroke
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.strokeText(str, centerX, y);

        // Bright White Fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText(str, centerX, y);
        ctx.restore();
      }

      function drawStartScreen() {
        // "GET READY" Banner
        ctx.save();
        ctx.textAlign = 'center';

        // Flappy Bird Title
        ctx.font = "900 34px 'Courier New', monospace, sans-serif";
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 6;
        ctx.strokeText('FLAPPY BIRD', V_WIDTH / 2, 130);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('FLAPPY BIRD', V_WIDTH / 2, 130);

        // Subtitle badge
        ctx.font = "bold 15px system-ui, sans-serif";
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.strokeText('READY TO FLY?', V_WIDTH / 2, 180);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('READY TO FLY?', V_WIDTH / 2, 180);

        // Tap Hand / Instruction
        const pulse = Math.sin(frames * 0.1) * 4;
        ctx.save();
        ctx.translate(V_WIDTH / 2, 360 + pulse);

        // Tap Circle Indicator
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = "900 13px system-ui, sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TAP OR JUMP', 0, 50);

        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.fillStyle = '#fef08a';
        ctx.fillText('SPACE / ↑ / CLICK', 0, 68);

        ctx.restore();
        ctx.restore();
      }

      function drawGameOverScreen() {
        ctx.save();
        ctx.textAlign = 'center';

        // "GAME OVER" Text
        ctx.font = "900 36px 'Courier New', monospace, sans-serif";
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.strokeText('GAME OVER', V_WIDTH / 2, 130);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('GAME OVER', V_WIDTH / 2, 130);

        // Score Card Container
        const cardW = 260;
        const cardH = 150;
        const cardX = (V_WIDTH - cardW) / 2;
        const cardY = 190;

        // Card Shadow & Body
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.roundRect(cardX + 4, cardY + 4, cardW, cardH, 12);
        ctx.fill();

        ctx.fillStyle = '#ded895';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 12);
        ctx.fill();
        ctx.strokeStyle = '#573a08';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Card Labels
        ctx.textAlign = 'left';
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillStyle = '#d97706';
        ctx.fillText('MEDAL', cardX + 22, cardY + 32);

        // Medal Slot
        const medalX = cardX + 50;
        const medalY = cardY + 75;
        ctx.beginPath();
        ctx.arc(medalX, medalY, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#b45309';
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Medal if score >= 10
        if (score >= 10) {
          let medalColor = '#b45309'; // Bronze
          let medalRim = '#f59e0b';
          if (score >= 40) {
            medalColor = '#e0e7ff'; // Platinum
            medalRim = '#6366f1';
          } else if (score >= 30) {
            medalColor = '#facc15'; // Gold
            medalRim = '#b45309';
          } else if (score >= 20) {
            medalColor = '#cbd5e1'; // Silver
            medalRim = '#64748b';
          }

          ctx.beginPath();
          ctx.arc(medalX, medalY, 20, 0, Math.PI * 2);
          ctx.fillStyle = medalColor;
          ctx.fill();
          ctx.strokeStyle = medalRim;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Star in medal
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('★', medalX, medalY + 6);
        }

        // Score & Best labels (Right Side)
        ctx.textAlign = 'right';
        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.fillStyle = '#b45309';
        ctx.fillText('SCORE', cardX + cardW - 20, cardY + 34);

        // Animated counting score
        if (displayedScore < score) {
          displayedScore++;
        }
        ctx.font = "900 24px 'Courier New', monospace";
        ctx.fillStyle = '#0f172a';
        ctx.fillText(displayedScore.toString(), cardX + cardW - 20, cardY + 62);

        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.fillStyle = '#b45309';
        ctx.fillText('BEST', cardX + cardW - 20, cardY + 95);

        ctx.font = "900 24px 'Courier New', monospace";
        ctx.fillStyle = '#0f172a';
        ctx.fillText(highScore.toString(), cardX + cardW - 20, cardY + 123);

        // "NEW" Badge
        if (score > 0 && score >= highScore) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.roundRect(cardX + cardW - 95, cardY + 80, 36, 16, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 10px system-ui, sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText('NEW', cardX + cardW - 77, cardY + 92);
        }

        // Restart Button
        const btnW = 160;
        const btnH = 46;
        const btnX = (V_WIDTH - btnW) / 2;
        const btnY = cardY + cardH + 30;

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 8);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = "900 16px system-ui, sans-serif";
        ctx.fillText('PLAY AGAIN', V_WIDTH / 2, btnY + 28);

        ctx.restore();
      }

      // --- Game Loop ---
      function loop() {
        frames++;

        // Screen Shake
        let shakeX = 0;
        let shakeY = 0;
        if (shakeTimer > 0) {
          shakeTimer--;
          shakeX = (Math.random() * 8 - 4);
          shakeY = (Math.random() * 8 - 4);
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Update Physics
        bird.update();

        if (gameState === 'PLAYING') {
          groundOffset = (groundOffset + PIPE_SPEED) % 16;

          // Spawn pipes
          if (frames % 100 === 0) {
            spawnPipe();
          }

          // Move pipes
          for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= PIPE_SPEED;
            if (pipes[i].x + pipes[i].width < -20) {
              pipes.splice(i, 1);
            }
          }

          checkCollisions();
        }

        // Render Everything
        drawBackground();
        drawPipes();
        drawGround();
        drawBird();
        drawParticles();

        // In-game score
        if (gameState === 'PLAYING') {
          drawScoreDigits(score, V_WIDTH / 2, 45, 38);
        } else if (gameState === 'START') {
          drawStartScreen();
        } else if (gameState === 'GAMEOVER') {
          drawGameOverScreen();
        }

        // Flash effect on hit
        if (flashAlpha > 0) {
          ctx.fillStyle = \`rgba(255, 255, 255, \${flashAlpha})\`;
          ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
          flashAlpha = Math.max(0, flashAlpha - 0.05);
        }

        ctx.restore();

        requestAnimationFrame(loop);
      }

      requestAnimationFrame(loop);
    })();
  </script>
</body>
</html>`;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('flappy_bird_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);

  // References for mutable game loop state
  const stateRef = useRef({
    gameState: 'START' as GameState,
    score: 0,
    highScore: 0,
    frames: 0,
    groundOffset: 0,
    shakeTimer: 0,
    flashAlpha: 0,
    restartAllowedAt: 0,
    displayedScore: 0,
    bird: {
      x: 85,
      y: 260,
      radius: 13,
      velocity: 0,
      gravity: 0.28,
      jump: -5.8,
      rotation: 0,
      wingFrame: 0,
    },
    pipes: [] as Pipe[],
    particles: [] as Particle[],
  });

  // Sync stateRef high score with state
  useEffect(() => {
    stateRef.current.highScore = highScore;
  }, [highScore]);

  // Audio mute toggle
  const toggleMute = () => {
    soundManager.enabled = !soundManager.enabled;
    setIsMuted(!soundManager.enabled);
  };

  const handleCopyCode = () => {
    const code = getStandaloneHtml();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCode = () => {
    const code = getStandaloneHtml();
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flappy-bird.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Main game logic in canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const V_WIDTH = 360;
    const V_HEIGHT = 640;
    const GROUND_HEIGHT = 110;
    const PIPE_WIDTH = 58;
    const PIPE_GAP = 135;
    const PIPE_SPEED = 2.4;

    const state = stateRef.current;

    function spawnPipe() {
      const minH = 60;
      const maxH = V_HEIGHT - GROUND_HEIGHT - PIPE_GAP - minH;
      const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
      state.pipes.push({
        x: V_WIDTH + 10,
        topHeight: topH,
        bottomY: topH + PIPE_GAP,
        width: PIPE_WIDTH,
        passed: false,
      });
    }

    function createFeathers(x: number, y: number) {
      for (let i = 0; i < 5; i++) {
        state.particles.push({
          x: x - 8,
          y: y + (Math.random() * 8 - 4),
          vx: -Math.random() * 2 - 0.5,
          vy: Math.random() * 2 - 1,
          size: Math.random() * 3 + 2,
          color: '#facc15',
          alpha: 1,
          decay: 0.03,
        });
      }
    }

    function createExplosion(x: number, y: number) {
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.5 + 1;
        state.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color: i % 2 === 0 ? '#facc15' : '#f97316',
          alpha: 1,
          decay: 0.025,
        });
      }
    }

    function triggerGameOver() {
      if (state.gameState === 'GAMEOVER') return;
      state.gameState = 'GAMEOVER';
      setGameState('GAMEOVER');
      soundManager.playHit();
      setTimeout(() => soundManager.playDie(), 120);
      state.shakeTimer = 16;
      state.flashAlpha = 0.75;
      state.displayedScore = 0;
      state.restartAllowedAt = Date.now() + 350;
      createExplosion(state.bird.x, state.bird.y);
    }

    function checkCollisions() {
      const bird = state.bird;
      // Ground
      if (bird.y + bird.radius >= V_HEIGHT - GROUND_HEIGHT) {
        bird.y = V_HEIGHT - GROUND_HEIGHT - bird.radius;
        triggerGameOver();
        return;
      }

      // Ceiling
      if (bird.y - bird.radius <= 0) {
        bird.y = bird.radius;
        bird.velocity = 0.5;
      }

      // Pipes
      for (let i = 0; i < state.pipes.length; i++) {
        const p = state.pipes[i];
        const birdLeft = bird.x - bird.radius + 3;
        const birdRight = bird.x + bird.radius - 3;
        const birdTop = bird.y - bird.radius + 3;
        const birdBottom = bird.y + bird.radius - 3;

        if (birdRight > p.x && birdLeft < p.x + p.width) {
          if (birdTop < p.topHeight || birdBottom > p.bottomY) {
            triggerGameOver();
            return;
          }
        }

        // Score check
        if (!p.passed && p.x + p.width / 2 < bird.x) {
          p.passed = true;
          state.score++;
          setScore(state.score);
          soundManager.playScore();
          if (state.score > state.highScore) {
            state.highScore = state.score;
            setHighScore(state.score);
            try {
              localStorage.setItem('flappy_bird_high_score', state.score.toString());
            } catch {
              // Ignore localStorage quota/errors
            }
          }
        }
      }
    }

    function drawCloud(x: number, y: number, scale: number) {
      ctx!.save();
      ctx!.translate(x, y);
      ctx!.scale(scale, scale);
      ctx!.beginPath();
      ctx!.arc(0, 0, 18, 0, Math.PI * 2);
      ctx!.arc(16, -6, 22, 0, Math.PI * 2);
      ctx!.arc(36, 0, 18, 0, Math.PI * 2);
      ctx!.arc(18, 8, 14, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawBackground() {
      // Sky
      const skyGrad = ctx!.createLinearGradient(0, 0, 0, V_HEIGHT - GROUND_HEIGHT);
      skyGrad.addColorStop(0, '#4ec0ca');
      skyGrad.addColorStop(1, '#8de5eb');
      ctx!.fillStyle = skyGrad;
      ctx!.fillRect(0, 0, V_WIDTH, V_HEIGHT - GROUND_HEIGHT);

      // Clouds
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.75)';
      const cloudOffset = (state.frames * 0.4) % (V_WIDTH + 120);
      drawCloud(V_WIDTH - cloudOffset, 120, 1.2);
      drawCloud(V_WIDTH * 1.5 - cloudOffset, 80, 0.9);

      // Skyline silhouettes
      ctx!.fillStyle = '#9fe3bd';
      const cityOffset = (state.frames * 0.6) % 180;
      for (let x = -cityOffset - 40; x < V_WIDTH + 60; x += 45) {
        const h = 45 + Math.sin(x * 0.05) * 18;
        ctx!.fillRect(x, V_HEIGHT - GROUND_HEIGHT - h, 38, h);
        ctx!.fillStyle = '#c5f2d9';
        ctx!.fillRect(x + 6, V_HEIGHT - GROUND_HEIGHT - h + 10, 8, 8);
        ctx!.fillRect(x + 22, V_HEIGHT - GROUND_HEIGHT - h + 10, 8, 8);
        ctx!.fillRect(x + 6, V_HEIGHT - GROUND_HEIGHT - h + 24, 8, 8);
        ctx!.fillRect(x + 22, V_HEIGHT - GROUND_HEIGHT - h + 24, 8, 8);
        ctx!.fillStyle = '#9fe3bd';
      }

      // Bush hills
      ctx!.fillStyle = '#72ce8e';
      const hillOffset = (state.frames * 1.0) % 200;
      for (let x = -hillOffset - 50; x < V_WIDTH + 100; x += 60) {
        ctx!.beginPath();
        ctx!.arc(x, V_HEIGHT - GROUND_HEIGHT, 40, Math.PI, 0, false);
        ctx!.fill();
      }
    }

    function drawPipeBody(x: number, y: number, w: number, h: number) {
      if (h <= 0) return;
      ctx!.save();
      const grad = ctx!.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#2d7a1d');
      grad.addColorStop(0.15, '#73c834');
      grad.addColorStop(0.4, '#a8e74a');
      grad.addColorStop(0.7, '#65b82b');
      grad.addColorStop(1, '#1b5212');

      ctx!.fillStyle = grad;
      ctx!.fillRect(x, y, w, h);
      ctx!.strokeStyle = '#10390a';
      ctx!.lineWidth = 2.5;
      ctx!.strokeRect(x, y, w, h);
      ctx!.restore();
    }

    function drawPipeCap(x: number, y: number, w: number, h: number) {
      ctx!.save();
      const grad = ctx!.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#2d7a1d');
      grad.addColorStop(0.15, '#7ad337');
      grad.addColorStop(0.4, '#b5f553');
      grad.addColorStop(0.7, '#65b82b');
      grad.addColorStop(1, '#1b5212');

      ctx!.fillStyle = grad;
      ctx!.fillRect(x, y, w, h);
      ctx!.strokeStyle = '#10390a';
      ctx!.lineWidth = 2.5;
      ctx!.strokeRect(x, y, w, h);

      ctx!.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx!.fillRect(x + 8, y + 3, 4, h - 6);
      ctx!.restore();
    }

    function drawPipes() {
      for (let i = 0; i < state.pipes.length; i++) {
        const p = state.pipes[i];
        const capHeight = 24;
        const capOverhang = 3;

        // Top Pipe
        drawPipeBody(p.x, 0, p.width, p.topHeight - capHeight);
        drawPipeCap(p.x - capOverhang, p.topHeight - capHeight, p.width + capOverhang * 2, capHeight);

        // Bottom Pipe
        drawPipeCap(p.x - capOverhang, p.bottomY, p.width + capOverhang * 2, capHeight);
        drawPipeBody(p.x, p.bottomY + capHeight, p.width, V_HEIGHT - GROUND_HEIGHT - (p.bottomY + capHeight));
      }
    }

    function drawGround() {
      const groundY = V_HEIGHT - GROUND_HEIGHT;
      ctx!.save();

      // Top green stripe
      ctx!.fillStyle = '#73bf2e';
      ctx!.fillRect(0, groundY, V_WIDTH, 14);
      ctx!.fillStyle = '#579e20';
      ctx!.fillRect(0, groundY + 14, V_WIDTH, 4);

      // Dirt base
      ctx!.fillStyle = '#ded895';
      ctx!.fillRect(0, groundY + 18, V_WIDTH, GROUND_HEIGHT - 18);

      // Stripes
      ctx!.fillStyle = '#9ee54a';
      const stripeW = 16;
      const totalW = V_WIDTH + stripeW * 2;
      ctx!.beginPath();
      for (let x = -state.groundOffset; x < totalW; x += stripeW) {
        ctx!.moveTo(x, groundY);
        ctx!.lineTo(x + 8, groundY + 14);
        ctx!.lineTo(x + 4, groundY + 14);
        ctx!.lineTo(x - 4, groundY);
      }
      ctx!.fill();

      // Border line
      ctx!.strokeStyle = '#432a13';
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(0, groundY);
      ctx!.lineTo(V_WIDTH, groundY);
      ctx!.stroke();

      ctx!.restore();
    }

    function drawBird() {
      const bird = state.bird;
      ctx!.save();
      ctx!.translate(bird.x, bird.y);
      ctx!.rotate(bird.rotation);

      const wingPhase = Math.floor(bird.wingFrame);

      // Body Outline
      ctx!.fillStyle = '#1e293b';
      ctx!.beginPath();
      ctx!.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
      ctx!.fill();

      // Body
      ctx!.fillStyle = '#facc15';
      ctx!.beginPath();
      ctx!.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
      ctx!.fill();

      // Belly
      ctx!.fillStyle = '#fef08a';
      ctx!.beginPath();
      ctx!.ellipse(-2, 3, 11, 7, 0, 0, Math.PI * 2);
      ctx!.fill();

      // Eye
      ctx!.fillStyle = '#ffffff';
      ctx!.beginPath();
      ctx!.arc(6, -4, 5.5, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = '#1e293b';
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Pupil
      ctx!.fillStyle = '#0f172a';
      ctx!.beginPath();
      ctx!.arc(8, -4, 2.2, 0, Math.PI * 2);
      ctx!.fill();

      // Beak
      ctx!.fillStyle = '#ea580c';
      ctx!.beginPath();
      ctx!.moveTo(10, -1);
      ctx!.lineTo(19, 2);
      ctx!.lineTo(10, 6);
      ctx!.closePath();
      ctx!.fill();
      ctx!.strokeStyle = '#7c2d12';
      ctx!.lineWidth = 1.2;
      ctx!.stroke();

      // Beak Highlight
      ctx!.fillStyle = '#fb923c';
      ctx!.beginPath();
      ctx!.moveTo(10, -1);
      ctx!.lineTo(16, 2);
      ctx!.lineTo(10, 2);
      ctx!.closePath();
      ctx!.fill();

      // Wing
      ctx!.fillStyle = '#ffffff';
      ctx!.beginPath();
      if (wingPhase === 0) {
        ctx!.ellipse(-6, -6, 7, 4, -0.4, 0, Math.PI * 2);
      } else if (wingPhase === 1) {
        ctx!.ellipse(-6, 0, 7, 4, 0, 0, Math.PI * 2);
      } else {
        ctx!.ellipse(-6, 5, 7, 4, 0.4, 0, Math.PI * 2);
      }
      ctx!.fill();
      ctx!.strokeStyle = '#b45309';
      ctx!.lineWidth = 1.2;
      ctx!.stroke();

      ctx!.restore();
    }

    function drawParticles() {
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        ctx!.save();
        ctx!.globalAlpha = p.alpha;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
    }

    function drawScoreDigits(num: number, centerX: number, y: number, size = 32) {
      const str = num.toString();
      ctx!.save();
      ctx!.font = `900 ${size}px 'Courier New', monospace, sans-serif`;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'top';

      // Outline
      ctx!.strokeStyle = '#000000';
      ctx!.lineWidth = 6;
      ctx!.lineJoin = 'round';
      ctx!.strokeText(str, centerX, y);

      // White fill
      ctx!.fillStyle = '#ffffff';
      ctx!.fillText(str, centerX, y);
      ctx!.restore();
    }

    function drawStartScreen() {
      ctx!.save();
      ctx!.textAlign = 'center';

      // Title
      ctx!.font = "900 34px 'Courier New', monospace, sans-serif";
      ctx!.strokeStyle = '#1e293b';
      ctx!.lineWidth = 6;
      ctx!.strokeText('FLAPPY BIRD', V_WIDTH / 2, 130);
      ctx!.fillStyle = '#f59e0b';
      ctx!.fillText('FLAPPY BIRD', V_WIDTH / 2, 130);

      // Subtitle
      ctx!.font = "bold 15px system-ui, sans-serif";
      ctx!.strokeStyle = '#0f172a';
      ctx!.lineWidth = 4;
      ctx!.strokeText('READY TO FLY?', V_WIDTH / 2, 180);
      ctx!.fillStyle = '#ffffff';
      ctx!.fillText('READY TO FLY?', V_WIDTH / 2, 180);

      // Tap instructions
      const pulse = Math.sin(state.frames * 0.1) * 4;
      ctx!.save();
      ctx!.translate(V_WIDTH / 2, 360 + pulse);

      ctx!.beginPath();
      ctx!.arc(0, 0, 32, 0, Math.PI * 2);
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx!.fill();
      ctx!.strokeStyle = '#ffffff';
      ctx!.lineWidth = 2.5;
      ctx!.stroke();

      ctx!.font = "900 13px system-ui, sans-serif";
      ctx!.fillStyle = '#ffffff';
      ctx!.fillText('TAP OR JUMP', 0, 50);

      ctx!.font = "bold 11px system-ui, sans-serif";
      ctx!.fillStyle = '#fef08a';
      ctx!.fillText('SPACE / ↑ / CLICK', 0, 68);

      ctx!.restore();
      ctx!.restore();
    }

    function drawGameOverScreen() {
      ctx!.save();
      ctx!.textAlign = 'center';

      // Title
      ctx!.font = "900 36px 'Courier New', monospace, sans-serif";
      ctx!.strokeStyle = '#000000';
      ctx!.lineWidth = 6;
      ctx!.lineJoin = 'round';
      ctx!.strokeText('GAME OVER', V_WIDTH / 2, 130);
      ctx!.fillStyle = '#ef4444';
      ctx!.fillText('GAME OVER', V_WIDTH / 2, 130);

      // Card
      const cardW = 260;
      const cardH = 150;
      const cardX = (V_WIDTH - cardW) / 2;
      const cardY = 190;

      ctx!.fillStyle = '#d97706';
      ctx!.beginPath();
      ctx!.roundRect(cardX + 4, cardY + 4, cardW, cardH, 12);
      ctx!.fill();

      ctx!.fillStyle = '#ded895';
      ctx!.beginPath();
      ctx!.roundRect(cardX, cardY, cardW, cardH, 12);
      ctx!.fill();
      ctx!.strokeStyle = '#573a08';
      ctx!.lineWidth = 4;
      ctx!.stroke();

      ctx!.textAlign = 'left';
      ctx!.font = "bold 13px system-ui, sans-serif";
      ctx!.fillStyle = '#d97706';
      ctx!.fillText('MEDAL', cardX + 22, cardY + 32);

      // Medal Circle
      const medalX = cardX + 50;
      const medalY = cardY + 75;
      ctx!.beginPath();
      ctx!.arc(medalX, medalY, 24, 0, Math.PI * 2);
      ctx!.fillStyle = '#b45309';
      ctx!.fill();
      ctx!.strokeStyle = '#78350f';
      ctx!.lineWidth = 3;
      ctx!.stroke();

      if (state.score >= 10) {
        let medalColor = '#b45309'; // Bronze
        let medalRim = '#f59e0b';
        if (state.score >= 40) {
          medalColor = '#e0e7ff'; // Platinum
          medalRim = '#6366f1';
        } else if (state.score >= 30) {
          medalColor = '#facc15'; // Gold
          medalRim = '#b45309';
        } else if (state.score >= 20) {
          medalColor = '#cbd5e1'; // Silver
          medalRim = '#64748b';
        }

        ctx!.beginPath();
        ctx!.arc(medalX, medalY, 20, 0, Math.PI * 2);
        ctx!.fillStyle = medalColor;
        ctx!.fill();
        ctx!.strokeStyle = medalRim;
        ctx!.lineWidth = 2;
        ctx!.stroke();

        ctx!.fillStyle = '#ffffff';
        ctx!.font = 'bold 16px sans-serif';
        ctx!.textAlign = 'center';
        ctx!.fillText('★', medalX, medalY + 6);
      }

      ctx!.textAlign = 'right';
      ctx!.font = "bold 12px system-ui, sans-serif";
      ctx!.fillStyle = '#b45309';
      ctx!.fillText('SCORE', cardX + cardW - 20, cardY + 34);

      if (state.displayedScore < state.score) {
        state.displayedScore++;
      }
      ctx!.font = "900 24px 'Courier New', monospace";
      ctx!.fillStyle = '#0f172a';
      ctx!.fillText(state.displayedScore.toString(), cardX + cardW - 20, cardY + 62);

      ctx!.font = "bold 12px system-ui, sans-serif";
      ctx!.fillStyle = '#b45309';
      ctx!.fillText('BEST', cardX + cardW - 20, cardY + 95);

      ctx!.font = "900 24px 'Courier New', monospace";
      ctx!.fillStyle = '#0f172a';
      ctx!.fillText(state.highScore.toString(), cardX + cardW - 20, cardY + 123);

      if (state.score > 0 && state.score >= state.highScore) {
        ctx!.fillStyle = '#ef4444';
        ctx!.beginPath();
        ctx!.roundRect(cardX + cardW - 95, cardY + 80, 36, 16, 4);
        ctx!.fill();
        ctx!.fillStyle = '#ffffff';
        ctx!.font = "bold 10px system-ui, sans-serif";
        ctx!.textAlign = 'center';
        ctx!.fillText('NEW', cardX + cardW - 77, cardY + 92);
      }

      // Restart Button
      const btnW = 160;
      const btnH = 46;
      const btnX = (V_WIDTH - btnW) / 2;
      const btnY = cardY + cardH + 30;

      ctx!.fillStyle = '#22c55e';
      ctx!.beginPath();
      ctx!.roundRect(btnX, btnY, btnW, btnH, 8);
      ctx!.fill();
      ctx!.strokeStyle = '#15803d';
      ctx!.lineWidth = 3;
      ctx!.stroke();

      ctx!.fillStyle = '#ffffff';
      ctx!.textAlign = 'center';
      ctx!.font = "900 16px system-ui, sans-serif";
      ctx!.fillText('PLAY AGAIN', V_WIDTH / 2, btnY + 28);

      ctx!.restore();
    }

    let animationFrameId: number;

    function loop() {
      state.frames++;

      let shakeX = 0;
      let shakeY = 0;
      if (state.shakeTimer > 0) {
        state.shakeTimer--;
        shakeX = Math.random() * 8 - 4;
        shakeY = Math.random() * 8 - 4;
      }

      ctx!.save();
      ctx!.translate(shakeX, shakeY);

      // Update Bird
      const bird = state.bird;
      if (state.gameState === 'START') {
        bird.y = 260 + Math.sin(state.frames * 0.08) * 8;
        bird.rotation = 0;
        bird.wingFrame = (bird.wingFrame + 0.15) % 3;
      } else {
        bird.velocity += bird.gravity;
        if (bird.velocity > 9) bird.velocity = 9;
        bird.y += bird.velocity;

        if (bird.velocity < 0) {
          bird.rotation = Math.max(-0.45, bird.velocity * 0.08);
        } else {
          bird.rotation = Math.min(1.4, bird.rotation + 0.06);
        }

        if (state.gameState === 'PLAYING') {
          bird.wingFrame = (bird.wingFrame + (bird.velocity < 2 ? 0.25 : 0.1)) % 3;
        }
      }

      if (state.gameState === 'PLAYING') {
        state.groundOffset = (state.groundOffset + PIPE_SPEED) % 16;

        if (state.frames % 100 === 0) {
          spawnPipe();
        }

        for (let i = state.pipes.length - 1; i >= 0; i--) {
          state.pipes[i].x -= PIPE_SPEED;
          if (state.pipes[i].x + state.pipes[i].width < -20) {
            state.pipes.splice(i, 1);
          }
        }

        checkCollisions();
      }

      // Draw all layers
      drawBackground();
      drawPipes();
      drawGround();
      drawBird();
      drawParticles();

      if (state.gameState === 'PLAYING') {
        drawScoreDigits(state.score, V_WIDTH / 2, 45, 38);
      } else if (state.gameState === 'START') {
        drawStartScreen();
      } else if (state.gameState === 'GAMEOVER') {
        drawGameOverScreen();
      }

      if (state.flashAlpha > 0) {
        ctx!.fillStyle = `rgba(255, 255, 255, ${state.flashAlpha})`;
        ctx!.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        state.flashAlpha = Math.max(0, state.flashAlpha - 0.05);
      }

      ctx!.restore();

      animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Action handler for jump / flap
  const triggerAction = useCallback(() => {
    const state = stateRef.current;
    if (state.gameState === 'START') {
      state.gameState = 'PLAYING';
      setGameState('PLAYING');
      state.bird.velocity = state.bird.jump;
      soundManager.playFlap();
      for (let i = 0; i < 5; i++) {
        state.particles.push({
          x: state.bird.x - 8,
          y: state.bird.y + (Math.random() * 8 - 4),
          vx: -Math.random() * 2 - 0.5,
          vy: Math.random() * 2 - 1,
          size: Math.random() * 3 + 2,
          color: '#facc15',
          alpha: 1,
          decay: 0.03,
        });
      }
    } else if (state.gameState === 'PLAYING') {
      state.bird.velocity = state.bird.jump;
      soundManager.playFlap();
      for (let i = 0; i < 5; i++) {
        state.particles.push({
          x: state.bird.x - 8,
          y: state.bird.y + (Math.random() * 8 - 4),
          vx: -Math.random() * 2 - 0.5,
          vy: Math.random() * 2 - 1,
          size: Math.random() * 3 + 2,
          color: '#facc15',
          alpha: 1,
          decay: 0.03,
        });
      }
    } else if (state.gameState === 'GAMEOVER') {
      if (Date.now() >= state.restartAllowedAt) {
        state.bird.x = 85;
        state.bird.y = 260;
        state.bird.velocity = 0;
        state.bird.rotation = 0;
        state.bird.wingFrame = 0;
        state.pipes = [];
        state.particles = [];
        state.score = 0;
        setScore(0);
        state.displayedScore = 0;
        state.frames = 0;
        state.flashAlpha = 0;
        state.gameState = 'START';
        setGameState('START');
        soundManager.playSwoosh();
      }
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp' || e.key === 'ArrowUp') {
        e.preventDefault();
        triggerAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerAction]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-2 select-none overflow-hidden font-sans">
      {/* Top Controls Bar */}
      <div className="w-full max-w-sm flex items-center justify-between px-3 py-2 bg-slate-800/80 backdrop-blur rounded-t-xl border-t border-x border-slate-700/60 mb-1">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-amber-400" />
          <span className="font-bold tracking-wide text-sm text-slate-100">Flappy Bird</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded-md text-xs font-mono text-amber-400 border border-slate-700/50">
            <Trophy className="w-3.5 h-3.5" />
            <span>{highScore}</span>
          </div>

          <button
            id="mute-button"
            onClick={toggleMute}
            className="p-1.5 rounded-md hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            id="export-code-button"
            onClick={() => setShowCodeModal(true)}
            className="p-1.5 rounded-md hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Export Standalone HTML"
          >
            <Download className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Main Game Canvas Container */}
      <div
        id="game-canvas-wrapper"
        className="relative w-full max-w-sm aspect-[9/16] max-h-[82vh] rounded-b-xl overflow-hidden shadow-2xl border-b border-x border-slate-700/60 cursor-pointer touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          triggerAction();
        }}
      >
        <canvas
          ref={canvasRef}
          width={360}
          height={640}
          className="w-full h-full block"
        />
      </div>

      {/* Footer Controls & Instructions */}
      <div className="w-full max-w-sm flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200 font-mono font-bold">Space</span>
          <span>or</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200 font-mono font-bold">↑</span>
          <span>or Click to Flap</span>
        </div>

        <button
          id="copy-html-quick-btn"
          onClick={handleCopyCode}
          className="flex items-center gap-1 text-slate-400 hover:text-sky-300 transition-colors py-0.5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied HTML!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Single HTML</span>
            </>
          )}
        </button>
      </div>

      {/* Modal for Single-File HTML View / Download */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-base">Standalone Flappy Bird HTML File</h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-sm text-slate-300">
              <p>
                This self-contained code contains all graphics, audio synthesis (via Web Audio API), physics, and gameplay mechanics with zero external dependencies.
              </p>
              <div className="relative">
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-60">
                  {getStandaloneHtml().slice(0, 800) + '\n\n... [Full code ready to copy or download] ...'}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-2">
              <button
                id="modal-copy-btn"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-medium text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Entire HTML'}
              </button>
              <button
                id="modal-download-btn"
                onClick={handleDownloadCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 rounded-lg text-xs font-medium text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Download .html File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
