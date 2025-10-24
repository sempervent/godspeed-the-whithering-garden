interface UserSettings {
  masterVolume: number
  muted: boolean
  reduceMotion: boolean
  cueVolumes: Record<string, number>
}

const defaultSettings: UserSettings = {
  masterVolume: 0.7,
  muted: false,
  reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  cueVolumes: {}
}

class UserSettingsManager {
  private settings: UserSettings

  constructor() {
    this.settings = this.loadSettings()
  }

  private loadSettings(): UserSettings {
    try {
      const stored = localStorage.getItem('godseed-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...defaultSettings, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load user settings:', error)
    }
    return defaultSettings
  }

  private saveSettings() {
    try {
      localStorage.setItem('godseed-settings', JSON.stringify(this.settings))
    } catch (error) {
      console.warn('Failed to save user settings:', error)
    }
  }

  getMasterVolume(): number {
    return this.settings.muted ? 0 : this.settings.masterVolume
  }

  setMasterVolume(volume: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
  }

  isMuted(): boolean {
    return this.settings.muted
  }

  setMuted(muted: boolean) {
    this.settings.muted = muted
    this.saveSettings()
  }

  shouldReduceMotion(): boolean {
    return this.settings.reduceMotion
  }

  setReduceMotion(reduce: boolean) {
    this.settings.reduceMotion = reduce
    this.saveSettings()
  }

  getCueVolume(cueId: string): number {
    return this.settings.cueVolumes[cueId] ?? 1.0
  }

  setCueVolume(cueId: string, volume: number) {
    this.settings.cueVolumes[cueId] = Math.max(0, Math.min(1, volume))
    this.saveSettings()
  }

  reset() {
    this.settings = { ...defaultSettings }
    this.saveSettings()
  }

  getAllSettings(): UserSettings {
    return { ...this.settings }
  }
}

export const userSettings = new UserSettingsManager()
