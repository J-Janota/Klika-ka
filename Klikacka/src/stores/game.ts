import { defineStore } from 'pinia'
import { ref, computed, watch, onUnmounted } from 'vue'
import { usePrestigeStore } from './prestige'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Ability {
  name: string
  description: string
  effect:
    | { type: 'clickBonus'; value: number }
    | { type: 'moodDecayReduction'; value: number }
    | { type: 'incomeMultiplier'; value: number }
    | { type: 'incomeAndMoodDecay'; incomeMultiplier: number; moodDecayReduction: number }
}

export const Ability_By_Rarity: Record<Rarity, Ability> = {
  common:    { name: 'Cozy Purr',      description: '+0.5 ☕ per click',                         effect: { type: 'clickBonus',          value: 0.5  } },
  uncommon:  { name: 'Warm Nap',       description: 'All cats\' mood decay −20%',                effect: { type: 'moodDecayReduction',  value: 0.20 } },
  rare:      { name: 'Keen Senses',    description: 'All cats\' income ×1.10',                   effect: { type: 'incomeMultiplier',    value: 1.10 } },
  epic:      { name: 'Crowd Pleaser',  description: 'All cats\' income ×1.25',                   effect: { type: 'incomeMultiplier',    value: 1.25 } },
  legendary: { name: 'Cafe Star',      description: 'All cats\' income ×1.50 + mood decay −30%', effect: { type: 'incomeAndMoodDecay', incomeMultiplier: 1.50, moodDecayReduction: 0.30 } },
}

export interface Cat {
  id: number
  name: string
  rarity: Rarity
  incomePerSecond: number
  emoji: string
  mood: number
  moodDecayRate: number
}

export interface Upgrade {
  id: string
  name: string
  description: string
  cost: number
  purchased: boolean
  effect: { type: 'clickPower' | 'catCapacity' | 'moodDecay'; value: number }
}

const Cat_Names = [
  'Whiskers', 'Luna', 'Mochi', 'Biscuit', 'Cleo', 'Felix', 'Nala', 'Simba',
  'Mittens', 'Pumpkin', 'Jasper', 'Bella', 'Shadow', 'Oreo', 'Tiger',
  'Cinnamon', 'Pepper', 'Hazel', 'Maple', 'Chai', 'Espresso', 'Latte',
  'Caramel', 'Mocha', 'Cocoa', 'Boba', 'Toffee', 'Fudge', 'Marshmallow',
]


// https://maciaz.itch.io/12-cute-cat-icon-avatars

import cat1  from '../assets/CatImages/cat-1.png'
import cat2  from '../assets/CatImages/cat-2.png'
import cat3  from '../assets/CatImages/cat-3.png'
import cat4  from '../assets/CatImages/cat-4.png'
import cat5  from '../assets/CatImages/cat-5.png'
import cat6  from '../assets/CatImages/cat-6.png'
import cat7  from '../assets/CatImages/cat-7.png'
import cat8  from '../assets/CatImages/cat-8.png'
import cat9  from '../assets/CatImages/cat-9.png'
import cat10 from '../assets/CatImages/cat-10.png'
import cat11 from '../assets/CatImages/cat-11.png'
import cat12 from '../assets/CatImages/cat-12.png'

const Cat_Icons: string[] = [cat1, cat2, cat3, cat4, cat5, cat6, cat7, cat8, cat9, cat10, cat11, cat12]

const Rarity_Config: Record<Rarity, { weight: number; income: number; decayMin: number; decayMax: number }> = {
  common:    { weight: 55, income: 1,  decayMin: 0.80, decayMax: 1.40 },
  uncommon:  { weight: 25, income: 2,  decayMin: 0.60, decayMax: 1.00 },
  rare:      { weight: 12, income: 5,    decayMin: 0.45, decayMax: 0.75 },
  epic:      { weight: 6,  income: 10,   decayMin: 0.30, decayMax: 0.55 },
  legendary: { weight: 2,  income: 30,   decayMin: 0.15, decayMax: 0.35 },
}

