<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useGameStore,
  RarityMeta,
  RARITY_ORDER,
  RarityWeights,
  MERGE_COUNT,
  RELEASE_REFUND,
  nextRarity,
} from "../stores/game";
import type { Rarity } from "../stores/game";
import { usePrestigeStore } from "../stores/prestige";
import { formatNum } from "../utils/format";

defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const game = useGameStore();
const prestige = usePrestigeStore();

type Tab = "gacha" | "floor" | "manage" | "upgrades" | "prestige";
const tab = ref<Tab>("gacha");
const drawAnim = ref(false);
const releaseTarget = ref<number | null>(null);

const tabs = computed(() => {
  const list: Array<[Tab, string]> = [
    ["gacha", "Draw"],
    ["manage", "Manage"],
    ["upgrades", "Upgrades"],
    ["prestige", "Prestige"],
  ];
  if (game.floorViewUnlocked) list.splice(1, 0, ["floor", "Floor"]);
  return list;
});

function moodLabel(m: number) {
  if (m === 0) return "asleep";
  if (m <= 50) return "sleepy";
  return "content";
}

function doDraw() {
  if (!game.canDraw) return;
  drawAnim.value = true;
  setTimeout(() => {
    game.draw();
    drawAnim.value = false;
  }, 400);
}

const byRarity = computed(() => {
  const map: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  for (const c of game.collection) map[c.rarity]++;
  return map;
});

function doMerge(r: Rarity) {
  if (byRarity.value[r] >= MERGE_COUNT && nextRarity(r)) {
    game.merge(r);
  }
}

function doRelease(catId: number) {
  game.release(catId);
  releaseTarget.value = null;
}

function doPrestige() {
  game.doPrestige();
  tab.value = "gacha";
}
</script>

