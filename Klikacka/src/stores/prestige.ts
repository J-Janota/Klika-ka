import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const save_key = 'catcafe_prestige_v2'
// Sub-linear curve: first prestige feels rewarding (+50%), late prestiges scale slowly.
function prestigeMult(level: number): number {
  return 1 + 0.5 * Math.sqrt(level)
}

interface PrestigeSaveData {
  prestigeLevel: number
}

export const usePrestigeStore = defineStore('prestige', () => {
  const prestigeLevel = ref(0)

  const prestigeMultiplier = computed(() => prestigeMult(prestigeLevel.value))
  const nextMultiplier = computed(() => prestigeMult(prestigeLevel.value + 1))
  const volume = computed(() => prestigeLevel.value + 1)

  function load() {
    try {
      const raw = localStorage.getItem(save_key)
      if (!raw) return
      const data: PrestigeSaveData = JSON.parse(raw)
      prestigeLevel.value = data.prestigeLevel ?? 0
    } catch {
      // ignore
    }
  }

  function persist() {
    try {
      localStorage.setItem(save_key, JSON.stringify({
        prestigeLevel: prestigeLevel.value,
      } satisfies PrestigeSaveData))
    } catch { /* ignore */ }
  }

  watch(prestigeLevel, () => persist())

  function advance() {
    prestigeLevel.value += 1
    persist()
  }

  load()

  return {
    prestigeLevel,
    prestigeMultiplier,
    nextMultiplier,
    volume,
    advance,
  }
})
