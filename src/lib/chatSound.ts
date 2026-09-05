/**
 * Gerenciador Avançado de Notificações, Sons e Efeitos Visuais do Chat.
 * Suporta múltiplos temas sonoros sintetizados em Web Audio API, volume,
 * efeitos visuais personalizáveis (Toast, Neon Glow, Screen Flash),
 * notificações nativas do sistema/navegador e piscamento do título da aba.
 */

export type ChatSoundTheme =
  | "whatsapp_classic"
  | "whatsapp_pop"
  | "iphone_tri_tone"
  | "slack_knock"
  | "telegram_chirp"
  | "crystal"
  | "chime"
  | "bubble"
  | "harp"
  | "retro"
  | "cyber"
  | "electronic";

export type ChatVisualAlertStyle =
  | "toast"        // Card flutuante interativo com foto do membro e prévia
  | "neon_button"  // Botão pulsante com brilho intenso neon
  | "screen_glow"  // Aura brilhante nas bordas da tela
  | "silent";      // Apenas atualizar contador de não lidas

export type ChatGlowColor = "emerald" | "rose" | "purple" | "cyan" | "amber";

export interface ChatNotificationSettings {
  enabled: boolean;
  theme: ChatSoundTheme;
  volume: number; // 0 a 100
  incomingEnabled: boolean;
  sentEnabled: boolean;
  mentionEnabled: boolean;
  
  // Opções visuais personalizadas
  visualStyle: ChatVisualAlertStyle;
  glowColor: ChatGlowColor;
  
  // Notificações Nativas do Sistema/Navegador
  nativeNotificationsEnabled: boolean;
  
  // Piscar título da aba no navegador
  flashTabTitle: boolean;
  
  // Expansão automática do balão ao receber DM
  autoExpandOnDM: boolean;
}

// Mantido para compatibilidade retroativa com código existente
export type ChatSoundSettings = ChatNotificationSettings;

export const SOUND_THEMES: Array<{
  id: ChatSoundTheme;
  name: string;
  desc: string;
  emoji: string;
}> = [
  { id: "whatsapp_classic", name: "WhatsApp Antigo (Note)", desc: "O tom clássico e nostálgico das primeiras versões do WhatsApp", emoji: "💬" },
  { id: "whatsapp_pop", name: "WhatsApp Pop Web", desc: "Bolha ágil e suave padrão do WhatsApp Web", emoji: "🟢" },
  { id: "iphone_tri_tone", name: "iPhone Tri-Tone", desc: "O lendário tom triplo da Apple (Mi-Dó-Sol)", emoji: "📱" },
  { id: "slack_knock", name: "Slack Knock", desc: "Batida executiva em madeira no estilo Slack", emoji: "💼" },
  { id: "telegram_chirp", name: "Telegram Chirp", desc: "Varredura rápida de frequência estilo Telegram", emoji: "✈️" },
  { id: "crystal", name: "Cristalino", desc: "Suave, elegante e cristalino (Padrão)", emoji: "💎" },
  { id: "chime", name: "Sino Harmônico", desc: "Harmônicos metálicos e acolhedores", emoji: "🔔" },
  { id: "bubble", name: "Gota d'Água", desc: "Toque orgânico e relaxante de bolha", emoji: "💧" },
  { id: "harp", name: "Harpa Celestial", desc: "Arpejo relaxante de harpa celestial", emoji: "🎼" },
  { id: "retro", name: "Arcade 8-Bit", desc: "Nostálgico estilo videogame retrô", emoji: "👾" },
  { id: "cyber", name: "Cyberpunk", desc: "Varredura sintetizada futurista", emoji: "⚡" },
  { id: "electronic", name: "Sintetizador", desc: "Acorde harmônico e moderno", emoji: "🎹" },
];

