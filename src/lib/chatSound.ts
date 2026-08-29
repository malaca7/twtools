/**
 * Utilitário de Efeitos Sonoros para o Chat usando Web Audio API.
 * Gera sons elegantes, modernos e discretos em tempo real sem requisições de rede ou arquivos pesados.
 */

class ChatSoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Carrega preferência do usuário salva no localStorage
    try {
      const saved = localStorage.getItem("tw_chat_sound_enabled");
      if (saved !== null) {
        this.soundEnabled = saved === "true";
      }
    } catch {
      this.soundEnabled = true;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem("tw_chat_sound_enabled", String(enabled));
    } catch {
      // ignore
    }
  }

  public toggle(): boolean {
    const next = !this.soundEnabled;
    this.setEnabled(next);
    return next;
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

  /**
   * Som de nova mensagem recebida (discreto, moderno, tom cristalino em 2 notas suaves)
   */
  public playIncomingMessage(): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      // Volume envelope suave
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.09, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      // Oscilador 1: Tom harmônico elegante (F#5 ~ 740Hz -> A5 ~ 880Hz)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn("Could not play chat sound", e);
    }
  }

  /**
   * Som suave de envio de mensagem (pop ultraleve)
   */
  public playSentMessage(): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.04, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.06);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn("Could not play sent sound", e);
    }
  }

  /**
   * Som de menção recebida (@você) (tom de destaque em 3 notas)
   */
  public playMentionSound(): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Could not play mention sound", e);
    }
  }
}

export const chatSound = new ChatSoundManager();
