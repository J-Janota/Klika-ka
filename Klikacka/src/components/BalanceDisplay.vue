<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const displayBalance = ref(store.balance)
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function animate() {
  const target = store.balance
  const diff = target - displayBalance.value
  if (Math.abs(diff) < 0.01) {
    displayBalance.value = target
  } else {
    displayBalance.value = lerp(displayBalance.value, target, 0.12)
  }
  requestAnimationFrame(animate)
}
animate()

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(2)}K`
  return Math.floor(n).toString()
}

const formattedBalance = computed(() => formatNumber(displayBalance.value))

const formattedMps = computed(() => {
  const mps = store.moneyPerSecond
  if (mps >= 1_000) return `${(mps / 1_000).toFixed(2)}K`
  return mps.toFixed(1)
})
</script>

<template>
  <div class="balanceContainer">
    <p class="balance">{{ formattedBalance }} <span class="currency">☕</span></p>
    <p class="incomePerSecond">{{ formattedMps }} per second</p>
  </div>
</template>

<style scoped lang="scss">
.balanceContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.balance {
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--accent);
  text-shadow: 0 0 24px var(--accent-glow);
  letter-spacing: -0.02em;
  @media (max-height: 1000px) {
    font-size: 1.8rem;
  }
  @media (min-width: 1441px) {
    font-size: 3.5rem;
  }
}

.currency { font-size: 2rem; }

.incomePerSecond {
  font-size: 0.9rem;
  color: var(--text-2);
  letter-spacing: 0.04em;
  @media (max-height: 1000px) {
    font-size: 0.75rem;
  }
  @media (min-width: 1441px) {
    font-size: 1rem;
  }
}
</style>
