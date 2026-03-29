<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import type { Rarity } from '../stores/game'
import PrestigePanel from './PrestigePanel.vue'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle'): void
}>()

const store = useGameStore()
const activeTab = ref<'cats' | 'upgrades' | 'prestige'>('cats')

const rarities = [
  { key: 'common',    label: 'Common',    chance: '55%' },
  { key: 'uncommon',  label: 'Uncommon',  chance: '25%' },
  { key: 'rare',      label: 'Rare',      chance: '12%' },
  { key: 'epic',      label: 'Epic',      chance: '6%'  },
  { key: 'legendary', label: 'Legendary', chance: '2%'  },
]

const upgradeIcons: Record<string, string[]> = {
  treats:   ['fas', 'bone'],
  corner:   ['fas', 'couch'],
  espresso: ['fas', 'mug-hot'],
  lounge:   ['fas', 'star'],
  catnip:   ['fas', 'leaf'],
  calming:  ['fas', 'music'],
}

function canAfford(cost: number) {
  return store.balance >= cost
}

const revealRarity = ref<Rarity | null>(null)
const Rarity_Colors: Record<Rarity, string> = {
  common:    '#c5c1b9',
  uncommon:  '#288a4c',
  rare:      '#1d73c9',
  epic:      '#443399',
  legendary: '#f4ba34',
}
const Rarity_Labels: Record<Rarity, string> = {
  common:    'Common',
  uncommon:  'Uncommon!',
  rare:      'Rare!',
  epic:      'Epic!!',
  legendary: 'Legendary!!!',
}

function adopt() {
  if (!store.canAdopt) return
  const countBefore = store.cats.length
  store.adoptCat()
  const newCat = store.cats[store.cats.length - 1]
  if (!newCat || store.cats.length <= countBefore) return
  revealRarity.value = newCat.rarity
  setTimeout(() => (revealRarity.value = null), 1400)
}
</script>

<template>
  <Transition name="overlay">
    <div v-if="isOpen" class="drawerOverlay" @click="emit('close')" />
  </Transition>

  <button
    class="drawerHandle"
    :class="{ open: isOpen }"
    @click="emit('toggle')"
  >
    <span class="handleLabel">Shop</span>
    <!-- <span class="handleIcon">🛍</span> -->
  </button>

  <aside class="shopDrawer" :class="{ open: isOpen }" aria-label="Shop">
    <div class="drawerInner">

      <div class="drawerHeader">
        <h2>Shop</h2>
        <button class="closeBtn" aria-label="Close shop" @click="emit('close')">✕</button>
      </div>

      <div class="shopSelection">
        <p
          class="shopSelectionOption"
          :class="{ activeOption: activeTab === 'cats' }"
          @click="activeTab = 'cats'"
        >Cats</p>
        <p
          class="shopSelectionOption"
          :class="{ activeOption: activeTab === 'upgrades' }"
          @click="activeTab = 'upgrades'"
        >Upgrades</p>
        <p
          class="shopSelectionOption prestigeTab"
          :class="{ activeOption: activeTab === 'prestige' }"
          @click="activeTab = 'prestige'"
        >★ Prestige</p>
      </div>

      <div class="shopContainer">
        <PrestigePanel v-if="activeTab === 'prestige'" />

        <div v-else-if="activeTab === 'cats'" class="catGacha">

          <Transition name="reveal">
            <div
              v-if="revealRarity"
              class="gachaReveal"
              :style="{ background: Rarity_Colors[revealRarity] }"
            >
              <span class="revealLabel">{{ Rarity_Labels[revealRarity] }}</span>
            </div>
          </Transition>

          <div class="gachaBox">
            <div class="gachaBoxInner" :class="{ gachaShake: revealRarity }">
              <FontAwesomeIcon :icon="['fas', 'gift']" class="gachaIcon" />
            </div>
          </div>

          <h3>Adopt a Cat</h3>
          <p class="gachaDescription">Each cat has a unique personality!</p>

          <div class="rarityInfo">
            <div v-for="r in rarities" :key="r.key" class="rarityItem">
              <span class="rarityDot" :class="r.key"></span>
              <span class="rarityText">{{ r.label }} <em>{{ r.chance }}</em></span>
            </div>
          </div>

          <div v-if="store.cats.length >= store.catCapacity" class="capacityWarning">
            Cafe is full! Buy an upgrade to add more space.
          </div>

          <button
            class="gachaButton"
            :disabled="!store.canAdopt"
            @click="adopt"
          >
            <span class="buttonText">Adopt</span>
            <span class="buttonPrice">☕{{ store.adoptCost }}</span>
          </button>
        </div>

        <ul v-else class="upgradeList">
          <li
            v-for="upgrade in store.upgrades"
            :key="upgrade.id"
            class="upgradeItem"
            :class="{ purchased: upgrade.purchased, cantAfford: !canAfford(upgrade.cost) && !upgrade.purchased }"
            @click="store.buyUpgrade(upgrade.id)"
          >
            <span class="upgradeIcon">
              <FontAwesomeIcon :icon="upgradeIcons[upgrade.id] ?? ['fas', 'star']" />
            </span>
            <div class="upgradeInfo">
              <h3>{{ upgrade.name }}</h3>
              <p>{{ upgrade.description }}</p>
            </div>
            <span v-if="upgrade.purchased" class="priceText owned">✓</span>
            <span v-else class="priceText">☕{{ upgrade.cost }}</span>
          </li>
        </ul>
      </div>

    </div>
  </aside>
