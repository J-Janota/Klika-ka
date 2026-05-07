<script setup lang="ts">
import {
  computed,
  ref,
  useTemplateRef,
  onMounted,
  onUnmounted,
  watch,
} from "vue";
import {
  useGameStore,
  RarityMeta,
  TOTAL_SLOTS,
  SLOTS_PER_PAGE,
  PAGES_PER_VOLUME,
} from "../stores/game";
import { usePrestigeStore } from "../stores/prestige";
import CardFace from "./CardFace.vue";
import CardLore from "./CardLore.vue";

const game = useGameStore();
const prestige = usePrestigeStore();

const props = defineProps<{ isMobile: boolean }>();

const currentPage = ref(0);
const flipped = ref(false);

// Mobile-only slide index: 0 = dossier (left page), 1..N = grid page (1-indexed).
const mobileSlide = ref(1);

const totalPages = PAGES_PER_VOLUME;
// On mobile: slides 0..(PAGES_PER_VOLUME). On desktop: pages 0..(PAGES_PER_VOLUME-1).
const navTotal = computed(() =>
  props.isMobile ? PAGES_PER_VOLUME + 1 : totalPages,
);
const navIndex = computed(() =>
  props.isMobile ? mobileSlide.value : currentPage.value,
);
const gridPage = computed(() =>
  props.isMobile ? Math.max(0, mobileSlide.value - 1) : currentPage.value,
);
const showDossier = computed(() => !props.isMobile || mobileSlide.value === 0);
const showGrid = computed(() => !props.isMobile || mobileSlide.value >= 1);

function navTo(i: number) {
  const clamped = Math.max(0, Math.min(navTotal.value - 1, i));
  if (props.isMobile) mobileSlide.value = clamped;
  else currentPage.value = clamped;
}
function navPrev() {
  navTo(navIndex.value - 1);
}
function navNext() {
  navTo(navIndex.value + 1);
}

const pageStart = computed(() => gridPage.value * SLOTS_PER_PAGE);
const pageSlotsCount = computed(() =>
  Math.min(SLOTS_PER_PAGE, TOTAL_SLOTS - pageStart.value),
);
const pageLabel = computed(() => {
  if (props.isMobile && mobileSlide.value === 0) return "featured";
  return `page ${gridPage.value + 1} of ${totalPages}`;
});

const heroW = computed(() => (props.isMobile ? 110 : 240));
const heroH = computed(() => (props.isMobile ? 154 : 336));

// Measured cell size — set by ResizeObserver below.
const cellW = ref(props.isMobile ? 78 : 130);
const cellH = ref(props.isMobile ? 110 : 184);
const cardGridRef = useTemplateRef<HTMLElement>("cardGridEl");
let ro: ResizeObserver | null = null;

const GRID_COLS = 3;
const GRID_ROWS = 3;
const gridGap = computed(() => (props.isMobile ? 8 : 14));

function recalcCell() {
  const el = cardGridRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const gap = gridGap.value;
  cellW.value = Math.max(0, (rect.width - (GRID_COLS - 1) * gap) / GRID_COLS);
  cellH.value = Math.max(0, (rect.height - (GRID_ROWS - 1) * gap) / GRID_ROWS);
}

onMounted(() => {
  if (cardGridRef.value && typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => recalcCell());
    ro.observe(cardGridRef.value);
  }
  recalcCell();
});
onUnmounted(() => ro?.disconnect());
watch(
  () => props.isMobile,
  () => recalcCell(),
);

interface FloatLabel {
  id: number;
  x: number;
  y: number;
  text: string;
  isHeart?: boolean;
}
const floats = ref<FloatLabel[]>([]);
let floatId = 0;
const sceneRef = useTemplateRef("sceneEl");
const purr = ref(0);
let purrTimer = 0;

function pushFloat(x: number, y: number, text: string, isHeart = false) {
  const id = floatId++;
  floats.value.push({ id, x, y, text, isHeart });
  setTimeout(() => {
    floats.value = floats.value.filter((f) => f.id !== id);
  }, 900);
}

