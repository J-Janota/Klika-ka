<script setup lang="ts">
import { computed } from 'vue'
import { RarityMeta } from '../stores/game'
import type { Cat } from '../stores/game'

const props = defineProps<{
  cat: Cat
  num: number
  width: number
  height: number
}>()

const pad = computed(() => Math.max(8, Math.round(props.width * 0.07)))
const radius = computed(() => Math.max(4, props.width * 0.05))
const innerRadius = computed(() => Math.max(2, props.width * 0.03))
const captionFs = computed(() => Math.max(8, Math.round(props.width * 0.038)))
const titleFs = computed(() => Math.max(14, Math.round(props.width * 0.105)))
const bodyFs = computed(() => Math.max(10, Math.round(props.width * 0.052)))
const meta = computed(() => RarityMeta[props.cat.rarity])
const moodColor = computed(() => {
  const m = props.cat.mood
  if (m === 0) return 'oklch(0.55 0.04 60)'
  if (m < 50) return 'oklch(0.72 0.12 60)'
  return 'oklch(0.55 0.13 145)'
})
</script>

<template>
  <div
    class="cardLore"
    :class="`r-${cat.rarity}`"
    :style="{
      width: width + 'px',
      height: height + 'px',
      borderRadius: radius + 'px',
      padding: pad + 'px',
    }"
  >
    <div
      class="innerBorder"
      :style="{ inset: Math.max(4, pad * 0.5) + 'px', borderRadius: innerRadius + 'px' }"
    />
    <div class="row top">
      <div class="mono caption" :style="{ fontSize: captionFs + 'px' }">№{{ String(num).padStart(3, '0') }} · DOSSIER</div>
      <div class="mono caption" :style="{ fontSize: captionFs + 'px' }">{{ meta.label.toUpperCase() }}</div>
    </div>
    <div
      class="serif title"
      :style="{ fontSize: titleFs + 'px', marginTop: (pad * 0.5) + 'px' }"
    >{{ cat.name }}</div>
    <div
      class="mono caption"
      :style="{ fontSize: captionFs + 'px', marginTop: (pad * 0.3) + 'px' }"
    >found · {{ cat.found }}</div>

    <div
      class="statBlock"
      :style="{
        marginTop: (pad * 0.6) + 'px',
        gap: (pad * 0.4) + 'px',
        padding: (pad * 0.5) + 'px 0',
      }"
    >
      <div>
        <div class="mono caption" :style="{ fontSize: (captionFs * 0.85) + 'px' }">income</div>
        <div class="serif statValue" :style="{ fontSize: (bodyFs * 1.4) + 'px' }">+{{ meta.income }}/s</div>
      </div>
      <div>
        <div class="mono caption" :style="{ fontSize: (captionFs * 0.85) + 'px' }">mood</div>
        <div
          class="serif statValue"
          :style="{ fontSize: (bodyFs * 1.4) + 'px', color: moodColor }"
        >{{ Math.round(cat.mood) }}%</div>
      </div>
    </div>

    <div :style="{ marginTop: (pad * 0.5) + 'px' }">
      <div class="mono caption" :style="{ fontSize: (captionFs * 0.85) + 'px' }">ability</div>
      <div class="serif" :style="{ fontSize: (bodyFs * 1.1) + 'px', fontStyle: 'italic', fontWeight: 600, marginTop: '2px' }">{{ meta.ability }}</div>
      <div :style="{ fontSize: (bodyFs * 0.95) + 'px', color: 'oklch(0.48 0.04 40)', marginTop: '2px' }">{{ meta.description }}</div>
    </div>

    <div
      class="notes"
      :style="{
        marginTop: 'auto',
        paddingTop: (pad * 0.5) + 'px',
      }"
    >
      <div class="mono caption" :style="{ fontSize: (captionFs * 0.85) + 'px' }">notes</div>
      <div
        class="serif quote"
        :style="{ fontSize: bodyFs + 'px', marginTop: '3px' }"
      >"{{ cat.notes }}"</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cardLore {
  position: relative;
  background: var(--paper-card);
  color: oklch(0.20 0.04 30);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 0 0 1px var(--r),
    0 8px 16px -4px oklch(0 0 0 / 0.5);
}

.innerBorder {
  position: absolute;
  border: 1px solid var(--r);
  pointer-events: none;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.caption {
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--r);
}

.title {
  font-style: italic;
  font-weight: 600;
  line-height: 1;
}

.statBlock {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--r);
  border-bottom: 1px solid var(--r);
}

.statValue {
  font-style: italic;
  font-weight: 600;
  line-height: 1;
  margin-top: 2px;
}

.notes {
  border-top: 1px solid var(--r);
}

.quote {
  font-style: italic;
  font-weight: 500;
  line-height: 1.3;
  color: oklch(0.20 0.04 30);
}
</style>
