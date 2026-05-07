<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, RARITY_ORDER, RarityMeta } from '../stores/game'
import type { Rarity } from '../stores/game'
import { usePrestigeStore } from '../stores/prestige'

const game = useGameStore()
const prestige = usePrestigeStore()

const counts = computed(() => {
  const map: Record<Rarity, number> = {
    common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0,
  }
  for (const c of game.collection) map[c.rarity]++
  return map
})

function fmtMult(n: number): string {
  if (n >= 100) return '×' + Math.round(n)
  if (n >= 10)  return '×' + n.toFixed(1)
  return '×' + n.toFixed(2)
}

function fmtYield(n: number): string {
  if (n >= 100) return Math.round(n).toString()
  if (n >= 10)  return n.toFixed(1)
  return n.toFixed(1)
}
</script>

<template>
  <footer class="footer">
    <div class="mono label">residents</div>
    <div class="badges">
      <div
        v-for="r in RARITY_ORDER"
        :key="r"
        class="badge"
        :class="[`r-${r}`, { dim: counts[r] === 0 }]"
      >
        <span class="dot" />
        <span class="serif name">{{ RarityMeta[r].label }}</span>
        <span class="mono count">×{{ counts[r] }}</span>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="mono statLabel">click</span>
        <span class="serif statVal">+{{ fmtYield(game.clickYield) }} ☕</span>
      </div>
      <div class="stat">
        <span class="mono statLabel">income</span>
        <span class="serif statVal">{{ fmtMult(game.incomeMultiplier) }}</span>
      </div>
      <div class="stat" v-if="prestige.prestigeLevel > 0">
        <span class="mono statLabel">prestige</span>
        <span class="serif statVal">{{ fmtMult(prestige.prestigeMultiplier) }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  position: absolute;
  bottom: 22px;
  left: 28px;
  right: 28px;
  height: 54px;
  background: color-mix(in srgb, var(--paper) 85%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--rule);
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 24px;
  z-index: 20;
  overflow: hidden;
  color: var(--ink);

  @media (max-width: 720px) {
    bottom: 12px; left: 12px; right: 12px;
    height: 56px;
    padding: 0 16px;
  }
}

.label {
  font-size: 9px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  opacity: 0.6;
  flex-shrink: 0;
}

.badges {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;

  &::-webkit-scrollbar { display: none; }
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--r);
  flex-shrink: 0;

  &.dim { opacity: 0.3; }
}

.dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--r);
}

.name {
  font-size: 11px;
  font-style: italic;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
}

.count {
  font-size: 10px;
  opacity: 0.7;
  color: var(--ink-soft);
}

.stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  padding-left: 14px;
  border-left: 1px solid var(--rule);

  @media (max-width: 720px) {
    gap: 8px;
    padding-left: 8px;
  }
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.05;
}

.statLabel {
  font-size: 8px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.55;
}

.statVal {
  font-size: 14px;
  font-style: italic;
  font-weight: 600;
  color: var(--ink);

  @media (max-width: 720px) { font-size: 12px; }
}
</style>
