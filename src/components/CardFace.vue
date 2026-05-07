<script setup lang="ts">
import { computed } from "vue";
import { RarityMeta } from "../stores/game";
import type { Cat } from "../stores/game";

const props = defineProps<{
  cat: Cat;
  num: number;
  width: number;
  height: number;
  compact?: boolean;
}>();

const pad = computed(() => Math.max(5, Math.round(props.width * 0.06)));
const numFs = computed(() => Math.max(7, Math.round(props.width * 0.04)));
const nameFs = computed(() =>
  props.compact
    ? Math.max(8, Math.round(props.width * 0.1))
    : Math.max(12, Math.round(props.width * 0.115)),
);
const subFs = computed(() => Math.max(7, Math.round(props.width * 0.038)));
const figureSize = computed(() =>
  Math.round(props.width * (props.compact ? 0.55 : 0.62)),
);
const radius = computed(() => Math.max(4, props.width * 0.05));
const innerRadius = computed(() => Math.max(2, props.width * 0.03));
const meta = computed(() => RarityMeta[props.cat.rarity]);
const isSleeping = computed(() => props.cat.mood === 0);
</script>

<template>
  <div
    class="cardFace"
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
      :style="{
        inset: Math.max(4, pad * 0.5) + 'px',
        borderRadius: innerRadius + 'px',
      }"
    />
    <div class="cardHeader">
      <div class="mono num" :style="{ fontSize: numFs + 'px' }">
        №{{ String(num).padStart(3, "0") }}
      </div>
      <div v-if="!compact" class="mono num" :style="{ fontSize: numFs + 'px' }">
        {{ meta.label.toUpperCase() }}
      </div>
    </div>

    <div
      class="portrait"
      :style="{
        marginTop: pad * 0.5 + 'px',
        borderRadius: innerRadius + 'px',
      }"
    >
      <div
        class="catFigure"
        :class="{ sleeping: isSleeping }"
        :style="{ width: figureSize + 'px', height: figureSize + 'px' }"
      >
        <img
          :src="cat.emoji"
          alt=""
          :style="{
            filter: isSleeping ? 'grayscale(0.7) brightness(0.85)' : 'none',
            opacity: isSleeping ? 0.6 : 1,
          }"
        />
        <span
          v-if="isSleeping"
          class="sleepZ"
          :style="{ fontSize: figureSize * 0.22 + 'px' }"
          >z</span
        >
      </div>
    </div>

    <div
      class="serif name"
      :style="{
        fontSize: nameFs + 'px',
        marginTop: pad * 0.4 + 'px',
      }"
    >
      {{ cat.name }}
    </div>
    <div
      v-if="!compact"
      class="mono caption"
      :style="{
        fontSize: subFs + 'px',
        marginTop: pad * 0.3 + 'px',
      }"
    >
      {{ meta.ability }} · +{{ meta.income }}/s
    </div>
  </div>
</template>

<style scoped lang="scss">
.cardFace {
  position: relative;
  background: var(--paper-card);
  color: oklch(0.2 0.04 30);
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

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.num {
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--r);
}

.portrait {
  flex: 1;
  background: radial-gradient(
    circle at 50% 45%,
    var(--warm) 0%,
    oklch(0.86 0.06 60) 80%
  );
  border: 1px solid var(--r);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.catFigure {
  position: relative;
  animation: drift 3s ease-in-out infinite;

  &.sleeping {
    animation: none;
  }

  img {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    transform-origin: center 60%;
  }
}

.sleepZ {
  position: absolute;
  top: -2px;
  right: -6px;
  color: var(--ink-faint);
}

.name {
  font-style: italic;
  font-weight: 600;
  text-align: center;
  line-height: 1;
  color: oklch(0.2 0.04 30);
}

.caption {
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-align: center;
  opacity: 0.55;
  color: oklch(0.2 0.04 30);
}
</style>