</template>

<style scoped lang="scss">

.drawerOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 99;
  backdrop-filter: blur(2px);
}

.overlay-enter-active,
.overlay-leave-active { transition: opacity 300ms ease; }
.overlay-enter-from,
.overlay-leave-to     { opacity: 0; }


.drawerHandle {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 101;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.85rem 0.45rem;
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-right: none;
  border-radius: 0.6rem 0 0 0.6rem;
  cursor: pointer;
  box-shadow: -4px 0 16px var(--panel-shadow);
  transition: background 0.2s, box-shadow 0.2s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--accent-soft);
    box-shadow: -6px 0 24px var(--accent-glow);
  }

  &.open {
    transform: translateY(-50%) translateX(-380px);
  }

  @media (max-width: 480px) {
    &.open { transform: translateY(-50%) translateX(-100vw); }
  }
}

.handleLabel {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}

.handleIcon {
  font-size: 1.1rem;
  line-height: 1;
}

// ── Drawer panel ──────────────────────────────────────────────────────────────

.shopDrawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100dvh;
  z-index: 100;
  transform: translateX(100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;

  &.open {
    transform: translateX(0);
    box-shadow: -8px 0 40px rgba(0, 0, 0, 0.5), -2px 0 0 var(--panel-border);
  }

  @media (max-width: 480px) { width: 100vw; }
}

.drawerInner {
  width: 100%;
  height: 100%;
  background: var(--panel);
  border-left: 1px solid var(--panel-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 0.75rem;
  overflow: hidden;
}

// ── Drawer header ─────────────────────────────────────────────────────────────

.drawerHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--panel-border);
  flex-shrink: 0;

  h2 {
    color: var(--text-1);
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
}

.closeBtn {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--panel-border);
  color: var(--text-2);
  width: 28px;
  height: 28px;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--text-1);
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

.shopSelection {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 0.6rem;
  border: 1px solid var(--panel-border);
  overflow: hidden;
  flex-shrink: 0;
}

.shopSelectionOption {
  flex: 1;
  text-align: center;
  padding: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.2s;

  &:hover { color: var(--text-1); background: rgba(255, 255, 255, 0.05); }
}

.activeOption {
  color: var(--accent);
  font-weight: 700;
  border-bottom: 2px solid var(--accent);
  background: var(--tab-active-bg);
}

.prestigeTab {
  color: var(--accent) !important;
  &.activeOption { background: color-mix(in srgb, var(--accent) 20%, transparent) !important; }
}

// ── Scroll container ──────────────────────────────────────────────────────────

.shopContainer {
  flex: 1;
  overflow-y: auto;
  padding-right: 2px;

  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--panel-border); border-radius: 2px; }
}

// ── Gacha ─────────────────────────────────────────────────────────────────────

@keyframes gentleFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

@keyframes gachaShake {
  0%, 100% { transform: rotate(0deg); }
  20%       { transform: rotate(-9deg) scale(1.1); }
  40%       { transform: rotate(9deg)  scale(1.1); }
  60%       { transform: rotate(-5deg); }
  80%       { transform: rotate(5deg); }
}

