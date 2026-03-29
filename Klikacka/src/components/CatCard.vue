<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore, Ability_By_Rarity } from '../stores/game'
import type { Cat } from '../stores/game'

const props = defineProps<{ cat: Cat }>()
const store = useGameStore()

const ability = computed(() => Ability_By_Rarity[props.cat.rarity])
const abilityActive = computed(() => props.cat.mood > 50)
const isSleeping = computed(() => props.cat.mood === 0)

const moodClass = computed(() => {
  if (props.cat.mood === 0) return 'moodEmpty'
  if (props.cat.mood <= 50) return 'moodLow'
  return 'moodHigh'
})

const showPulse = ref(false)
function pet() {
  store.petCat(props.cat.id)
  showPulse.value = true
  setTimeout(() => (showPulse.value = false), 600)
}
</script>

<template>
  <li
    class="catItem"
    :class="[cat.rarity, { sleeping: isSleeping }]"
    :style="{ animationDelay: `${(cat.id % 6) * 0.35}s` }"
    @click="pet"
    title="Click to pet!"
  >
    <span class="rarityBadge">{{ cat.rarity }}</span>

    <div class="catEmoji">
      <span v-if="isSleeping" class="sleepEmoji">😴</span>
      <img v-else :src="cat.emoji" :alt="cat.name" class="catImg" />
      <span v-if="showPulse" class="moodPulse">+mood</span>
    </div>

    <h3>{{ cat.name }}</h3>

    <div class="moodHeader">
      <span class="moodLabel">Mood</span>
      <span class="moodValue">{{ Math.round(cat.mood) }}%</span>
    </div>
    <div class="moodBar">
      <div class="moodBarFill" :class="moodClass" :style="{ width: cat.mood + '%' }"></div>
    </div>

    <p class="catIncome">+{{ cat.incomePerSecond }}/s</p>

    <div class="abilityChip" :class="[cat.rarity, { inactive: !abilityActive }]">
      <span class="abilityName">{{ ability.name }}</span>
      <div class="abilityTooltip">
        <strong>{{ ability.name }}</strong>
        <span>{{ ability.description }}</span>
        <span v-if="!abilityActive" class="tooltipWarning">⚠ Inactive — mood too low</span>
      </div>
    </div>
  </li>
</template>

<style scoped lang="scss">
@keyframes catBob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-2px); }
}

@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 28px var(--r-legendary-glow), 0 0 8px var(--r-legendary-glow); }
  50%       { box-shadow: 0 0 48px var(--r-legendary-glow), 0 0 16px var(--r-legendary-glow); }
}

@keyframes sleepPulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 0.3; }
}

@keyframes floatUp {
  0%   { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-1.5rem); }
}

.catItem {
  background: var(--panel-alt);
  border: 1px solid var(--panel-border);
  border-radius: 0.875rem;
  padding: 0.75rem 0.6rem;
  width: calc(25% - 0.57rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: catBob 3s ease-in-out infinite;

  &:hover {
    animation: none;
    transform: translateY(-5px) scale(1.02);

    .catEmoji { box-shadow: 0 0 16px var(--accent-glow); }
  }

  &.common    { border-color: var(--r-common);    box-shadow: 0 4px 16px var(--r-common-glow); }
  &.uncommon  { border-color: var(--r-uncommon);  box-shadow: 0 4px 20px var(--r-uncommon-glow); }
  &.rare      { border-color: var(--r-rare);      box-shadow: 0 4px 24px var(--r-rare-glow); }
  &.epic      { border-color: var(--r-epic);      box-shadow: 0 4px 28px var(--r-epic-glow); }
  &.legendary {
    border-color: var(--r-legendary);
    box-shadow: 0 0 32px var(--r-legendary-glow), 0 0 8px var(--r-legendary-glow);
    animation: catBob 3s ease-in-out infinite, legendaryPulse 2s ease-in-out infinite;
  }

  &.sleeping {
    filter: grayscale(80%);
    opacity: 0.5;
    animation: sleepPulse 2.5s ease-in-out infinite;
  }

  .rarityBadge {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    font-size: 0.55rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.15rem 0.4rem;
    border-radius: 0.3rem;
    color: #fff;
  }

  &.common    .rarityBadge { background: var(--r-common); }
  &.uncommon  .rarityBadge { background: var(--r-uncommon); }
  &.rare      .rarityBadge { background: var(--r-rare); }
  &.epic      .rarityBadge { background: var(--r-epic); }
  &.legendary .rarityBadge { background: var(--r-legendary); color: #000; }

  .catEmoji {
    width: 67px;
    height: 67px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.2rem;
    position: relative;
    transition: box-shadow 0.2s;
    border-radius: 50%;

    .catImg {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      padding: 4px;
      overflow: visible;
    }

    .sleepEmoji { font-size: 2rem; }
  }

  h3 {
    color: var(--text-1);
    font-size: 0.82rem;
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
  }

  @media (max-width: 1440px) { width: calc(33.333% - 0.5rem); }
  @media (max-width: 1024px) { width: calc(50% - 0.375rem); }
  @media (max-width: 768px)  { width: calc(50% - 0.375rem); }
}

.catIncome {
  font-size: 0.72rem;
  color: var(--accent);
  font-weight: 600;
}

.moodHeader {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.moodLabel, .moodValue {
  font-size: 0.6rem;
  color: var(--text-3);
}

.moodBar {
  width: 100%;
  height: 5px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
}

.moodBarFill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease, background-color 0.4s ease;

  &.moodHigh  { background: linear-gradient(90deg, #4caf74, #2e8a50); }
  &.moodLow   { background: linear-gradient(90deg, #e8a020, #b06010); }
  &.moodEmpty { background: #e03030; width: 100% !important; }
}

.moodPulse {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--r-uncommon);
  animation: floatUp 0.6s ease-out forwards;
  pointer-events: none;
  white-space: nowrap;
}

.abilityChip {
  position: relative;
  width: 100%;
  text-align: center;
  padding: 0.2rem 0.35rem;
  border-radius: 0.5rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  border: 1px solid transparent;
  transition: opacity 0.3s;
  cursor: default;

  &.common    { background: rgba(154,160,166,0.12); border-color: rgba(154,160,166,0.3); color: var(--r-common); }
  &.uncommon  { background: rgba(76,175,116,0.12);  border-color: rgba(76,175,116,0.3);  color: var(--r-uncommon); }
  &.rare      { background: rgba(77,166,255,0.12);  border-color: rgba(77,166,255,0.3);  color: var(--r-rare); }
  &.epic      { background: rgba(176,106,255,0.12); border-color: rgba(176,106,255,0.3); color: var(--r-epic); }
  &.legendary { background: rgba(255,204,0,0.12);   border-color: rgba(255,204,0,0.3);   color: var(--r-legendary); }

  &.inactive { 
    filter: grayscale(1); 
  }

  &:hover .abilityTooltip { display: flex; }
}

.abilityTooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--panel-alt);
  border: 1px solid var(--panel-border);
  color: var(--text-1);
  border-radius: 0.6rem;
  padding: 0.5rem 0.75rem;
  width: 155px;
  font-size: 0.7rem;
  text-align: center;
  z-index: 30;
  flex-direction: column;
  gap: 0.25rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);

  strong { color: var(--accent); font-size: 0.75rem; }
}

.tooltipWarning { color: #e8a020; font-size: 0.65rem; margin-top: 0.1rem; }
</style>