function onHeroClick(e: MouseEvent) {
  if (!game.hero) return;
  if (flipped.value) {
    flipped.value = false;
    return;
  }

  const root = sceneRef.value;
  if (!root) return;
  const rect = root.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const amt = game.petHero();
  pushFloat(x, y, `+${amt.toFixed(amt % 1 === 0 ? 0 : 1)} ☕`);
  if (Math.random() > 0.5) {
    setTimeout(
      () => pushFloat(x + (Math.random() - 0.5) * 30, y - 12, "♥", true),
      90,
    );
  }
  purr.value++;
  clearTimeout(purrTimer);
  purrTimer = window.setTimeout(() => {
    purr.value = 0;
  }, 280);
}

function selectCat(globalIdx: number) {
  game.selectHero(globalIdx);
  flipped.value = false;
}

function toggleFlip(e: MouseEvent) {
  e.stopPropagation();
  flipped.value = !flipped.value;
}
</script>

<template>
  <div class="scene" ref="sceneEl">
    <!-- Felt table backdrop -->
    <div class="feltTable" />

    <!-- Open binder -->
    <div class="binder" :class="{ mobile: isMobile }">
      <!-- Left page — volume info + hero dossier (desktop always, mobile when on dossier slide) -->
      <div v-if="showDossier" class="page leftPage">
        <div class="mono pageCaption">
          vol. {{ prestige.volume }} · the cafe binder
        </div>
        <div class="serif pageTitle">Collection</div>
        <div class="mono pageSub">
          {{ game.filledCount }} of {{ TOTAL_SLOTS }} collected
        </div>

        <div class="progressBar">
          <div
            class="progressFill"
            :style="{ width: (game.filledCount / TOTAL_SLOTS) * 100 + '%' }"
          />
        </div>

        <div v-if="prestige.prestigeLevel > 0" class="prestigeBadge mono">
          <span class="star">★</span>
          prestige {{ prestige.prestigeLevel }} · ×{{
            prestige.prestigeMultiplier.toFixed(2)
          }}
        </div>

        <!-- Hero detail — text column + card column -->
        <div class="heroDetail">
          <template v-if="game.hero">
            <div class="heroText">
              <div class="mono pageCaption">
                featured · slot
                {{ String(game.effectiveHeroIdx + 1).padStart(2, "0") }}
              </div>
              <div class="serif heroName">{{ game.hero.name }}</div>
              <div class="rarityChip" :class="`r-${game.hero.rarity}`">
                <span class="dot" />
                <span class="mono">{{
                  RarityMeta[game.hero.rarity].label.toUpperCase()
                }}</span>
              </div>
              <div class="serif heroDesc">"{{ game.hero.notes }}"</div>
              <div class="heroStats">
                <div>
                  <div class="mono pageCaption tiny">ability</div>
                  <div class="serif statName">
                    {{ RarityMeta[game.hero.rarity].ability }}
                  </div>
                </div>
                <div>
                  <div class="mono pageCaption tiny">income</div>
                  <div class="serif statName">
                    +{{ RarityMeta[game.hero.rarity].income }}/s
                  </div>
                </div>
              </div>
            </div>
            <div class="heroCardCol">
              <div class="heroCardWrap">
                <div
                  class="flipper"
                  :class="{ flipped, purring: purr > 0 }"
                  @click="onHeroClick"
                  :style="{
                    width: heroW + 'px',
                    height: heroH + 'px',
                    transform: purr
                      ? `scale(${1 + Math.min(purr, 4) * 0.014}) rotate(${(purr % 2 === 0 ? 1 : -1) * 0.8}deg)`
                      : '',
                  }"
                >
                  <div class="face front">
                    <CardFace
                      :cat="game.hero"
                      :num="game.effectiveHeroIdx + 1"
                      :width="heroW"
                      :height="heroH"
                    />
                  </div>
                  <div class="face back">
                    <CardLore
                      :cat="game.hero"
                      :num="game.effectiveHeroIdx + 1"
                      :width="heroW"
                      :height="heroH"
                    />
                  </div>
                </div>
                <button class="infoBtn mono" @click="toggleFlip">
                  {{ flipped ? "↺" : "i" }}
                </button>
              </div>
              <div v-if="!flipped" class="mono petHintInline">
                tap to pet · +{{ RarityMeta[game.hero.rarity].income * 2 }} ☕
              </div>
            </div>
          </template>
          <div v-else class="emptyDossier">
            <div class="club">♣</div>
            <div class="mono pageCaption">
              draw cats from the shop<br />to fill your binder
            </div>
          </div>
        </div>
      </div>

      <!-- Spine -->
      <div v-if="!isMobile" class="spine">
        <div class="punchHoles">
          <div v-for="i in 5" :key="i" class="holeRow">
            <div class="hole" />
            <div class="hole" />
          </div>
        </div>
      </div>

      <!-- Right page — sleeves grid (desktop always, mobile when on a grid slide) -->
      <div v-if="showGrid" class="page rightPage">
        <div class="pageHeader">
          <div class="mono pageCaption">{{ pageLabel }}</div>
          <div v-if="!isMobile" class="pageNav">
            <button class="navBtn" :disabled="navIndex === 0" @click="navPrev">
              ←
            </button>
            <button
              class="navBtn"
              :disabled="navIndex >= navTotal - 1"
              @click="navNext"
            >
              →
            </button>
          </div>
        </div>

        <div class="cardGrid" ref="cardGridEl" :style="{ gap: gridGap + 'px' }">
          <div
            v-for="slotIdx in pageSlotsCount"
            :key="pageStart + slotIdx - 1"
            :class="[
              'slot',
              {
                filled: !!game.collection[pageStart + slotIdx - 1],
                isHero:
                  !!game.hero &&
                  pageStart + slotIdx - 1 === game.effectiveHeroIdx,
              },
            ]"
          >
            <template
              v-if="
                game.collection[pageStart + slotIdx - 1] &&
                pageStart + slotIdx - 1 !== game.effectiveHeroIdx
              "
            >
              <div
                class="cardSlot"
                @click="selectCat(pageStart + slotIdx - 1)"
                :title="`Select ${game.collection[pageStart + slotIdx - 1].name}`"
              >
                <CardFace
                  :cat="game.collection[pageStart + slotIdx - 1]"
                  :num="pageStart + slotIdx"
                  :width="cellW"
                  :height="cellH"
                  compact
                />
              </div>
            </template>
            <template
              v-else-if="
                pageStart + slotIdx - 1 === game.effectiveHeroIdx && !!game.hero
              "
            >
              <div class="viewingPlaceholder">
                <div class="mono">VIEWING</div>
              </div>
            </template>
            <template v-else>
              <div class="emptySlot">
                <div class="qmark"><span>?</span></div>
                <div class="mono slotNum">
                  slot {{ String(pageStart + slotIdx).padStart(2, "0") }}
                </div>
              </div>
            </template>
          </div>
        </div>

        <div v-if="!isMobile && totalPages > 1" class="pageDots">
          <button
            v-for="i in totalPages"
            :key="i - 1"
            class="dotBtn"
            :class="{ active: i - 1 === currentPage }"
            @click="currentPage = i - 1"
          />
        </div>

        <div v-if="game.isBinderFull" class="binderComplete mono">
          ★ binder complete — prestige available ★
        </div>
      </div>

      <!-- Mobile-only shared nav (dossier ↔ grid pages) -->
      <div v-if="isMobile" class="mobileNav">
        <button class="navBtn" :disabled="navIndex === 0" @click="navPrev">
          ←
        </button>
        <div class="pageDots">
          <button
            v-for="i in navTotal"
            :key="i - 1"
            class="dotBtn"
            :class="{ active: i - 1 === navIndex }"
            @click="navTo(i - 1)"
          />
        </div>
        <button
          class="navBtn"
          :disabled="navIndex >= navTotal - 1"
          @click="navNext"
        >
          →
        </button>
      </div>
    </div>

    <!-- Floating click feedback -->
    <span
      v-for="f in floats"
      :key="f.id"
      class="float"
      :class="{ heart: f.isHeart }"
      :style="{ left: f.x + 'px', top: f.y + 'px' }"
      >{{ f.text }}</span
    >
  </div>
