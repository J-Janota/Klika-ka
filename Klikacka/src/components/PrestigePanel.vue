<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { usePrestigeStore } from '../stores/prestige'

const gameStore = useGameStore()
const prestigeStore = usePrestigeStore()

const Prestige_Threshold = 2500

const pointsPreview = computed(() =>
  Math.max(1, Math.floor(Math.sqrt(gameStore.balance / 100)))
)

const confirmPending = ref(false)

function handlePrestige() {
  if (!gameStore.canPrestige) return
  if (!confirmPending.value) {
    confirmPending.value = true
    setTimeout(() => (confirmPending.value = false), 3000)
    return
  }
  confirmPending.value = false
  prestigeStore.awardPoints(pointsPreview.value)
  prestigeStore.prestige(gameStore.resetForPrestige)
}

const Theme_Swatches: Record<string, string> = {
  night: '#f5a623',
  premium: '#c9a84c',
  vibrant: '#ff6eb4',
}
</script>

<template>
  <div class="prestigePanel">
    <div class="prestigeHeader">
      <div class="prestigeStat">
        <span class="prestigeStatValue">{{ prestigeStore.prestigePoints }} ★</span>
        <span class="prestigeStatLabel">Prestige Points</span>
      </div>
      <div class="prestigeStat">
        <span class="prestigeStatValue">{{ prestigeStore.prestigeCount }}</span>
        <span class="prestigeStatLabel">Prestiges</span>
      </div>
    </div>

    <div class="prestigeResetSection">
      <p class="prestigeResetInfo">
        Reset your run to earn
        <strong>{{ gameStore.canPrestige ? pointsPreview : '?' }} ★</strong>.
        Permanent bonuses from buildings carry over.
      </p>
      <div class="prestigeProgress">
        <div
          class="prestigeProgressFill"
          :style="{ width: Math.min(100, (gameStore.balance / Prestige_Threshold) * 100) + '%' }"
        ></div>
        <span class="prestigeProgressLabel">
          ☕{{ Math.floor(gameStore.balance).toString() }} / ☕{{ Prestige_Threshold.toString() }}
        </span>
      </div>
      <button
        class="prestigeBtn"
        :class="{ confirmMode: confirmPending }"
        :disabled="!gameStore.canPrestige"
        @click="handlePrestige"
      >
        <span v-if="!gameStore.canPrestige">Need ☕{{ Prestige_Threshold.toString() }}</span>
        <span v-else-if="confirmPending">Are you sure? Click again to confirm</span>
        <span v-else>Prestige — earn {{ pointsPreview }} ★</span>
      </button>
    </div>

    <h3 class="buildingsTitle">Buildings</h3>
    <ul class="buildingsList">
      <li
        v-for="building in prestigeStore.buildings"
        :key="building.id"
        class="buildingCard"
        :class="{
          purchased: building.purchased,
          cantAfford: !building.purchased && prestigeStore.prestigePoints < building.cost,
        }"
      >
        <div class="buildingThemeSwatch" :style="{ background: Theme_Swatches[building.themeUnlock] }"></div>
        <div class="buildingInfo">
          <span class="buildingName">{{ building.name }}</span>
          <span class="buildingDesc">{{ building.description }}</span>
          <span class="buildingThemeTag">Unlocks {{ building.themeUnlock }} theme</span>
        </div>
        <button
          v-if="!building.purchased"
          class="buildingBuyBtn"
          :disabled="prestigeStore.prestigePoints < building.cost"
          @click="prestigeStore.buyBuilding(building.id)"
        >
          {{ building.cost }} ★
        </button>
        <span v-else class="buildingOwned">✓ Owned</span>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
@keyframes confirmPulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.03); }
  100% { transform: scale(1); }
}

.prestigePanel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow-y: auto;
}

.prestigeHeader {
  display: flex;
  gap: 0.75rem;
}

.prestigeStat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 0.5rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--panel-border);
  border-radius: 0.75rem;
  gap: 0.2rem;
}

.prestigeStatValue {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--accent);
}

.prestigeStatLabel {
  font-size: 0.62rem;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.prestigeResetSection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--panel-border);
  border-radius: 0.75rem;
}

.prestigeResetInfo {
  font-size: 0.75rem;
  color: var(--text-2);
  line-height: 1.4;

  strong { color: var(--accent); }
}

.prestigeProgress {
  position: relative;
  height: 8px;
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  overflow: visible;
}

.prestigeProgressFill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-soft), var(--accent));
  border-radius: 4px;
  transition: width 0.4s ease;
}

.prestigeProgressLabel {
  position: absolute;
  top: 10px;
  left: 0;
  font-size: 0.6rem;
  color: var(--text-3);
}

.prestigeBtn {
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 0.65rem;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #fff));
  color: #000;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 0 16px var(--accent-glow);
  transition: opacity 0.2s, box-shadow 0.2s;

  &:disabled {
    background: rgba(255,255,255,0.08);
    color: var(--text-3);
    box-shadow: none;
    cursor: not-allowed;
  }

  &.confirmMode {
    background: linear-gradient(135deg, #e05050, #c02020);
    color: #fff;
    animation: confirmPulse 0.6s ease;
  }
}

.buildingsTitle {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-3);
  margin-bottom: -0.5rem;
}

.buildingsList {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.buildingCard {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--panel-border);
  border-radius: 0.75rem;
  transition: border-color 0.2s, opacity 0.2s;

  &.purchased {
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    opacity: 0.7;
  }

  &.cantAfford { opacity: 0.5; }
}

.buildingThemeSwatch {
  width: 12px;
  height: 36px;
  border-radius: 4px;
  flex-shrink: 0;
}

.buildingInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.buildingName {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-1);
}

.buildingDesc {
  font-size: 0.65rem;
  color: var(--text-2);
  line-height: 1.3;
}

.buildingThemeTag {
  font-size: 0.58rem;
  color: var(--accent);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.buildingBuyBtn {
  flex-shrink: 0;
  padding: 0.3rem 0.6rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 0.2s;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.buildingOwned {
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #4caf74;
  padding: 0.3rem 0.6rem;
}
</style>
