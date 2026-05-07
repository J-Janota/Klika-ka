import { defineStore } from 'pinia'
import { ref, computed, watch, onUnmounted } from 'vue'

export type Tod = 'dawn' | 'day' | 'dusk' | 'night'

export interface TodMeta {
  id: Tod
  label: string
  swatch: string
}

export const TODS: TodMeta[] = [
  { id: 'dawn',  label: 'Dawn',  swatch: 'oklch(0.88 0.06 30)' },
  { id: 'day',   label: 'Day',   swatch: 'oklch(0.92 0.04 90)' },
  { id: 'dusk',  label: 'Dusk',  swatch: 'oklch(0.55 0.13 350)' },
  { id: 'night', label: 'Night', swatch: 'oklch(0.18 0.04 270)' },
]

// Bucket the user's local hour into one of four TODs.
function todForDate(d: Date): Tod {
  const h = d.getHours()
  if (h >= 5 && h < 8)  return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

function formatTime(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h}:${m.toString().padStart(2, '0')}`
}

export const useTodStore = defineStore('tod', () => {
  const now = ref(new Date())

  const tod = computed<Tod>(() => todForDate(now.value))
  const currentTime = computed(() => formatTime(now.value))

  // Tick the clock so the TOD reactively follows the user's time.
  const interval = window.setInterval(() => {
    now.value = new Date()
  }, 15_000)
  onUnmounted(() => window.clearInterval(interval))

  watch(tod, (val) => {
    document.documentElement.setAttribute('data-tod', val)
  }, { immediate: true })

  return { tod, currentTime, TODS }
})
