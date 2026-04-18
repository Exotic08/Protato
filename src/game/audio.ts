let audioCtx: AudioContext | null = null;
let isMuted = false;
let sfxVolume = 1.0;
let musicVolume = 0.5;

let isMusicPlaying = false;
let musicGainNode: GainNode | null = null;
let currentNoteIndex = 0;
let nextNoteTime = 0;
let musicSchedulerTimer: any = null;
let currentTheme: 'menu' | 'gameplay' | 'gameover' = 'menu';

const THEMES: Record<string, number[]> = {
  menu: [220, 0, 164.81, 0, 146.83, 0, 130.81, 0],
  gameplay: [110, 0, 110, 0, 146.83, 0, 164.81, 0, 110, 0, 110, 0, 130.81, 0, 146.83, 0],
  gameover: [110, 103.83, 98, 92.5]
};

export const setSfxVolume = (vol: number) => { sfxVolume = vol; };
export const setMusicVolume = (vol: number) => { 
  musicVolume = vol;
  if (musicGainNode && audioCtx) {
    musicGainNode.gain.setValueAtTime(isMuted ? 0 : musicVolume, audioCtx.currentTime);
  }
};

export const toggleMute = (mute: boolean) => {
  isMuted = mute;
  if (musicGainNode && audioCtx) {
    musicGainNode.gain.setValueAtTime(isMuted ? 0 : musicVolume, audioCtx.currentTime);
  }
};

const scheduleMusic = () => {
  if (!audioCtx || !isMusicPlaying) return;

  const notes = THEMES[currentTheme] || THEMES.menu;
  const tempo = currentTheme === 'gameplay' ? 140 : (currentTheme === 'gameover' ? 80 : 120);
  const beatLen = 60.0 / tempo / 2; // eighth notes

  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    const noteFreq = notes[currentNoteIndex % notes.length];
    
    if (noteFreq > 0 && musicGainNode && !isMuted) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = currentTheme === 'menu' ? 'sine' : (currentTheme === 'gameplay' ? 'sawtooth' : 'triangle');
      osc.frequency.setValueAtTime(noteFreq, nextNoteTime);
      
      gain.gain.setValueAtTime(0, nextNoteTime);
      gain.gain.linearRampToValueAtTime(0.05, nextNoteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + beatLen - 0.05);
      
      osc.connect(gain);
      gain.connect(musicGainNode);
      
      osc.start(nextNoteTime);
      osc.stop(nextNoteTime + beatLen);
    }
    
    if (currentTheme === 'gameover' && currentNoteIndex >= notes.length) {
      isMusicPlaying = false;
      return;
    }

    nextNoteTime += beatLen;
    currentNoteIndex++;
  }
  
  musicSchedulerTimer = setTimeout(scheduleMusic, 25);
};

export const startBGM = (theme: 'menu' | 'gameplay' | 'gameover') => {
  if (currentTheme === theme && isMusicPlaying) return;
  initAudio();
  if (!audioCtx) return;
  
  if (musicSchedulerTimer) clearTimeout(musicSchedulerTimer);

  currentTheme = theme;
  isMusicPlaying = true;
  currentNoteIndex = 0;
  nextNoteTime = audioCtx.currentTime + 0.1;
  
  if (!musicGainNode) {
    musicGainNode = audioCtx.createGain();
    musicGainNode.connect(audioCtx.destination);
    musicGainNode.gain.value = musicVolume;
  }
  
  scheduleMusic();
};

export const stopBGM = () => {
  isMusicPlaying = false;
  if (musicSchedulerTimer) clearTimeout(musicSchedulerTimer);
};

export const initAudio = () => {
  if (isMuted) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.warn('AudioContext not supported or blocked', e);
  }
};

// Old toggle mute removed

const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.05, slideFreq?: number) => {
  if (isMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideFreq), audioCtx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(vol * sfxVolume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // ignore audio errors
  }
};

const playNoise = (duration: number, vol = 0.05) => {
  if (isMuted || !audioCtx) return;
  try {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // add lowpass filter for explosion/hit thumps
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol * sfxVolume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noise.start();
  } catch(e) {}
};

// Sound Effects Library
export const playShootSound = () => playTone(300 + Math.random() * 200, 'square', 0.1, 0.02, 100);
export const playMagicSound = () => playTone(600 + Math.random() * 200, 'sine', 0.2, 0.03, 900);
export const playMeleeSound = () => playNoise(0.1, 0.03);
export const playHitSound = () => playNoise(0.1, 0.04);
export const playPlayerHitSound = () => playTone(150, 'sawtooth', 0.3, 0.05, 50);
export const playCoinSound = () => {
    playTone(800, 'sine', 0.05, 0.02);
    setTimeout(() => playTone(1200, 'sine', 0.1, 0.02), 50);
};
export const playExplosionSound = () => {
    playNoise(0.4, 0.08); // rumble
    playTone(100, 'square', 0.3, 0.05, 20); // base explosion
};
export const playLevelUpSound = () => {
    playTone(400, 'square', 0.1, 0.03);
    setTimeout(() => playTone(500, 'square', 0.1, 0.03), 100);
    setTimeout(() => playTone(600, 'square', 0.1, 0.03), 200);
    setTimeout(() => playTone(800, 'square', 0.3, 0.03), 300);
};
export const playClickSound = () => {
    initAudio(); // Initialize on first UI click if needed
    playTone(600, 'sine', 0.05, 0.03);
};
export const playBuySound = () => {
    playTone(1000, 'sine', 0.1, 0.03);
    setTimeout(() => playTone(1500, 'sine', 0.2, 0.03), 50);
};
export const playErrorSound = () => playTone(200, 'sawtooth', 0.2, 0.05, 150);
export const playDashSound = () => playTone(400, 'sine', 0.2, 0.03, 200);
export const playSummonSound = () => playTone(300, 'triangle', 0.4, 0.04, 600);
export const playDodgeSound = () => playTone(900, 'sine', 0.1, 0.02, 1200);
export const playEnemyDeathSound = () => {
    playNoise(0.1, 0.02);
    playTone(150, 'square', 0.1, 0.02, 50);
};