</template>

<style scoped lang="scss">
.scene {
  position: absolute;
  inset: 0;

  @media (max-width: 720px) {
    padding-top: 96px;
    padding-bottom: 90px;
  }
}

.feltTable {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 60%,
    var(--felt) 0%,
    var(--felt-lo) 100%
  );
}

.binder {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -52%);
  width: min(1120px, calc(100% - 64px));
  height: min(660px, calc(100% - 220px));
  display: flex;

  &.mobile {
    width: min(360px, calc(100% - 24px));
    height: min(580px, calc(100% - 200px));
    flex-direction: column;
  }
}

.mobileNav {
  flex-shrink: 0;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;

  .navBtn {
    width: 32px;
    height: 32px;
    background: var(--paper-card);
    border: 1px solid oklch(0.78 0.05 60);
    border-radius: 50%;
    color: oklch(0.22 0.04 30);
    cursor: pointer;
    font-size: 14px;
    font-family: "Fredoka", sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  .pageDots {
    display: flex;
    gap: 8px;
    margin: 0;
  }
}

.page {
  flex: 1;
  background: var(--paper-card);
  border: 1px solid oklch(0.78 0.05 60);
  color: oklch(0.22 0.04 30);
  padding: 40px 36px;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background-image: repeating-linear-gradient(
    180deg,
    transparent 0 30px,
    oklch(0.78 0.05 60 / 0.12) 30px 31px
  );

  .binder.mobile & {
    padding: 20px 16px;
  }
}

.leftPage {
  border-right: none;

  .binder.mobile & {
    border-right: 1px solid oklch(0.78 0.05 60);
  }
}

.rightPage {
  border-left: none;

  .binder.mobile & {
    border-left: 1px solid oklch(0.78 0.05 60);
  }
}

.spine {
  width: 8px;
  position: relative;
  z-index: 1;
  background: linear-gradient(
    180deg,
    oklch(0.3 0.06 30) 0%,
    oklch(0.42 0.1 30) 50%,
    oklch(0.3 0.06 30) 100%
  );
  box-shadow:
    inset 1px 0 oklch(0 0 0 / 0.3),
    inset -1px 0 oklch(0 0 0 / 0.3);
}

.punchHoles {
  position: absolute;
  left: 0;
  right: 0;
  top: 60px;
  bottom: 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.holeRow {
  position: relative;
  height: 16px;
}

.hole {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--felt);
  box-shadow: inset 0 1px 2px oklch(0 0 0 / 0.4);
  position: absolute;
  top: 0;
}

.holeRow .hole:first-child {
  right: 100%;
  margin-right: 4px;
}

.holeRow .hole:last-child {
  left: 100%;
  margin-left: 4px;
}

.pageCaption {
  font-size: 9px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: oklch(0.46 0.04 40);

  &.tiny {
    font-size: 8px;
    letter-spacing: 0.22em;
  }
}

.pageTitle {
  font-size: 32px;
  font-style: italic;
  font-weight: 600;
  line-height: 1;
  margin-top: 6px;
  color: oklch(0.22 0.04 30);
}

.pageSub {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: oklch(0.46 0.04 40);
  margin-top: 6px;
}

.progressBar {
  margin-top: 12px;
  height: 4px;
  background: oklch(0.78 0.05 60 / 0.55);
  border-radius: 2px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: var(--gold);
  transition: width 0.3s ease;
}

.prestigeBadge {
  margin-top: 14px;
  padding: 6px 12px;
  border: 1px solid var(--gold);
  border-radius: 999px;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gold);

  .star {
    font-size: 11px;
  }
}

