import { defineStore } from "pinia";
import { ref, computed, watch, onUnmounted } from "vue";
import { usePrestigeStore } from "./prestige";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface RarityInfo {
  label: string;
  ability: string;
  description: string;
  income: number;
  glyph: string;
}

export const RarityMeta: Record<Rarity, RarityInfo> = {
  common: {
    label: "Common",
    ability: "Cozy Purr",
    description: "+0.5 ☕ per click",
    income: 1,
    glyph: "·",
  },
  uncommon: {
    label: "Uncommon",
    ability: "Warm Nap",
    description: "Mood decay −20%",
    income: 2,
    glyph: "··",
  },
  rare: {
    label: "Rare",
    ability: "Keen Senses",
    description: "Income ×1.10",
    income: 5,
    glyph: "◆",
  },
  epic: {
    label: "Epic",
    ability: "Crowd Pleaser",
    description: "Income ×1.25",
    income: 10,
    glyph: "◆◆",
  },
  legendary: {
    label: "Legendary",
    ability: "Cafe Star",
    description: "Income ×1.50, decay −30%",
    income: 30,
    glyph: "★",
  },
};

export const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 28,
  rare: 14,
  epic: 6,
  legendary: 2,
};

export interface Cat {
  id: number;
  name: string;
  rarity: Rarity;
  emoji: string;
  mood: number;
  found: string;
  notes: string;
  imgIdx: number;
}

export interface Upgrade {
  id: string;
  name: string;
  icon: string;
  description: string;
  baseCost: number;
  level: number;
  maxLevel?: number;
  costMult?: number;
}

export const SLOTS_PER_PAGE = 9;
export const PAGES_PER_VOLUME = 2;
export const TOTAL_SLOTS = SLOTS_PER_PAGE * PAGES_PER_VOLUME; // 18
export const MERGE_COUNT = 3;
export const UPGRADE_MAX_LEVEL = 5;
export const RELEASE_REFUND = 10;

// Draw cost scales with binder fullness so the last few slots are the hard ones.
// Veteran's Discount (u14) reduces the per-cat scaling base from 1.25 toward 1.15 (L5).
export function drawCostFor(catsInBinder: number, discountLevel = 0): number {
  const base = Math.max(1.05, 1.25 - 0.02 * discountLevel);
  return Math.round(50 * Math.pow(base, catsInBinder));
}

const CAT_NAMES = [
  "Whisker",
  "Shadow",
  "Mochi",
  "Biscuit",
  "Maple",
  "Pepper",
  "Cleo",
  "Toffee",
  "Ginger",
  "Saffron",
  "Hazel",
  "Pumpkin",
  "Iris",
  "Juniper",
  "Domino",
  "Pickle",
  "Noodle",
  "Miso",
  "Boba",
  "Oreo",
  "Sesame",
  "Cocoa",
  "Waffle",
  "Pretzel",
  "Clover",
  "Luna",
  "Sage",
  "Basil",
  "Nutmeg",
  "Cinnamon",
  "Fig",
  "Plum",
  "Berry",
  "Olive",
  "Peach",
  "Mango",
  "Lemon",
  "Chai",
  "Mocha",
  "Latte",
];

const CAT_DESCS = [
  "Sits in boxes exclusively.",
  "Demands attention at 3 AM.",
  "Has strong opinions about fish.",
  "Sleeps 18 hours a day, minimum.",
  "Judges you from the top shelf.",
  "Purrs like a small engine.",
  "Will steal your seat.",
  "Meows at walls. Knows something.",
  "Expert at knocking things off tables.",
  "Watches birds with great intensity.",
  "Tolerates exactly two pets.",
  "Followed someone home. Stayed.",
  "Believes all food is their food.",
  "Has a favorite blanket. Guard it.",
  "Stares into the void regularly.",
  "Befriends every dog on sight.",
  "Hides when guests arrive. Always.",
  "Loves chin scratches exclusively.",
  "Runs at 3 AM for no reason.",
  "Will sit on your keyboard. Always.",
];

