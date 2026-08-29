/**
 * TWIN WHEELS — Gamer Sound Effects Synthesizer (Web Audio API)
 * Gera efeitos sonoros sci-fi / cyberpunk em tempo real sem requisições de arquivos MP3.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Normaliza o volume de 0 a 100 para um valor de ganho entre 0.0 e 0.35 (para não ser estridente).
 */
function calculateGain(volumePercent: number, maxGain = 0.35): number {
  const normalized = Math.max(0, Math.min(100, volumePercent)) / 100;
  return normalized * maxGain;
}

/**
 * Toca um som sutil de clique tático de interface gamer.
 */
export function playGamerClickSound(volumePercent = 50) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const volume = calculateGain(volumePercent, 0.15);
    const now = ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch (err) {
    console.warn("Erro ao tocar som de clique:", err);
  }
}

/**
 * Toca um bipe harmônico de sucesso sci-fi (ao registrar venda, movimentação, salvamento).
 */
export function playGamerSuccessSound(volumePercent = 50) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const volume = calculateGain(volumePercent, 0.25);

    // Nota 1 (E5 - 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // Nota 2 (B5 - 987.77Hz - acorde ascendente)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.08);
    gain2.gain.setValueAtTime(volume * 1.1, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.26);
  } catch (err) {
    console.warn("Erro ao tocar som de sucesso:", err);
  }
}

/**
 * Toca um alerta sonoro de radar tático gamer quando um membro entra online.
 */
export function playGamerOnlineAlertSound(volumePercent = 50) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const volume = calculateGain(volumePercent, 0.22);

    // Pulso de frequência sutil (523.25Hz C5 -> 1046.50Hz C6)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch (err) {
    console.warn("Erro ao tocar som de alerta online:", err);
  }
}

/**
 * Toca um pulso grave de aviso/erro.
 */
export function playGamerErrorSound(volumePercent = 50) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const volume = calculateGain(volumePercent, 0.3);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  } catch (err) {
    console.warn("Erro ao tocar som de erro:", err);
  }
}