.heroDetail {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid oklch(0.78 0.05 60);
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 20px;
  min-height: 0;

  .binder.mobile & {
    flex-direction: column-reverse;
    align-items: center;
    gap: 14px;
    margin-top: 16px;
    padding-top: 14px;
  }
}

.heroText {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.heroCardCol {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.heroCardWrap {
  position: relative;
  transform: rotate(5deg);
}

.petHintInline {
  font-size: 9px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: oklch(0.46 0.04 40);
  opacity: 0.7;
  white-space: nowrap;
  margin-top: 10px;
  pointer-events: none;
}

.heroName {
  font-size: 28px;
  font-style: italic;
  font-weight: 600;
  margin-top: 4px;
  line-height: 1;
}

.rarityChip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 4px 10px;
  border: 1px solid var(--r);
  border-radius: 999px;
  align-self: flex-start;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--r);
  }
  .mono {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--r);
  }
}

.heroDesc {
  margin-top: 14px;
  font-size: 13px;
  line-height: 1.5;
  font-style: italic;
}

.heroStats {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid oklch(0.78 0.05 60);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.statName {
  font-size: 14px;
  font-style: italic;
  font-weight: 600;
  margin-top: 2px;
}

.emptyDossier {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.4;

  .club {
    font-size: 36px;
    margin-bottom: 8px;
  }
  .pageCaption {
    text-align: center;
  }
}

.pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pageNav {
  display: flex;
  gap: 6px;
}

.navBtn {
  width: 28px;
  height: 28px;
  background: var(--paper-card);
  border: 1px solid oklch(0.78 0.05 60);
  border-radius: 50%;
  color: oklch(0.22 0.04 30);
  cursor: pointer;
  font-size: 14px;
  font-family: "Fredoka", sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    background: transparent;
    border-color: oklch(0.78 0.05 60 / 0.3);
    color: oklch(0.78 0.05 60);
    cursor: default;
  }
}

