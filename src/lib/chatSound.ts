/**
 * Gerenciador Avançado de Efeitos Sonoros do Chat usando Web Audio API.
 * Suporta múltiplos temas sonoros sintetizados em tempo real, controle de volume e canais independentes.
 */

export type ChatSoundTheme =
  | "crystal"
  | "pop"
  | "chime"
  | "bubble"
  | "retro"
  | "cyber"
  | "electronic";

export interface ChatSoundSettings {
  enabled: boolean;
  theme: ChatSoundTheme;
  volume: number; // 0 a 100
  incomingEnabled: boolean;
  sentEnabled: boolean;
  mentionEnabled: boolean;
}

export const SOUND_THEMES: Array<{
  id: ChatSoundTheme;
  name: string;
  desc: string;
  emoji: string;
}> = [
  { id: "crystal", name: "Cristalino", desc: "Suave, elegante e cristalino (Padrão)", emoji: "💎" },
  { id: "pop", name: "Pop Moderno", desc: "Graves ágeis e responsivos estilo Discord", emoji: "🫧" },
  { id: "chime", name: "Sino Suave", desc: "Harmônicos metálicos e acolhedores", emoji: "🔔" },
  { id: "bubble", name: "Gota d'Água", desc: "Toque orgânico e relaxante de bolha", emoji: "💧" },
  { id: "retro", name: "Arcade 8-Bit", desc: "Nostálgico estilo videogame retrô", emoji: "👾" },
  { id: "cyber", name: "Cyberpunk", desc: "Varredura sintetizada e futurista", emoji: "⚡" },
  { id: "electronic", name: "Sintetizador", desc: "Acorde harmônico e moderno", emoji: "🎹" },
];

const DEFAULT_SETTINGS: ChatSoundSettings = {
  enabled: true,
  theme: "crystal",
  volume: 75,
  incomingEnabled: true,
  sentEnabled: true,
  mentionEnabled: true,
};

class ChatSoundManager {
  private ctx: AudioContext | null = null;
  private settings: ChatSoundSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem("tw_chat_sound_settings_v2");
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        return;
      }

      // Legado
      const legacyEnabled = localStorage.getItem("tw_chat_sound_enabled");
      if (legacyEnabled !== null) {
        this.settings.enabled = legacyEnabled === "true";
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  public getSettings(): ChatSoundSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<ChatSoundSettings>): ChatSoundSettings {
    this.settings = { ...this.settings, ...partial };
    try {
      localStorage.setItem("tw_chat_sound_settings_v2", JSON.stringify(this.settings));
      localStorage.setItem("tw_chat_sound_enabled", String(this.settings.enabled));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tw_chat_sound_change", { detail: this.settings })
        );
      }
    } catch {
      // ignore
    }
    return this.getSettings();
  }

  public isEnabled(): boolean {
    return this.settings.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.updateSettings({ enabled });
  }

  public toggle(): boolean {
    const next = !this.settings.enabled;
    this.setEnabled(next);
    return next;
  }

  public setTheme(theme: ChatSoundTheme): void {
    this.updateSettings({ theme });
  }

  public setVolume(volume: number): void {
    this.updateSettings({ volume: Math.max(0, Math.min(100, volume)) });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private getEffectiveGain(ctx: AudioContext, baseGain: number): GainNode {
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    const volumeMultiplier = (this.settings.volume / 100);
    gainNode.gain.setValueAtTime(baseGain * volumeMultiplier, ctx.currentTime);
    return gainNode;
  }

  /**
   * Toca o som de nova mensagem recebida com base no tema escolhido
   */
  public playIncomingMessage(themeOverride?: ChatSoundTheme): void {
    if (!this.settings.enabled || !this.settings.incomingEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const theme = themeOverride || this.settings.theme;
      const now = ctx.currentTime;
      const vol = (this.settings.volume / 100);

      if (theme === "pop") {
        // Pop suave moderno
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14 * vol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(860, now + 0.08);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (theme === "chime") {
        // Sino harmônico
        [880, 1318.51].forEach((freq, i) => {
          const t = now + i * 0.09;
          const gain = ctx.createGain();
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.1 * vol, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.4);
        });
      } else if (theme === "bubble") {
        // Gota d'água
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15 * vol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (theme === "retro") {
        // 8-bit arcade
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const t = now + i * 0.05;
          const gain = ctx.createGain();
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.08 * vol, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

          const osc = ctx.createOscillator();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, t);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.08);
        });
      } else if (theme === "cyber") {
        // Cyber sci-fi
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12 * vol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (theme === "electronic") {
        // Acorde harmônico sintetizado
        [440, 554.37, 659.25].forEach((freq) => {
          const gain = ctx.createGain();
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.06 * vol, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(gain);
          osc.start(now);
          osc.stop(now + 0.35);
        });
      } else {
        // Crystal (Padrão elegante)
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.11 * vol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      console.warn("Could not play chat incoming sound", e);
    }
  }

  /**
   * Toca o som suave de envio de mensagem
   */
  public playSentMessage(themeOverride?: ChatSoundTheme): void {
    if (!this.settings.enabled || !this.settings.sentEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const vol = (this.settings.volume / 100);

      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05 * vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.06);

      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn("Could not play sent sound", e);
    }
  }

  /**
   * Toca o som especial de menção (@você)
   */
  public playMentionSound(themeOverride?: ChatSoundTheme): void {
    if (!this.settings.enabled || !this.settings.mentionEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const vol = (this.settings.volume / 100);

      const notes = [587.33, 880, 1174.66]; // D5 -> A5 -> D6
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.07;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12 * vol, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch (e) {
      console.warn("Could not play mention sound", e);
    }
  }
}

export const chatSound = new ChatSoundManager();