import cat1 from "../assets/CatImages/cat-1.png";
import cat2 from "../assets/CatImages/cat-2.png";
import cat3 from "../assets/CatImages/cat-3.png";
import cat4 from "../assets/CatImages/cat-4.png";
import cat5 from "../assets/CatImages/cat-5.png";
import cat6 from "../assets/CatImages/cat-6.png";
import cat7 from "../assets/CatImages/cat-7.png";
import cat8 from "../assets/CatImages/cat-8.png";
import cat9 from "../assets/CatImages/cat-9.png";
import cat10 from "../assets/CatImages/cat-10.png";
import cat11 from "../assets/CatImages/cat-11.png";
import cat12 from "../assets/CatImages/cat-12.png";

export const CAT_ICONS: string[] = [
  cat1,
  cat2,
  cat3,
  cat4,
  cat5,
  cat6,
  cat7,
  cat8,
  cat9,
  cat10,
  cat11,
  cat12,
];

function rollRarity(): Rarity {
  const roll = Math.random() * 100;
  let cum = 0;
  for (const r of RARITY_ORDER) {
    cum += RARITY_WEIGHTS[r];
    if (roll < cum) return r;
  }
  return "common";
}

function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export const RarityWeights = RARITY_WEIGHTS;

let nextCatId = 1;
function generateCat(rarity?: Rarity): Cat {
  const r = rarity ?? rollRarity();
  const imgIdx = Math.floor(Math.random() * CAT_ICONS.length);
  const found = `V · ${String(new Date().getDate()).padStart(2, "0")}`;
  return {
    id: nextCatId++,
    name: randomFrom(CAT_NAMES),
    rarity: r,
    emoji: CAT_ICONS[imgIdx],
    mood: 30 + Math.floor(Math.random() * 60),
    found,
    notes: randomFrom(CAT_DESCS),
    imgIdx,
  };
}

export function nextRarity(r: Rarity): Rarity | null {
  const i = RARITY_ORDER.indexOf(r);
  return i < RARITY_ORDER.length - 1 ? RARITY_ORDER[i + 1] : null;
}

// Releasing only clears space — refund is intentionally tiny so re-rolling is always a loss.
export function releaseRefund(_cat: Cat): number {
  return RELEASE_REFUND;
}

const DefaultUpgrades: Upgrade[] = [
  {
    id: "u1",
    name: "Better Pour",
    icon: "☕",
    description: "+1 ☕ per click",
    baseCost: 50,
    level: 0,
  },
  {
    id: "u2",
    name: "Cozy Cushions",
    icon: "◉",
    description: "Mood decay −10%",
    baseCost: 200,
    level: 0,
  },
  {
    id: "u3",
    name: "House Blend",
    icon: "◆",
    description: "Click yield ×1.25",
    baseCost: 600,
    level: 0,
  },
  {
    id: "u4",
    name: "Display Window",
    icon: "☼",
    description: "+5% income per unique rarity in binder",
    baseCost: 3000,
    costMult: 1.8,
    level: 0,
  },
  {
    id: "u5",
    name: "Night Owl",
    icon: "✦",
    description: "+5 mood/min to lowest cat",
    baseCost: 1200,
    costMult: 1.7,
    level: 0,
  },
  {
    id: "u6",
    name: "Catnip Garden",
    icon: "✿",
    description: "+2 ☕/s passive",
    baseCost: 1800,
    costMult: 1.7,
    level: 0,
  },
  {
    id: "u7",
    name: "Bell Above Door",
    icon: "⌣",
    description: "Customer tip every 90s",
    baseCost: 5000,
    costMult: 1.7,
    level: 0,
  },
  {
    id: "u8",
    name: "Loyalty Card",
    icon: "✚",
    description: "+20% income",
    baseCost: 12000,
    costMult: 1.7,
    level: 0,
  },
  {
    id: "u9",
    name: "Lucky Charm",
    icon: "♣",
    description: "+1% chance to bump rarity up",
    baseCost: 800,
    costMult: 1.8,
    level: 0,
  },
  {
    id: "u10",
    name: "Tip Jar",
    icon: "$",
    description: "+2% income per cat in binder",
    baseCost: 2400,
    costMult: 1.8,
    level: 0,
  },
  {
    id: "u11",
    name: "Auto Pet",
    icon: "♥",
    description: "Auto-pets hero faster each level",
    baseCost: 4000,
    costMult: 1.8,
    level: 0,
  },
  {
    id: "u12",
    name: "Floor View",
    icon: "☰",
    description: "Unlocks Floor tab — pet any cat for half yield",
    baseCost: 6000,
    maxLevel: 1,
    level: 0,
  },
  {
    id: "u13",
    name: "Merge Bonus",
    icon: "⚙",
    description: "Each merge drops a ☕ tip (scales with rarity)",
    baseCost: 3500,
    costMult: 1.8,
    level: 0,
  },
  {
    id: "u14",
    name: "Veteran's Discount",
    icon: "%",
    description: "Reduces draw cost scaling each level",
    baseCost: 18000,
    costMult: 2.0,
    level: 0,
  },
];