@keyframes revealIn  { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@keyframes revealOut { from { opacity: 0.88; } to { opacity: 0; transform: scale(1.06); } }

.catGacha {
  border: 1px solid var(--panel-border);
  border-radius: 1rem;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  background: rgba(255, 255, 255, 0.03);
  position: relative;
  overflow: hidden;

  h3 { color: var(--text-1); font-size: 1.1rem; font-weight: 700; }
}

.gachaBox { width: 110px; height: 110px; }

.gachaBoxInner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--accent-soft);
  border: 2px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 24px var(--accent-glow), inset 0 0 16px var(--accent-soft);
  animation: gentleFloat 4s ease-in-out infinite;

  &.gachaShake { animation: gachaShake 0.4s ease, gentleFloat 4s ease-in-out 0.4s infinite; }
}

.gachaIcon { width: 3.2rem; height: 3.2rem; color: var(--accent); }

.gachaDescription { color: var(--text-2); font-size: 0.8rem; text-align: center; }

.rarityInfo {
  display: flex;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 0.75rem;
  border: 1px solid var(--panel-border);
  flex-wrap: wrap;
  justify-content: center;
}

.rarityItem { display: flex; align-items: center; gap: 0.25rem; }

.rarityDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.common    { background: var(--r-common);    box-shadow: 0 0 4px var(--r-common-glow); }
  &.uncommon  { background: var(--r-uncommon);  box-shadow: 0 0 4px var(--r-uncommon-glow); }
  &.rare      { background: var(--r-rare);      box-shadow: 0 0 5px var(--r-rare-glow); }
  &.epic      { background: var(--r-epic);      box-shadow: 0 0 6px var(--r-epic-glow); }
  &.legendary { background: var(--r-legendary); box-shadow: 0 0 8px var(--r-legendary-glow); }
}

.rarityText {
  font-size: 0.68rem;
  color: var(--text-2);
  font-weight: 500;

  em { font-style: normal; color: var(--text-3); }
}

.gachaReveal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  z-index: 5;
  opacity: 0.88;
}

.revealLabel {
  font-size: 1.3rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.06em;
}

.reveal-enter-active { animation: revealIn  0.25s ease-out; }
.reveal-leave-active { animation: revealOut 0.45s ease-in forwards; }

.capacityWarning {
  font-size: 0.75rem;
  color: #e8a020;
  text-align: center;
  background: rgba(232, 160, 32, 0.1);
  border: 1px solid rgba(232, 160, 32, 0.3);
  border-radius: 0.4rem;
  padding: 0.35rem 0.6rem;
}

.gachaButton {
  background: var(--btn-bg);
  color: var(--btn-text);
  border: none;
  padding: 0.75rem 1.75rem;
  border-radius: 2rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.25s ease;
  box-shadow: 0 4px 16px var(--btn-shadow);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px var(--btn-shadow);
    filter: brightness(1.1);
  }

  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.buttonText  { font-size: 1rem; }

.buttonPrice {
  background: rgba(255, 255, 255, 0.18);
  padding: 0.2rem 0.65rem;
  border-radius: 1rem;
  font-size: 0.85rem;
  font-weight: 800;
}

// ── Upgrades ──────────────────────────────────────────────────────────────────

.upgradeList {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0;
}

.upgradeItem {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 0.75rem;
  border: 1px solid var(--panel-border);
  padding: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(.purchased):not(.cantAfford) {
    background: var(--accent-soft);
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--accent-glow);
  }

  &.purchased  { opacity: 0.5; cursor: default; }
  &.cantAfford { opacity: 0.4; cursor: not-allowed; }
}

.upgradeIcon {
  width: 40px;
  height: 40px;
  border-radius: 0.6rem;
  border: 1px solid var(--panel-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  color: var(--accent);

  svg { width: 1.2rem; height: 1.2rem; }
}

.upgradeInfo {
  flex: 1;

  h3 { color: var(--text-1); font-size: 0.85rem; font-weight: 700; }
  p  { margin-top: 0.15rem; color: var(--text-2); font-size: 0.75rem; }
}

.priceText {
  background: var(--btn-bg);
  color: var(--btn-text);
  padding: 0.3rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
  flex-shrink: 0;

  &.owned { background: linear-gradient(135deg, #4caf74, #2e8a50); color: #fff; }
}
</style>
