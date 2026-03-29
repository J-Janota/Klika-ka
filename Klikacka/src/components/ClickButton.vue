<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const active = ref(false)

interface FloatLabel { id: number; text: string; x: number; y: number }
const floats = ref<FloatLabel[]>([])
let floatId = 0

function handleClick(e: MouseEvent) {
  store.click()

  active.value = true
  setTimeout(() => (active.value = false), 100)

  const btn = (e.currentTarget as HTMLElement)
  const rect = btn.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const amount = store.clickPower + store.totalClickBonus
  const label: FloatLabel = { id: floatId++, text: `+${amount % 1 === 0 ? amount : amount.toFixed(1)} ☕`, x, y }
  floats.value.push(label)
  setTimeout(() => {
    floats.value = floats.value.filter(float => float.id !== label.id)
  }, 900)
}
</script>

<template>
  <div class="clickWrapper">
    <button class="bigClick" :class="{ active }" @click="handleClick">
      <svg class="pawSvg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="16" cy="38" rx="9" ry="11" />
        <ellipse cx="38" cy="24" rx="10" ry="12" />
        <ellipse cx="62" cy="24" rx="10" ry="12" />
        <ellipse cx="84" cy="38" rx="9" ry="11" />
        <path d="M50,42 C30,42 18,55 18,68 C18,82 30,90 50,90 C70,90 82,82 82,68 C82,55 70,42 50,42 Z" />
      </svg>
    </button>
    <span
      v-for="f in floats"
      :key="f.id"
      class="floatLabel"
      :style="{ left: f.x + 'px', top: f.y + 'px' }"
    >{{ f.text }}</span>
  </div>
</template>

<style scoped lang="scss">
@keyframes ringExpand {
  0%   { transform: scale(1);   opacity: 0.8; }
  100% { transform: scale(2.4); opacity: 0; }
}

@keyframes floatClickUp {
  0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-80px); }
}

.clickWrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bigClick {
  width: 20rem;
  height: 20rem;
  border-radius: 50%;
  background: var(--accent-soft);
  border: 2px solid var(--accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  box-shadow: 0 0 20px var(--accent-glow), inset 0 0 20px rgba(255,255,255,0.03);
  position: relative;
  overflow: visible;

  &:hover {
    box-shadow: 0 0 35px var(--accent-glow), 0 0 60px var(--accent-glow), inset 0 0 20px rgba(255,255,255,0.05);
  }

  &:active, &.active {
    transform: scale(0.93);
    box-shadow: 0 0 50px var(--accent-glow);
  }
  @media (max-height: 1000px) {
    width: 10rem;
    height: 10rem;
  }
  @media (min-width: 1441px) {
    width: 15rem;
    height: 15rem;
  }
}

.pawSvg {
  width: 50%;
  height: 50%;
  fill: var(--accent);
  filter: drop-shadow(0 0 10px var(--accent-glow));
  transition: transform 0.1s ease, filter 0.1s ease;
  pointer-events: none;

  .bigClick:hover & {
    filter: drop-shadow(0 0 20px var(--accent-glow));
  }

  .bigClick.active & {
    transform: scale(0.88);
    filter: drop-shadow(0 0 28px var(--accent-glow)) brightness(1.3);
  }
}
.floatLabel {
  position: absolute;
  font-size: 1rem;
  font-weight: 800;
  color: var(--accent);
  text-shadow: 0 0 10px var(--accent-glow);
  pointer-events: none;
  white-space: nowrap;
  transform: translateX(-50%);
  animation: floatClickUp 0.9s ease-out forwards;
  z-index: 20;
}
</style>
