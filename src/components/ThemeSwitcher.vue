<script setup lang="ts">
import { useThemeStore, Themes } from '../stores/theme'
import { usePrestigeStore } from '../stores/prestige'

const themeStore = useThemeStore()
const prestigeStore = usePrestigeStore()

function isLocked(themeId: string) {
  return !prestigeStore.unlockedThemes.has(themeId as any)
}
</script>

<template>
  <div class="themeSwitcher">
    <span class="switcherLabel">Theme</span>
    <div class="swatches">
      <button
        v-for="theme in Themes"
        :key="theme.id"
        class="swatch"
        :class="{ active: themeStore.theme === theme.id, locked: isLocked(theme.id) }"
        :style="{ '--swatch-color': theme.swatch }"
        :title="isLocked(theme.id) ? `🔒 ${theme.building} — unlock via prestige` : theme.label"
        :disabled="isLocked(theme.id)"
        @click="themeStore.setTheme(theme.id)"
      >
        <span v-if="isLocked(theme.id)" class="lockIcon">🔒</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.themeSwitcher {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.switcherLabel {
  font-size: 0.75rem;
  color: var(--text-3);
  text-transform: uppercase;
}

.swatches {
  display: flex;
  gap: 0.4rem;
}

.swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--swatch-color);
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  position: relative;

  &:hover { transform: scale(1.2); }

  &.active {
    border-color: #fff;
    box-shadow: 0 0 0 2px var(--swatch-color), 0 0 12px var(--swatch-color);
  }

  &.locked {
    opacity: 0.35;
    cursor: not-allowed;
    filter: grayscale(1);
  }
}

.lockIcon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
}
</style>
