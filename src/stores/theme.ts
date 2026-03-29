import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeId = 'warm' | 'night' | 'vibrant' | 'premium'

export interface ThemeMeta {
  id: ThemeId
  label: string
  swatch: string
  building: string
  locked: boolean
}

export const Themes: ThemeMeta[] = [
  { id: 'warm',    label: 'Cozy Roast',    swatch: '#e8902a', building: 'Street Corner Cafe', locked: false },
  { id: 'night',   label: 'Midnight Brew', swatch: '#f5a623', building: 'Night Owl Lounge',   locked: true  },
  { id: 'premium', label: 'Gold Reserve',  swatch: '#c9a84c', building: 'Luxury Cat Spa',     locked: true  },
  { id: 'vibrant', label: 'Neon Kitty',    swatch: '#ff6eb4', building: 'Arcade Cat Cafe',    locked: true  },
]

const save_key = 'catcafe_theme'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeId>((localStorage.getItem(save_key) as ThemeId) || 'warm')

  watch(theme, (theme) => {
    localStorage.setItem(save_key, theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, { immediate: true })

  function setTheme(id: ThemeId) {
    theme.value = id
  }

  return { theme, setTheme }
})
