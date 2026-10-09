import { SoundTheme } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playKeySound(theme: SoundTheme, volume = 0.5, isSpaceOrEnter = false) {
  if (theme === 'off' || volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1) * 0.4, now);
  masterGain.connect(ctx.destination);

  switch (theme) {
    case 'mechanical': {
      // Crisp Blue switch click: high-frequency transient + metallic resonance
      const osc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      
      const pitch = isSpaceOrEnter ? 320 : 420 + (Math.random() * 80 - 40);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      clickGain.gain.setValueAtTime(0.8, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      // Noise burst for mechanical tactile leaf snap
      const bufferSize = ctx.sampleRate * 0.015;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(isSpaceOrEnter ? 2400 : 3800, now);
      noiseFilter.Q.setValueAtTime(3, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      osc.connect(clickGain);
      clickGain.connect(masterGain);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.05);
      noise.stop(now + 0.03);
      break;
    }

    case 'creamy': {
      // Creamy deep lubed switch thock: warm bass pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = isSpaceOrEnter ? 160 : 210 + (Math.random() * 30 - 15);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.06);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
      break;
    }

    case 'bubble': {
      // Cute playful water droplet / bubble pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startFreq = isSpaceOrEnter ? 400 : 600 + (Math.random() * 100);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.8, now + 0.04);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
      break;
    }

    case 'typewriter': {
      // Old school mechanical typewriter strike
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = isSpaceOrEnter ? 180 : 260 + (Math.random() * 40);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.05);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
      break;
    }

    default:
      break;
  }
}

export function playSuccessChime(volume = 0.5) {
  const ctx = getAudioContext();
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.35, now);
  masterGain.connect(ctx.destination);

  // Pleasant major chord chime: C5, E5, G5, C6
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const noteStart = now + idx * 0.08;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.5, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(noteStart);
    osc.stop(noteStart + 0.5);
  });
}

export function playErrorSound(volume = 0.4) {
  const ctx = getAudioContext();
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.setValueAtTime(110, now + 0.04);

  gain.gain.setValueAtTime(volume * 0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}