const save_key = "catcafe_save_v2";

// Offline progress caps & tuning.
export const OFFLINE_MAX_SECONDS = 8 * 3600; // 8 hours of catch-up max
const OFFLINE_MIN_SECONDS = 5; // ignore quick refreshes / dev reloads
const OFFLINE_AUTO_PET_CAP = 10000; // cap auto-pet contributions during offline

interface SaveData {
  balance: number;
  collection: Cat[];
  upgrades: Upgrade[];
  nextCatId: number;
  lastSaved?: number;
}

export const useGameStore = defineStore("game", () => {
  const prestigeStore = usePrestigeStore();

  const balance = ref(150);
  const collection = ref<Cat[]>([]);
  const upgrades = ref<Upgrade[]>(DefaultUpgrades.map((u) => ({ ...u })));
  const heroIdx = ref(0);
  // last drawn cat (for shop reveal animation)
  const lastDraw = ref<Cat | null>(null);

  // ────────────────────────────────────────
  // Derived state
  // ────────────────────────────────────────
  const filledCount = computed(() => collection.value.length);
  const isBinderFull = computed(() => filledCount.value >= TOTAL_SLOTS);
  const drawCost = computed(() =>
    drawCostFor(filledCount.value, upLevel("u14")),
  );
  const canDraw = computed(
    () => balance.value >= drawCost.value && !isBinderFull.value,
  );

  const effectiveHeroIdx = computed(() => {
    if (collection.value.length === 0) return -1;
    return heroIdx.value < collection.value.length ? heroIdx.value : 0;
  });
  const hero = computed<Cat | null>(() =>
    effectiveHeroIdx.value >= 0
      ? collection.value[effectiveHeroIdx.value]
      : null,
  );

  // Upgrade levels
  const upLevel = (id: string) =>
    upgrades.value.find((u) => u.id === id)?.level ?? 0;

  function upgradeCost(u: Upgrade): number {
    const mult = u.costMult ?? 1.6;
    return Math.round(u.baseCost * Math.pow(mult, u.level));
  }

  function upgradeMaxLevel(u: Upgrade): number {
    return u.maxLevel ?? UPGRADE_MAX_LEVEL;
  }

  // Per-click yield from petting the current hero.
  // Scales with hero rarity (RarityMeta.income × 2), Better Pour (+1 per level),
  // House Blend (×1.5 per level), and prestige.
  // Per-click hero yield. Click stays meaningful early (multiplied by HouseBlend),
  // fades naturally as idle income takes off.
  const clickYield = computed(() => {
    if (!hero.value) return 0;
    const base = RarityMeta[hero.value.rarity].income * 2 + upLevel("u1");
    const blendMult = Math.pow(1.25, upLevel("u3"));
    return base * blendMult * prestigeStore.prestigeMultiplier;
  });

  // Rarity-ability passive multiplier — only counts cats above 50% mood.
  const totalIncomeMultiplier = computed(() => {
    let mult = 1;
    for (const c of collection.value) {
      if (c.mood <= 50) continue;
      if (c.rarity === "rare") mult *= 1.1;
      else if (c.rarity === "epic") mult *= 1.25;
      else if (c.rarity === "legendary") mult *= 1.5;
    }
    return mult;
  });

  const moodDecayReduction = computed(() => {
    let r = 0;
    for (const c of collection.value) {
      if (c.mood <= 50) continue;
      if (c.rarity === "uncommon") r += 0.2;
      else if (c.rarity === "legendary") r += 0.3;
    }
    r += upLevel("u2") * 0.1;
    return Math.max(0.1, 1 - r);
  });

  // Display Window: +5% income per unique rarity in the binder, per level.
  // L5 with all 5 rarities present = ×2.25.
  const displayWindowMultiplier = computed(() => {
    const lvl = upLevel("u4");
    if (lvl === 0) return 1;
    const seen = new Set<Rarity>();
    for (const c of collection.value) seen.add(c.rarity);
    return 1 + 0.05 * lvl * seen.size;
  });
  const tipJarMultiplier = computed(
    () => 1 + 0.02 * upLevel("u10") * collection.value.length,
  );
  const loyaltyMultiplier = computed(() => Math.pow(1.2, upLevel("u8")));

  const incomeMultiplier = computed(
    () =>
      totalIncomeMultiplier.value *
      displayWindowMultiplier.value *
      tipJarMultiplier.value *
      loyaltyMultiplier.value *
      prestigeStore.prestigeMultiplier,
  );

  const moneyPerSecond = computed(() => {
    let base = 0;
    for (const c of collection.value) {
      const moodMult = c.mood === 0 ? 0.25 : c.mood <= 50 ? 0.5 : 1;
      base += RarityMeta[c.rarity].income * moodMult;
    }
    base += upLevel("u6") * 2;
    base *= incomeMultiplier.value;
    return base;
  });

  const floorViewUnlocked = computed(() => upLevel("u12") > 0);

  // ────────────────────────────────────────
  // Offline progress
  // ────────────────────────────────────────
  const offlineGain = ref(0);
  const offlineDurationSec = ref(0);

  function dismissOfflineGain() {
    offlineGain.value = 0;
    offlineDurationSec.value = 0;
  }

  // Approximates the income the user would have earned while away. Uses the
  // freshly-loaded state (cats, upgrades, prestige, mood snapshot). Mood does
  // NOT decay during offline — leaving the tab pauses the cats.
  function applyOfflineProgress(secondsAway: number) {
    const capped = Math.max(0, Math.min(secondsAway, OFFLINE_MAX_SECONDS));
    if (capped < OFFLINE_MIN_SECONDS) return;

    let gain = moneyPerSecond.value * capped;

    // Bell Above Door tips (every 90s).
    const bellLevel = upLevel("u7");
    if (bellLevel > 0) {
      const ticks = Math.floor(capped / 90);
      gain += ticks * (5 + 5 * bellLevel) * moneyPerSecond.value;
    }

    // Auto Pet — clamp so absurd offline times don't print money infinitely.
    const autoPetLevel = upLevel("u11");
    if (autoPetLevel > 0 && hero.value) {
      const interval = 10 / autoPetLevel;
      const pets = Math.min(
        Math.floor(capped / interval),
        OFFLINE_AUTO_PET_CAP,
      );
      gain += pets * clickYield.value;
    }

    if (gain > 0) {
      balance.value += gain;
      offlineGain.value = gain;
      offlineDurationSec.value = capped;
    }
  }

  // ────────────────────────────────────────
  // Persistence
  // ────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(save_key);
      if (!raw) return;
      const data: SaveData = JSON.parse(raw);
      balance.value = data.balance ?? 10;
      collection.value = (data.collection || []).map((c) => ({
        ...c,
        emoji: CAT_ICONS[c.imgIdx % CAT_ICONS.length],
      }));
      upgrades.value = DefaultUpgrades.map((d) => {
        const saved = (data.upgrades || []).find((u) => u.id === d.id);
        return saved ? { ...d, level: saved.level } : { ...d };
      });
      nextCatId = Math.max(
        data.nextCatId || 1,
        ...collection.value.map((c) => c.id + 1),
        1,
      );

      if (data.lastSaved) {
        const secondsAway = (Date.now() - data.lastSaved) / 1000;
        applyOfflineProgress(secondsAway);
      }
    } catch {
      // ignore
    }
  }

  function persist() {
    const data: SaveData = {
      balance: balance.value,
      collection: collection.value,
      upgrades: upgrades.value,
      nextCatId,
      lastSaved: Date.now(),
    };
    try {
      localStorage.setItem(save_key, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  // Throttle persistence — balance ticks at 10 Hz which would otherwise pound
  // localStorage. Force-save on tab hide / page unload so the timestamp is
  // accurate when the user closes the game.
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  function persistThrottled() {
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persist();
      persistTimer = null;
    }, 2000);
  }
  function forceSave() {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    persist();
  }

  watch([balance, collection, upgrades], () => persistThrottled(), {
    deep: true,
  });

  // Visibility tracking — also lets us catch up income when the tab is hidden
  // (user tabbed away or locked the screen) without requiring a full reload.
  let hiddenSince: number | null = null;

  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        hiddenSince = Date.now();
        forceSave();
      } else if (document.visibilityState === "visible") {
        if (hiddenSince !== null) {
          const seconds = (Date.now() - hiddenSince) / 1000;
          hiddenSince = null;
          applyOfflineProgress(seconds);
        }
      }
    });
    window.addEventListener("pagehide", forceSave);
    window.addEventListener("beforeunload", forceSave);
  }

  onUnmounted(() => forceSave());

  // ────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────
  function petHero() {
    if (!hero.value) return 0;
    const yieldAmt = clickYield.value;
    balance.value += yieldAmt;
    hero.value.mood = Math.min(100, hero.value.mood + 4);
    return yieldAmt;
  }

  // Pet a specific cat (Floor View). Half the click yield, scaled to that cat's rarity.
  function petCat(catId: number): number {
    const cat = collection.value.find((c) => c.id === catId);
    if (!cat) return 0;
    if (!floorViewUnlocked.value) return 0;
    const base = RarityMeta[cat.rarity].income * 2 + upLevel("u1");
    const blendMult = Math.pow(1.25, upLevel("u3"));
    const yieldAmt =
      base * blendMult * prestigeStore.prestigeMultiplier * 0.5;
    balance.value += yieldAmt;
    cat.mood = Math.min(100, cat.mood + 4);
    return yieldAmt;
  }

  function selectHero(idx: number) {
    heroIdx.value = idx;
  }

  function draw(): Cat | null {
    if (!canDraw.value) return null;
    balance.value -= drawCost.value;
    let cat = generateCat();
    // Lucky Charm: per-draw chance to bump rarity one tier higher (max +5% at L5).
    const luckPct = upLevel("u9") * 0.01;
    if (luckPct > 0 && Math.random() < luckPct) {
      const next = nextRarity(cat.rarity);
      if (next) cat = { ...cat, rarity: next };
    }
    collection.value.push(cat);
    lastDraw.value = cat;
    return cat;
  }

  function merge(rarity: Rarity): Cat | null {
    const cats = collection.value.filter((c) => c.rarity === rarity);
    if (cats.length < MERGE_COUNT) return null;
    const nr = nextRarity(rarity);
    if (!nr) return null;
    const sacrificed = cats.slice(0, MERGE_COUNT);
    const sIds = new Set(sacrificed.map((c) => c.id));
    collection.value = collection.value.filter((c) => !sIds.has(c.id));
    const newCat = generateCat(nr);
    collection.value.push(newCat);
    lastDraw.value = newCat;

    // Merge Bonus payout: 100 × 1.5^L × tierIndex(resulting rarity).
    const mbLevel = upLevel("u13");
    if (mbLevel > 0) {
      const tier = RARITY_ORDER.indexOf(nr);
      const payout = 100 * Math.pow(1.5, mbLevel) * tier;
      balance.value += payout;
    }

    return newCat;
  }

  function release(catId: number) {
    const cat = collection.value.find((c) => c.id === catId);
    if (!cat) return;
    balance.value += releaseRefund(cat);
    collection.value = collection.value.filter((c) => c.id !== catId);
  }

  function buyUpgrade(id: string) {
    const u = upgrades.value.find((x) => x.id === id);
    if (!u) return;
    if (u.level >= upgradeMaxLevel(u)) return;
    const cost = upgradeCost(u);
    if (balance.value < cost) return;
    balance.value -= cost;
    u.level += 1;
  }

  function doPrestige() {
    if (!isBinderFull.value) return;
    prestigeStore.advance();
    balance.value = 500;
    collection.value = [];
    upgrades.value = DefaultUpgrades.map((u) => ({ ...u }));
    heroIdx.value = 0;
    lastDraw.value = null;
    nextCatId = 1;
  }

  // Tick fires every 100ms (10 Hz). Tick-rate accumulators in seconds.
  const TICK_DT = 0.1;
  let bellTimer = 0;
  let autoPetTimer = 0;

  function tick() {
    balance.value += moneyPerSecond.value * TICK_DT;

    // Mood decay — softer than before. Cats at >50% are abled, ≤50% half income, 0 quartered.
    const decayMult = moodDecayReduction.value;
    for (const c of collection.value) {
      const decayPerSec = 0.3 * decayMult;
      const randomFactor = 0.85 + Math.random() * 0.3;
      c.mood = Math.max(0, c.mood - decayPerSec * randomFactor * TICK_DT);
    }

    // Night Owl: passive mood regen on the lowest-mood cat (5 mood/min per level).
    const owlLevel = upLevel("u5");
    if (owlLevel > 0 && collection.value.length > 0) {
      let lowest = collection.value[0];
      for (const c of collection.value) if (c.mood < lowest.mood) lowest = c;
      lowest.mood = Math.min(100, lowest.mood + (5 * owlLevel * TICK_DT) / 60);
    }

    // Auto Pet: pets hero every (10 / level) seconds.
    const autoPetLevel = upLevel("u11");
    if (autoPetLevel > 0 && hero.value) {
      autoPetTimer += TICK_DT;
      const interval = 10 / autoPetLevel;
      if (autoPetTimer >= interval) {
        autoPetTimer = 0;
        petHero();
      }
    } else {
      autoPetTimer = 0;
    }

    // Bell Above Door: every 90s, customer drops a flat tip = (5 + 5 × L) seconds of MPS.
    // Effective income at L5 ≈ +33% of MPS averaged over time.
    const bellLevel = upLevel("u7");
    if (bellLevel > 0) {
      bellTimer += TICK_DT;
      if (bellTimer >= 90) {
        bellTimer = 0;
        const seconds = 5 + 5 * bellLevel;
        balance.value += moneyPerSecond.value * seconds;
      }
    } else {
      bellTimer = 0;
    }
  }

  load();

  return {
    // state
    balance,
    collection,
    upgrades,
    heroIdx,
    lastDraw,
    // derived
    filledCount,
    isBinderFull,
    canDraw,
    drawCost,
    hero,
    effectiveHeroIdx,
    moneyPerSecond,
    clickYield,
    incomeMultiplier,
    displayWindowMultiplier,
    tipJarMultiplier,
    loyaltyMultiplier,
    totalIncomeMultiplier,
    floorViewUnlocked,
    // offline progress
    offlineGain,
    offlineDurationSec,
    dismissOfflineGain,
    // helpers
    upgradeCost,
    upgradeMaxLevel,
    // actions
    petHero,
    petCat,
    selectHero,
    draw,
    merge,
    release,
    buyUpgrade,
    doPrestige,
    tick,
  };
});
