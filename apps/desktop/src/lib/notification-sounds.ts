import { getPreference, isTauriAvailable } from "./tauri-ipc";

type SoundType = "success" | "error" | "info";

let soundEnabled: boolean | null = null;

async function isSoundEnabled(): Promise<boolean> {
  if (soundEnabled !== null) return soundEnabled;
  if (!isTauriAvailable()) {
    soundEnabled = false;
    return false;
  }
  try {
    const val = await getPreference("notification_sound");
    soundEnabled = val !== "false"; // default enabled unless explicitly disabled
  } catch {
    soundEnabled = true;
  }
  return soundEnabled;
}

/** Reset cached preference (call when settings change). */
export function resetSoundPreference() {
  soundEnabled = null;
}

/**
 * Play a short notification tone using Web Audio API.
 * Respects the `notification_sound` preference.
 */
export async function playNotificationSound(type: SoundType) {
  const enabled = await isSoundEnabled();
  if (!enabled) return;

  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value =
      type === "success" ? 880 : type === "error" ? 440 : 660;
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext may not be available
  }
}