export const VISUAL_ALERT_STYLES: Array<{
  id: ChatVisualAlertStyle;
  name: string;
  desc: string;
  emoji: string;
}> = [
  { id: "toast", name: "Card Flutuante (Toast com Foto)", desc: "Exibe foto, nome e prévia da mensagem no canto da tela", emoji: "🚀" },
  { id: "neon_button", name: "Botão Pulsante Neon", desc: "Faz o balão de chat pulsar com um brilho radiante", emoji: "⚡" },
  { id: "screen_glow", name: "Aura nas Bordas da Tela", desc: "Pisca um brilho suave nas bordas para chamar atenção máxima", emoji: "🎆" },
  { id: "silent", name: "Silencioso", desc: "Atualiza apenas os contadores de mensagens não lidas", emoji: "🔕" },
];

export const GLOW_COLORS: Array<{
  id: ChatGlowColor;
  name: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  ringClass: string;
  shadowClass: string;
}> = [
  { id: "emerald", name: "Verde Neon", hex: "#10b981", bgClass: "bg-emerald-500", borderClass: "border-emerald-500", ringClass: "ring-emerald-500/70", shadowClass: "shadow-emerald-500/50" },
  { id: "rose", name: "Rosa Chama", hex: "#f43f5e", bgClass: "bg-rose-500", borderClass: "border-rose-500", ringClass: "ring-rose-500/70", shadowClass: "shadow-rose-500/50" },
  { id: "purple", name: "Roxo Cyber", hex: "#a855f7", bgClass: "bg-purple-500", borderClass: "border-purple-500", ringClass: "ring-purple-500/70", shadowClass: "shadow-purple-500/50" },
  { id: "cyan", name: "Azul Elétrico", hex: "#06b6d4", bgClass: "bg-cyan-500", borderClass: "border-cyan-500", ringClass: "ring-cyan-500/70", shadowClass: "shadow-cyan-500/50" },
  { id: "amber", name: "Amarelo Ouro", hex: "#f59e0b", bgClass: "bg-amber-500", borderClass: "border-amber-500", ringClass: "ring-amber-500/70", shadowClass: "shadow-amber-500/50" },
];

const DEFAULT_SETTINGS: ChatNotificationSettings = {
  enabled: true,
  theme: "whatsapp_classic",
  volume: 100, // Padrão 100% solicitado
  incomingEnabled: true,
  sentEnabled: true,
  mentionEnabled: true,
  visualStyle: "toast",
  glowColor: "emerald",
  nativeNotificationsEnabled: true,
  flashTabTitle: true,
  autoExpandOnDM: false,
};