<template>
  <div class="overlay" :class="{ visible: isOpen }" @click="emit('close')" />

  <aside class="drawer" :class="{ open: isOpen }" aria-label="Shop">
    <!-- Header -->
    <div class="head">
      <div class="headTitle">
        <div class="mono caption">the cafe shop</div>
        <div class="serif title">What'll it be?</div>
      </div>
      <div class="balance">
        <div class="mono caption">balance</div>
        <div class="serif balanceVal">☕ {{ formatNum(game.balance) }}</div>
      </div>
      <button class="closeBtn" @click="emit('close')">×</button>
    </div>

    <!-- Tabs -->
    <div class="tabsRow">
      <div class="tabs">
        <button
          v-for="[id, label] in tabs"
          :key="id"
          class="tabBtn mono"
          :class="{ active: tab === id }"
          @click="tab = id"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="body">
      <!-- ─── DRAW TAB ─── -->
      <div v-if="tab === 'gacha'" class="gachaTab">
        <div class="drawBox" :class="{ animating: drawAnim }">
          <div v-if="drawAnim" class="drawingDots serif">···</div>
          <div
            v-else-if="game.lastDraw"
            class="drawnCat"
            :class="`r-${game.lastDraw.rarity}`"
          >
            <img :src="game.lastDraw.emoji" alt="" />
            <div class="serif drawnName">{{ game.lastDraw.name }}</div>
            <div class="rarityChip">
              <span class="dot" />
              <span class="mono">{{
                RarityMeta[game.lastDraw.rarity].label.toUpperCase()
              }}</span>
            </div>
            <div class="drawnDesc">{{ game.lastDraw.notes }}</div>
          </div>
          <div v-else class="placeholder">
            <div class="club">♣</div>
            <div class="mono caption">draw a cat</div>
          </div>
        </div>

        <button
          class="primaryBtn mono"
          :disabled="!game.canDraw"
          @click="doDraw"
        >
          {{ game.isBinderFull ? "Binder full" : `Draw · ☕ ${formatNum(game.drawCost)}` }}
        </button>

        <div class="mono slotCount">
          {{ game.filledCount }} / 18 slots filled
        </div>

        <!-- Rates -->
        <div class="ratesPanel">
          <div class="mono caption">draw rates</div>
          <div
            v-for="r in RARITY_ORDER"
            :key="r"
            class="rateRow"
            :class="`r-${r}`"
          >
            <span class="dot" />
            <span class="serif rateName">{{ RarityMeta[r].label }}</span>
            <span class="mono ratePct">{{ RarityWeights[r] }}%</span>
          </div>
        </div>
      </div>

      <!-- ─── FLOOR TAB ─── -->
      <div v-if="tab === 'floor'" class="floorTab">
        <div class="mono caption sectionLabel">
          floor view · pet any cat for half hero yield
        </div>
        <div v-if="game.collection.length === 0" class="empty mono">
          no cats on the floor
        </div>
        <div
          v-for="c in game.collection"
          :key="c.id"
          class="floorRow"
          :class="`r-${c.rarity}`"
        >
          <img :src="c.emoji" alt="" class="catThumb" />
          <div class="floorInfo">
            <div class="floorRowTop">
              <span class="serif rowName">{{ c.name }}</span>
              <span class="mono rarityTag">{{
                RarityMeta[c.rarity].label.toUpperCase()
              }}</span>
            </div>
            <div class="moodBar">
              <div
                class="moodFill"
                :class="{
                  low: c.mood <= 50 && c.mood > 0,
                  asleep: c.mood === 0,
                }"
                :style="{ width: c.mood + '%' }"
              />
            </div>
            <div class="mono moodLine">
              {{ moodLabel(c.mood) }} · {{ Math.round(c.mood) }}%
            </div>
          </div>
          <button class="actionBtn mono" @click="game.petCat(c.id)">
            pet
          </button>
        </div>
      </div>

      <!-- ─── MANAGE TAB ─── -->
      <div v-if="tab === 'manage'" class="manageTab">
        <section>
          <div class="mono caption sectionLabel">
            merge · combine {{ MERGE_COUNT }} same-rarity → 1 higher rarity
          </div>
          <div
            v-for="r in RARITY_ORDER.filter((x) => x !== 'legendary')"
            :key="r"
            class="manageRow"
            :class="`r-${r}`"
          >
            <span class="dot" />
            <div class="manageInfo">
              <span class="serif rowName">{{ RarityMeta[r].label }}</span>
              <span class="mono rowCount">×{{ byRarity[r] }}</span>
            </div>
            <div class="mono nextHint">
              → {{ nextRarity(r) ? RarityMeta[nextRarity(r)!].label : "" }}
            </div>
            <button
              class="actionBtn mono"
              :disabled="byRarity[r] < MERGE_COUNT"
              @click="doMerge(r)"
            >
              merge {{ MERGE_COUNT }}
            </button>
          </div>
        </section>

        <section>
          <div class="mono caption sectionLabel">
            release · free a cat, get a refund
          </div>
          <div v-if="game.collection.length === 0" class="empty mono">
            no cats to release
          </div>
          <div
            v-for="c in game.collection"
            :key="c.id"
            class="manageRow"
            :class="`r-${c.rarity}`"
          >
            <img :src="c.emoji" alt="" class="catThumb" />
            <div class="manageInfo">
              <span class="serif rowName">{{ c.name }}</span>
              <span class="mono rarityTag">{{
                RarityMeta[c.rarity].label.toUpperCase()
              }}</span>
            </div>
            <template v-if="releaseTarget === c.id">
              <button class="confirmBtn mono" @click="doRelease(c.id)">
                confirm
              </button>
              <button class="actionBtn mono" @click="releaseTarget = null">
                cancel
              </button>
            </template>
            <button v-else class="actionBtn mono" @click="releaseTarget = c.id">
              release · +☕{{ RELEASE_REFUND }}
            </button>
          </div>
        </section>
      </div>

      <!-- ─── UPGRADES TAB ─── -->
      <div v-if="tab === 'upgrades'" class="upgradesTab">
        <div v-for="u in game.upgrades" :key="u.id" class="upgradeRow">
          <div class="upgradeIcon serif">{{ u.icon }}</div>
          <div class="upgradeInfo">
            <div class="upgradeNameRow">
              <span class="serif upgradeName">{{ u.name }}</span>
              <span v-if="u.level > 0" class="mono level"
                >LV. {{ u.level }} / {{ game.upgradeMaxLevel(u) }}</span
              >
            </div>
            <div class="upgradeDesc">{{ u.description }}</div>
            <div class="pips">
              <span
                v-for="i in game.upgradeMaxLevel(u)"
                :key="i - 1"
                class="pip"
                :class="{ active: i - 1 < u.level }"
              />
            </div>
          </div>
          <button
            class="primaryBtn small mono"
            :disabled="
              u.level >= game.upgradeMaxLevel(u) ||
              game.balance < game.upgradeCost(u)
            "
            @click="game.buyUpgrade(u.id)"
          >
            <template v-if="u.level >= game.upgradeMaxLevel(u)">{{ game.upgradeMaxLevel(u) === 1 ? 'OWNED' : 'MAX' }}</template>
            <template v-else>☕ {{ formatNum(game.upgradeCost(u)) }}</template>
          </button>
        </div>
      </div>

      <!-- ─── PRESTIGE TAB ─── -->
      <div v-if="tab === 'prestige'" class="prestigeTab">
        <div class="prestigeStat">
          <div class="mono caption">current prestige</div>
          <div class="serif bigStat">
            {{
              prestige.prestigeLevel === 0
                ? "—"
                : `×${prestige.prestigeMultiplier.toFixed(2)}`
            }}
          </div>
          <div class="mono volumeLabel">
            vol. {{ prestige.volume }} ·
            {{
              prestige.prestigeLevel === 0
                ? "no prestige yet"
                : `prestige ${prestige.prestigeLevel}`
            }}
          </div>
        </div>

        <div class="prestigeAction" :class="{ ready: game.isBinderFull }">
          <div class="mono caption">
            {{
              game.isBinderFull
                ? "prestige available"
                : "fill all slots to prestige"
            }}
          </div>
          <div class="serif actionTitle">
            {{
              game.isBinderFull
                ? `Prestige → ×${prestige.nextMultiplier.toFixed(2)}`
                : `${game.filledCount} / 18 slots filled`
            }}
          </div>
          <p class="actionDesc">
            <template v-if="game.isBinderFull">
              All cats and upgrades will be reset. You'll start the next volume
              with a permanent multiplier to all click yields and income.
            </template>
            <template v-else>
              Fill every slot in your binder to unlock prestige. Merge or draw
              to fill remaining slots.
            </template>
          </p>
          <div v-if="!game.isBinderFull" class="prestigeProgress">
            <div
              class="prestigeFill"
              :style="{ width: (game.filledCount / 18) * 100 + '%' }"
            />
          </div>
        </div>

        <button
          v-if="game.isBinderFull"
          class="primaryBtn big mono"
          @click="doPrestige"
        >
          Prestige now
        </button>

        <div class="resetInfo">
          <div class="mono caption">what resets</div>
          <div class="resetItem">
            <span class="resetDot reset" />All cats in binder
          </div>
          <div class="resetItem">
            <span class="resetDot reset" />All upgrade levels
          </div>
          <div class="resetItem">
            <span class="resetDot reset" />Current balance
          </div>
          <div class="mono caption" style="margin-top: 12px">what you keep</div>
          <div class="resetItem">
            <span class="resetDot keep" />Permanent ×{{
              prestige.nextMultiplier.toFixed(2)
            }}
            multiplier (click + income)
          </div>
          <div class="resetItem">
            <span class="resetDot keep" />Prestige count
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  background: oklch(0 0 0 / 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 50;

  &.visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: min(480px, 92%);
  background: var(--paper);
  color: var(--ink);
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -30px 0 80px -20px oklch(0 0 0 / 0.5);
  z-index: 60;
  display: flex;
  flex-direction: column;
  font-family: "Fredoka", sans-serif;

  @media (max-width: 425px) {
    width: 100%;
  }

  &.open {
    transform: translateX(0);
  }
}