function rollRarity(): Rarity {
  const roll = Math.random() * 100
  let accumulatedWeight = 0
  for (const rarity of Object.keys(Rarity_Config) as Rarity[]) {
    accumulatedWeight += Rarity_Config[rarity].weight
    if (roll < accumulatedWeight) return rarity
  }
  return 'common'
}

function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

const save_key = 'catcafe_save'

interface SaveData {
  balance: number
  clickPower: number
  cats: Cat[]
  catCapacity: number
  upgrades: Upgrade[]
}

const Default_Upgrades: Upgrade[] = [
  { id: 'treats',   name: 'Better Treats',    description: 'Double your click power.',            cost: 25,  purchased: false, effect: { type: 'clickPower',  value: 2    } },
  { id: 'corner',   name: 'Cozy Corner',      description: 'Fit 2 more cats in your cafe.',       cost: 100, purchased: false, effect: { type: 'catCapacity', value: 2    } },
  { id: 'espresso', name: 'Espresso Machine', description: 'Triple your click power.',             cost: 300, purchased: false, effect: { type: 'clickPower',  value: 3    } },
  { id: 'lounge',   name: 'VIP Lounge',       description: 'Fit 4 more cats in your cafe.',       cost: 750, purchased: false, effect: { type: 'catCapacity', value: 4    } },
  { id: 'catnip',   name: 'Catnip Stash',     description: 'All cats\' mood decay slows by 25%.', cost: 200, purchased: false, effect: { type: 'moodDecay',   value: 0.25 } },
  { id: 'calming',  name: 'Calming Music',    description: 'All cats\' mood decay slows by 40%.', cost: 600, purchased: false, effect: { type: 'moodDecay',   value: 0.40 } },
]

const Prestige_Threshold = 2500