class ChatNotificationManager {
  private ctx: AudioContext | null = null;
  private settings: ChatNotificationSettings = { ...DEFAULT_SETTINGS };
  private originalTitle: string = "";
  private titleInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSettings();
    if (typeof document !== "undefined") {
      this.originalTitle = document.title;
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem("tw_chat_notification_settings_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if ((parsed.theme as string) === "whatsapp") parsed.theme = "whatsapp_classic";
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
        return;
      }

      // Migração de v2 ou legado
      const legacyV2 = localStorage.getItem("tw_chat_sound_settings_v2");
      if (legacyV2) {
        const parsed = JSON.parse(legacyV2);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
        return;
      }

      const legacyEnabled = localStorage.getItem("tw_chat_sound_enabled");
      if (legacyEnabled !== null) {
        this.settings.enabled = legacyEnabled === "true";
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  public getSettings(): ChatNotificationSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<ChatNotificationSettings>): ChatNotificationSettings {
    this.settings = { ...this.settings, ...partial };
    try {
      localStorage.setItem("tw_chat_notification_settings_v3", JSON.stringify(this.settings));
      localStorage.setItem("tw_chat_sound_settings_v2", JSON.stringify(this.settings));
      localStorage.setItem("tw_chat_sound_enabled", String(this.settings.enabled));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tw_chat_sound_change", { detail: this.settings })
        );
        window.dispatchEvent(
          new CustomEvent("tw_chat_notification_change", { detail: this.settings })
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

  public getNativePermissionStatus(): "granted" | "denied" | "default" | "unsupported" {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  }

  public async requestNativePermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        this.updateSettings({ nativeNotificationsEnabled: true });
        return true;
      } else {
        this.updateSettings({ nativeNotificationsEnabled: false });
        return false;
      }
    } catch {
      return false;
    }
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

      if (theme === "whatsapp_classic") {
        // WhatsApp Antigo / Nostálgico (Note / Tri-tone Chime)
        [739.99, 987.77].forEach((freq, i) => {
          const t = now + i * 0.07;
          const gain = ctx.createGain();
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.18 * vol, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.25);
        });
      } else if (theme === "whatsapp_pop" || theme === "whatsapp") {
        // WhatsApp Pop Web Dual Tone
        [1046.5, 1318.51].forEach((freq, i) => {
          const t = now + i * 0.08;
          const gain = ctx.createGain();
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.15 * vol, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.14);
        });
      } else if (theme === "iphone_tri_tone") {
        // iPhone Tri-Tone (Mi - Dó - Sol)
        [783.99, 1046.5, 1318.51].forEach((freq, i) => {
          const t = now + i * 0.09;
          const gain = ctx.createGain();
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.15 * vol, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.3);
        });
      } else if (theme === "slack_knock") {
        // Slack Knock (Batida suave em madeira)
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2 * vol, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (theme === "telegram_chirp") {
        // Telegram Chirp (Varredura rápida)
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14 * vol, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1600, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.14);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (theme === "harp") {
        // Harpa Celestial (Arpejo suave)
        [587.33, 739.99, 880, 1174.66].forEach((freq, i) => {
          const t = now + i * 0.06;
          const gain = ctx.createGain();
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.1 * vol, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.35);
        });
      } else if (theme === "pop") {
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

  /**
   * Dispara o pacote completo de alertas (Som + Notificação Nativa + Tab Flash + Evento Visual)
   */
  public triggerNewMessageAlert(payload: {
    message?: any;
    conversationId: string;
    senderName?: string;
    senderAvatar?: string | null;
    conversationTitle?: string;
    isDM?: boolean;
    isMention?: boolean;
  }): void {
    const { senderName = "Alguém", senderAvatar, message, conversationId } = payload;
    const contentPreview = message?.content || message?.attachment_name || "Enviou um anexo";

    // 1. Toca som
    if (payload.isMention) {
      this.playMentionSound();
    } else {
      this.playIncomingMessage();
    }

    // 2. Notificação nativa do navegador (se ativada e permitido)
    if (
      this.settings.nativeNotificationsEnabled &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        const n = new Notification(`💬 Mensagem de ${senderName}`, {
          body: contentPreview,
          icon: senderAvatar || "/favicon.ico",
          tag: conversationId,
        });
        n.onclick = () => {
          window.focus();
          window.dispatchEvent(
            new CustomEvent("tw_chat_open_conversation", { detail: { conversationId } })
          );
        };
      } catch {
        // ignore
      }
    }

    // 3. Piscar título da aba do navegador (se ativado)
    if (this.settings.flashTabTitle && typeof document !== "undefined" && document.hidden) {
      this.flashTitle(`(1) 💬 Nova Mensagem de ${senderName}`);
    }

    // 4. Dispara evento visual global
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tw_chat_new_message", {
          detail: {
            message,
            conversationId,
            senderName,
            senderAvatar,
            visualStyle: this.settings.visualStyle,
            glowColor: this.settings.glowColor,
            autoExpandOnDM: this.settings.autoExpandOnDM,
          },
        })
      );
    }
  }

  private flashTitle(text: string): void {
    if (typeof document === "undefined") return;
    if (this.titleInterval) clearInterval(this.titleInterval);

    let step = 0;
    this.originalTitle = document.title.replace(/^\(\d+\)\s*💬\s*/, "");
    this.titleInterval = setInterval(() => {
      document.title = step % 2 === 0 ? text : this.originalTitle;
      step++;
    }, 1200);

    const stopFlashing = () => {
      if (this.titleInterval) {
        clearInterval(this.titleInterval);
        this.titleInterval = null;
      }
      document.title = this.originalTitle;
      window.removeEventListener("focus", stopFlashing);
    };

    window.addEventListener("focus", stopFlashing);
  }
}

export const chatSound = new ChatNotificationManager();
export const chatNotification = chatSound;
