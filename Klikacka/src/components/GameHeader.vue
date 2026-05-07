<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { useTodStore, TODS } from '../stores/tod'
import { formatNum } from '../utils/format'

defineProps<{ onOpenShop: () => void }>()

const game = useGameStore()
const todStore = useTodStore()

const todMeta = computed(() => TODS.find(t => t.id === todStore.tod) ?? TODS[1])

// Smoothly animate balance display
const displayBalance = ref(game.balance)
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function tick() {
  const target = game.balance
  const diff = target - displayBalance.value
  if (Math.abs(diff) < 0.01) displayBalance.value = target
  else displayBalance.value = lerp(displayBalance.value, target, 0.18)
  requestAnimationFrame(tick)
}
tick()
</script>

<template>
  <header class="header">
    <div class="left">
      <span class="serif title">The Cafe</span>
      <span
        class="todPill mono"
        :title="`Local time · ${todStore.currentTime}`"
      >
        <span class="todSwatch" :style="{ background: todMeta.swatch }" />
        {{ todMeta.label }} · {{ todStore.currentTime }}
      </span>
    </div>

    <div class="right">
      <div class="stat">
        <div class="mono statLabel">balance</div>
        <div class="serif statValue">☕ {{ formatNum(displayBalance) }}</div>
      </div>
      <div class="stat divider">
        <div class="mono statLabel">per second</div>
        <div class="serif statValue">+{{ game.moneyPerSecond.toFixed(1) }}</div>
      </div>
      <button class="shopBtn mono" @click="$props.onOpenShop()">Shop</button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  position: absolute;
  top: 22px;
  left: 28px;
  right: 28px;
  height: 68px;
  background: color-mix(in srgb, var(--paper) 85%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--rule);
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 0 28px;
  z-index: 30;
  color: var(--ink);

  @media (max-width: 720px) {
    top: 12px; left: 12px; right: 12px;
    height: 60px;
    padding: 0 10px 0 18px;
  }
}

.left {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  min-width: 0;
}

.title {
  font-size: 28px;
  font-style: italic;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;

  @media (max-width: 720px) { font-size: 22px; }
}

.todPill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 9px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 999px;
  white-space: nowrap;

  @media (max-width: 720px) { display: none; }
}

.todSwatch {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 1px solid var(--rule);
}

.right {
  display: flex;
  align-items: center;
  gap: 18px;

  @media (max-width: 720px) { gap: 10px; }
}

.stat {
  text-align: right;
  &.divider {
    border-left: 1px solid var(--rule);
    padding-left: 14px;
    @media (max-width: 720px) { display: none; }
  }
}

.statLabel {
  font-size: 8px;
  opacity: 0.6;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.statValue {
  font-size: 20px;
  font-style: italic;
  font-weight: 600;
  line-height: 1;
  color: var(--ink);
  @media (max-width: 720px) { font-size: 16px; }
}

.shopBtn {
  padding: 12px 22px;
  background: var(--ink);
  color: var(--paper);
  border: none;
  border-radius: 999px;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover { filter: brightness(1.1); }
  @media (max-width: 720px) {
    padding: 8px 14px;
    font-size: 11px;
  }
}
</style>