export const useGameStore = defineStore('game', () => {
  const prestigeStore = usePrestigeStore()

  const balance = ref(0)
  const clickPower = ref(1)
  const cats = ref<Cat[]>([])
  const catCapacity = ref(6)
  const upgrades = ref<Upgrade[]>(Default_Upgrades.map(upgrade => ({ ...upgrade })))
  let nextCatId = 1
  const adoptCost = computed(() => Math.floor(50 * Math.pow(1.5, cats.value.length)))

  const activeCats = computed(() => cats.value.filter(cat => cat.mood > 50))

  const totalClickBonus = computed(() => {
    let bonus = 0
    for (const cat of activeCats.value) {
      const effect = Ability_By_Rarity[cat.rarity].effect
      if (effect.type === 'clickBonus') bonus += effect.value
    }
    return bonus
  })

  const totalIncomeMultiplier = computed(() => {
    let mult = 1
    for (const cat of activeCats.value) {
      const effect = Ability_By_Rarity[cat.rarity].effect
      if (effect.type === 'incomeMultiplier') mult *= effect.value
      if (effect.type === 'incomeAndMoodDecay') mult *= effect.incomeMultiplier
    }
    return mult
  })

  const globalMoodDecayMult = computed(() => {
    let reduction = 0
    for (const cat of activeCats.value) {
      const effect = Ability_By_Rarity[cat.rarity].effect
      if (effect.type === 'moodDecayReduction') reduction += effect.value
      if (effect.type === 'incomeAndMoodDecay') reduction += effect.moodDecayReduction
    }

    for (const upgrade of upgrades.value) {
      if (upgrade.purchased && upgrade.effect.type === 'moodDecay') reduction += upgrade.effect.value
    }
    return Math.max(0.1, 1 - reduction)
  })

  const moneyPerSecond = computed(() => {
    const base = cats.value.reduce((sum, cat) => {
      const mult = cat.mood === 0 ? 0.25 : cat.mood <= 50 ? 0.5 : 1
      return sum + cat.incomePerSecond * mult
    }, 0)
    return base * totalIncomeMultiplier.value * prestigeStore.permanentIncomeMultiplier
  })

  const canAdopt = computed(() =>
    balance.value >= adoptCost.value && cats.value.length < catCapacity.value
  )

  const canPrestige = computed(() => balance.value >= Prestige_Threshold)

  function load() {
    try {
      const save = localStorage.getItem(save_key)
      if (!save) return
      const data: SaveData = JSON.parse(save)
      balance.value = data.balance || 0
      clickPower.value = data.clickPower || 1
      cats.value = (data.cats || []).map(cats => ({
        ...cats,
        emoji: Cat_Icons[cats.id % Cat_Icons.length],
        mood: cats.mood || 100,
        moodDecayRate: cats.moodDecayRate || randBetween(
          Rarity_Config[cats.rarity].decayMin,
          Rarity_Config[cats.rarity].decayMax
        ),
      }))
      catCapacity.value = data.catCapacity || 6
      upgrades.value = Default_Upgrades.map(defaultUpgrade => {
        const saved = (data.upgrades || []).find(upgrade => upgrade.id === defaultUpgrade.id)
        return saved ? { ...defaultUpgrade, purchased: saved.purchased } : { ...defaultUpgrade }
      })
      nextCatId = cats.value.reduce((max, c) => Math.max(max, c.id + 1), 1)
    } catch {
      const data: SaveData = {
        balance: 0,
        clickPower: 1,
        cats: [],
        catCapacity: 6,
        upgrades: Default_Upgrades.map(upgrade => ({ ...upgrade })),
      }
      localStorage.setItem(save_key, JSON.stringify(data))
    }
  }

  function save(data: SaveData) {
    localStorage.setItem(save_key, JSON.stringify(data))
  }

  watch(
   () => ({ balance: balance.value, clickPower: clickPower.value, cats: cats.value, catCapacity: catCapacity.value, upgrades: upgrades.value }),
   (data) => save(data),
   { deep: true }
  )

  onUnmounted(() => {
    save({ balance: balance.value, clickPower: clickPower.value, cats: cats.value, catCapacity: catCapacity.value, upgrades: upgrades.value })
  })

  function click() {
    balance.value += clickPower.value + totalClickBonus.value
  }

  function adoptCat() {
    if (!canAdopt.value) return
    balance.value -= adoptCost.value
    const rarity = rollRarity()
    const { decayMin, decayMax } = Rarity_Config[rarity]
    const cat: Cat = {
      id: nextCatId++,
      name: randomFrom(Cat_Names),
      rarity,
      incomePerSecond: Rarity_Config[rarity].income,
      emoji: randomFrom(Cat_Icons),
      mood: 100,
      moodDecayRate: randBetween(decayMin, decayMax),
    }
    cats.value.push(cat)
  }

  function buyUpgrade(id: string) {
    const upgrade = upgrades.value.find(upgrade => upgrade.id === id)
    if (!upgrade || upgrade.purchased || balance.value < upgrade.cost) return
    balance.value -= upgrade.cost
    upgrade.purchased = true
    if (upgrade.effect.type === 'clickPower') {
      clickPower.value *= upgrade.effect.value
    } else if (upgrade.effect.type === 'catCapacity') {
      catCapacity.value += upgrade.effect.value
    }
  }

  function petCat(id: number) {
    const cat = cats.value.find(cat => cat.id === id)
    if (!cat) return
    cat.mood = Math.min(100, cat.mood + 25)
  }

  function resetForPrestige(bonuses: { clickMultiplier: number; catCapacityBonus: number }) {
    balance.value = 0
    clickPower.value = 1 * bonuses.clickMultiplier
    cats.value = []
    catCapacity.value = 6 + bonuses.catCapacityBonus
    upgrades.value = Default_Upgrades.map(ugrade => ({ ...ugrade }))
    nextCatId = 1
  }

  function tick() {
    balance.value += moneyPerSecond.value / 10

    const decayMult = globalMoodDecayMult.value
    for (const cat of cats.value) {
      const randomFactor = 0.8 + Math.random() * 0.4
      const decayThisTick = (cat.moodDecayRate * decayMult * randomFactor) / 10
      cat.mood = Math.max(0, cat.mood - decayThisTick)
    }
  }

  load()

  return {
    balance, clickPower, cats, catCapacity, upgrades,
    moneyPerSecond, canAdopt, canPrestige, globalMoodDecayMult,
    totalClickBonus, totalIncomeMultiplier,
    click, adoptCat, buyUpgrade, petCat, tick, resetForPrestige, adoptCost
  }
})
