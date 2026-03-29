<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from './stores/game'
import { useThemeStore } from './stores/theme'
import BalanceDisplay from './components/BalanceDisplay.vue'
import ClickButton from './components/ClickButton.vue'
import CatGrid from './components/CatGrid.vue'
import ShopDrawer from './components/ShopDrawer.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'

const store = useGameStore()
useThemeStore()

const isShopOpen = ref(false)

let tickInterval: ReturnType<typeof setInterval>

onMounted(() => {
  tickInterval = setInterval(() => store.tick(), 100)
})

onUnmounted(() => {
  clearInterval(tickInterval)
})
</script>

<style scoped lang="scss">
.gameHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.25rem;
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  flex-shrink: 0;
  z-index: 10;
}

.gameTitle {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--accent);
  text-shadow: 0 0 20px var(--accent-glow);
}

.clickerSection {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  box-shadow: 0 8px 32px var(--panel-shadow);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 1rem;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 2.5rem;
  height: 100%;

  @media (max-width: 1440px) { height: auto; min-height: 260px; }
  @media (max-height: 1000px) {
    gap: 1rem;
  }
  @media (min-width: 1441px) {
    gap: 3rem;
  }
}
</style>

<template>
  <div class="game-layout">
    <header class="gameHeader">
      <span class="gameTitle">☕ Cat Cafe</span>
      <ThemeSwitcher />
    </header>
    <div class="gameBody">
      <main>
        <section class="clickerSection">
          <BalanceDisplay />
          <ClickButton />
        </section>
        <CatGrid />
      </main>
    </div>
  </div>

  <ShopDrawer
    :is-open="isShopOpen"
    @toggle="isShopOpen = !isShopOpen"
    @close="isShopOpen = false"
  />
</template>