.head {
  padding: 24px 28px 16px;
  border-bottom: 1px solid var(--rule);
  display: flex;
  align-items: center;
  gap: 14px;
}

.headTitle {
  flex: 1;
  min-width: 0;
}

.caption {
  font-size: 9px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.title {
  font-size: 32px;
  font-style: italic;
  font-weight: 600;
  line-height: 1;
  margin-top: 4px;
  color: var(--ink);
}

.closeBtn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 50%;
  color: var(--ink);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.tabsRow {
  padding: 12px 20px;
  border-bottom: 1px solid var(--rule);
  display: flex;
  min-width: 0;
}

.tabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--bg-1);
  border-radius: 999px;
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;

  &::-webkit-scrollbar { display: none; }
}

.tabBtn {
  flex: 1 1 auto;
  min-width: 0;
  padding: 7px 8px;
  background: transparent;
  color: var(--ink-soft);
  border: none;
  border-radius: 999px;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;

  &.active {
    background: var(--ink);
    color: var(--paper);
  }
}

.balance {
  text-align: right;
  flex-shrink: 0;
  min-width: 0;
}

.balanceVal {
  font-size: 20px;
  font-style: italic;
  font-weight: 600;
  color: var(--ink);
}

.body {
  flex: 1;
  overflow: auto;
  padding: 16px 24px 24px;
}

