<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useGameStore } from './stores/game'
import { useTodStore } from './stores/tod'
import GameHeader from './components/GameHeader.vue'
import FooterLegend from './components/FooterLegend.vue'
import Binder from './components/Binder.vue'
import ShopDrawer from './components/ShopDrawer.vue'
import WelcomeBack from './components/WelcomeBack.vue'

const game = useGameStore()
useTodStore() // initializes data-tod attr

const isShopOpen = ref(false)
const winWidth = ref(window.innerWidth)
const isMobile = computed(() => winWidth.value < 720)

let tickInterval: ReturnType<typeof setInterval>

function onResize() {
  winWidth.value = window.innerWidth
}

onMounted(() => {
  tickInterval = setInterval(() => game.tick(), 100)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  clearInterval(tickInterval)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="appShell">
    <Binder :is-mobile="isMobile" />
    <GameHeader :on-open-shop="() => (isShopOpen = true)" />
    <FooterLegend />
  </div>

  <ShopDrawer
    :is-open="isShopOpen"
    @close="isShopOpen = false"
  />

  <WelcomeBack />
</template>

<style scoped lang="scss">
.appShell {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, var(--scene-grad-from) 0%, var(--scene-grad-to) 100%);
  overflow: hidden;
}
</style>