.cardGrid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  margin-top: 18px;
  min-height: 0;

  .binder.mobile & {
    margin-top: 14px;
  }
}

.slot {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: oklch(0.78 0.05 60 / 0.12);
  border: 1px dashed oklch(0.78 0.05 60);
  transition: background 0.3s ease;

  &.filled {
    background: transparent;
    border: none;
    box-shadow: none;
  }
}

.cardSlot {
  cursor: pointer;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewingPlaceholder {
  text-align: center;
  opacity: 0.35;
  width: calc(100% - 16px);
  height: calc(100% - 16px);
  border: 1px dashed oklch(0.78 0.05 60);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  .mono {
    font-size: 8px;
    letter-spacing: 0.22em;
    color: oklch(0.46 0.04 40);
  }
}

.emptySlot {
  text-align: center;
  opacity: 0.45;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.qmark {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px dashed oklch(0.46 0.04 40);
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 11px;
    color: oklch(0.46 0.04 40);
  }
}

.slotNum {
  font-size: 7px;
  letter-spacing: 0.16em;
  color: oklch(0.46 0.04 40);
  opacity: 0.7;
}

.pageDots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
}

.dotBtn {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: oklch(0.78 0.05 60);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    width: 20px;
    background: var(--gold);
  }
}

.binderComplete {
  margin-top: 8px;
  text-align: center;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
}

.heroCard {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 12;
  transition: transform 0.18s cubic-bezier(0.5, 1.5, 0.5, 1);
}

.heroCardWrap .infoBtn {
  position: absolute;
  right: -10px;
  top: -10px;
  width: 28px;
  height: 28px;
  font-size: 12px;
}

.heroCardCol .flipper {
  transition: transform 0.18s cubic-bezier(0.5, 1.5, 0.5, 1);
}

.flipper {
  position: relative;
  perspective: 1200px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
  &.flipped > .face.front {
    transform: rotateY(180deg);
  }
  &.flipped > .face.back {
    transform: rotateY(360deg);
  }
}

.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);

  &.back {
    transform: rotateY(180deg);
  }
}

.infoBtn {
  position: absolute;
  right: -8px;
  top: -8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--paper-card);
  color: oklch(0.2 0.04 30);
  border: 1px solid var(--gold);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 4px 8px -2px oklch(0 0 0 / 0.4);
  z-index: 2;
}

.petHint {
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translate(-50%, 12px) rotate(4deg);
  font-size: 9px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  opacity: 0.7;
  white-space: nowrap;
  color: var(--ink);
  pointer-events: none;
}

.float {
  position: absolute;
  font-size: 14px;
  font-weight: 800;
  color: var(--gold);
  text-shadow: 0 0 10px oklch(0 0 0 / 0.4);
  pointer-events: none;
  white-space: nowrap;
  animation: float-up 0.9s ease-out forwards;
  z-index: 25;
  transform: translate(-50%, 0);

  &.heart {
    color: oklch(0.65 0.16 30);
    font-size: 16px;
  }
}
</style>