/* DRAW TAB */
.gachaTab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding-top: 12px;
}

.drawBox {
  width: 210px;
  height: 280px;
  background: var(--bg-1);
  border: 1px solid var(--rule);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;

  &.animating {
    background: radial-gradient(circle, var(--accent), var(--bg-1));
  }
}

.drawingDots {
  font-size: 28px;
  font-style: italic;
  font-weight: 700;
  color: var(--paper);
}

.drawnCat {
  padding: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  img {
    width: 72px;
    height: 72px;
    image-rendering: pixelated;
  }

  .drawnName {
    font-size: 22px;
    font-style: italic;
    font-weight: 600;
  }

  .drawnDesc {
    font-size: 11px;
    color: var(--ink-soft);
    font-style: italic;
    max-width: 170px;
    line-height: 1.4;
  }
}

.rarityChip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid var(--r);
  border-radius: 999px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--r);
  }
  .mono {
    font-size: 9px;
    letter-spacing: 0.16em;
    color: var(--r);
  }
}

.placeholder {
  text-align: center;
  padding: 20px;
  opacity: 0.5;

  .club {
    font-size: 36px;
    margin-bottom: 8px;
  }
}

.primaryBtn {
  padding: 12px 32px;
  background: var(--ink);
  color: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 999px;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;

  &:disabled {
    background: var(--bg-1);
    color: var(--ink-faint);
    cursor: not-allowed;
  }

  &.small {
    padding: 8px 12px;
    font-size: 10px;
    letter-spacing: 0.1em;
    font-weight: 700;
  }

  &.big {
    padding: 14px 36px;
    font-size: 14px;
    border: none;
    box-shadow: 0 4px 16px -4px oklch(0 0 0 / 0.4);
  }
}

.slotCount {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-faint);
  text-align: center;
}

.ratesPanel {
  width: 100%;
  padding: 12px;
  background: var(--bg-1);
  border: 1px solid var(--rule);
  border-radius: 8px;

  .caption {
    margin-bottom: 8px;
  }
}

.rateRow {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--r);
    flex-shrink: 0;
  }
  .rateName {
    font-size: 11px;
    font-style: italic;
    font-weight: 600;
    flex: 1;
  }
  .ratePct {
    font-size: 10px;
    color: var(--ink-soft);
  }
}

/* FLOOR */
.floorTab {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.floorRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--rule);
  border-radius: 10px;
  background: var(--bg-1);
}

.floorInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.floorRowTop {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.moodBar {
  height: 4px;
  width: 100%;
  background: var(--rule);
  border-radius: 2px;
  overflow: hidden;
}

.moodFill {
  height: 100%;
  background: oklch(0.65 0.13 145);
  transition: width 0.2s linear;

  &.low { background: oklch(0.72 0.12 60); }
  &.asleep { background: var(--ink-faint); }
}

.moodLine {
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

/* MANAGE */
.manageTab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sectionLabel {
  font-size: 9px;
  letter-spacing: 0.24em;
  margin-bottom: 10px;
}

.manageRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--rule);

  > .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--r);
    flex-shrink: 0;
  }
}

.catThumb {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.manageInfo {
  flex: 1;
  min-width: 0;
}

.rowName {
  font-size: 14px;
  font-style: italic;
  font-weight: 600;
}

.rowCount {
  font-size: 10px;
  color: var(--ink-soft);
  margin-left: 8px;
}

.rarityTag {
  font-size: 9px;
  color: var(--r);
  margin-left: 6px;
  letter-spacing: 0.14em;
}

.nextHint {
  font-size: 9px;
  color: var(--ink-faint);
}

.actionBtn {
  padding: 6px 12px;
  background: var(--ink);
  color: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 999px;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    background: var(--bg-1);
    color: var(--ink-faint);
    cursor: not-allowed;
  }
}

.confirmBtn {
  padding: 5px 10px;
  background: oklch(0.55 0.16 25);
  color: white;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  font-size: 10px;
  cursor: pointer;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.empty {
  font-size: 10px;
  color: var(--ink-faint);
  padding: 16px;
  text-align: center;
}

/* UPGRADES */
.upgradesTab {
  display: flex;
  flex-direction: column;
}

.upgradeRow {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-bottom: 1px solid var(--rule);
}

.upgradeIcon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: var(--bg-1);
  border: 1px solid var(--rule);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--accent);
}

.upgradeInfo {
  flex: 1;
  min-width: 0;
}

.upgradeNameRow {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.upgradeName {
  font-size: 15px;
  font-style: italic;
  font-weight: 600;
}

.level {
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

.upgradeDesc {
  font-size: 11px;
  color: var(--ink-soft);
  margin-top: 2px;
}

.pips {
  display: flex;
  gap: 3px;
  margin-top: 5px;
}

.pip {
  width: 14px;
  height: 3px;
  background: var(--rule);
  border-radius: 1px;

  &.active {
    background: var(--accent);
  }
}

/* PRESTIGE */
.prestigeTab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding-top: 16px;
}

.prestigeStat {
  width: 100%;
  padding: 20px;
  background: var(--bg-1);
  border: 1px solid var(--rule);
  border-radius: 12px;
  text-align: center;
}

.bigStat {
  font-size: 48px;
  font-style: italic;
  font-weight: 600;
  line-height: 1;
  margin-top: 8px;
}

.volumeLabel {
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  margin-top: 8px;
}

.prestigeAction {
  width: 100%;
  padding: 20px;
  background: var(--bg-1);
  border: 1px solid var(--rule);
  border-radius: 12px;

  &.ready {
    background: var(--accent);
    color: var(--paper);
    border-color: var(--accent);
  }
}

.actionTitle {
  font-size: 22px;
  font-style: italic;
  font-weight: 600;
  margin-top: 8px;
}

.actionDesc {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.5;
  opacity: 0.8;
}

.prestigeProgress {
  margin-top: 10px;
  height: 4px;
  background: var(--rule);
  border-radius: 2px;
  overflow: hidden;
}

.prestigeFill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.resetInfo {
  width: 100%;
  padding: 14px;
  background: var(--bg-1);
  border: 1px solid var(--rule);
  border-radius: 8px;
}

.resetItem {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 12px;
  color: var(--ink-soft);
}

.resetDot {
  width: 5px;
  height: 5px;
  border-radius: 50%;

  &.reset {
    background: oklch(0.55 0.16 25);
  }
  &.keep {
    background: oklch(0.55 0.13 145);
  }
}
</style>
