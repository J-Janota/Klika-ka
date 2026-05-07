<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, OFFLINE_MAX_SECONDS } from '../stores/game'
import { formatNum } from '../utils/format'

const game = useGameStore()

const visible = computed(() => game.offlineGain > 0)

const cappedAtMax = computed(
  () => game.offlineDurationSec >= OFFLINE_MAX_SECONDS - 1,
)

function formatDuration(secs: number): string {
  if (secs < 60) return `${Math.round(secs)}s`
  const m = Math.floor(secs / 60)
  if (m < 60) {
    const s = Math.round(secs % 60)
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  const h = Math.floor(m / 60)
  const remM = m % 60
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`
}
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="overlay" @click="game.dismissOfflineGain()">
      <div class="card" @click.stop>
        <div class="mono caption">welcome back</div>
        <div class="serif title">+ ☕ {{ formatNum(game.offlineGain) }}</div>
        <div class="mono detail">earned while you were away</div>
        <div class="serif duration">
          {{ formatDuration(game.offlineDurationSec) }}
          <span v-if="cappedAtMax" class="mono cap">· capped</span>
        </div>
        <button class="dismissBtn mono" @click="game.dismissOfflineGain()">
          collect
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  background: oklch(0 0 0 / 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 80;
  cursor: pointer;
}

.card {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 18px;
  padding: 28px 32px;
  min-width: 280px;
  max-width: 360px;
  text-align: center;
  cursor: default;
  box-shadow: 0 30px 80px -20px oklch(0 0 0 / 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--ink);
}

.caption {
  font-size: 9px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.title {
  font-size: 36px;
  font-style: italic;
  font-weight: 600;
  line-height: 1.05;
  margin-top: 4px;
  color: var(--gold);
}

.detail {
  font-size: 9px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-top: 6px;
}

.duration {
  font-size: 18px;
  font-style: italic;
  font-weight: 600;
  margin-top: 2px;

  .cap {
    font-size: 9px;
    letter-spacing: 0.18em;
    color: var(--ink-faint);
    margin-left: 4px;
  }
}

.dismissBtn {
  margin-top: 16px;
  padding: 10px 22px;
  background: var(--ink);
  color: var(--paper);
  border: none;
  border-radius: 999px;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
