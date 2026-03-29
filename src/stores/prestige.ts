import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ThemeId } from './theme'

export interface Building {
  id: string
  name: string
  description: string
  cost: number
  purchased: boolean
  themeUnlock: ThemeId
  bonus: { type: 'catCapacity' | 'clickMultiplier' | 'incomeMultiplier'; value: number }
}

const defaultBuildings: Building[] = [
  {
    id: 'night_lounge',
    name: 'Night Owl Lounge',
    description: 'Base cat capacity +2 (starts at 8 each run).',
    cost: 3,
    purchased: false,
    themeUnlock: 'night',
    bonus: { type: 'catCapacity', value: 2 },
  },
  {
    id: 'luxury_spa',
    name: 'Luxury Cat Spa',
    description: 'Starting click power ×1.5 each run.',
    cost: 7,
    purchased: false,
    themeUnlock: 'premium',
    bonus: { type: 'clickMultiplier', value: 1.5 },
  },
  {
    id: 'arcade_cafe',
    name: 'Arcade Cat Cafe',
    description: 'All cat income ×1.20 permanently.',
    cost: 15,
    purchased: false,
    themeUnlock: 'vibrant',
    bonus: { type: 'incomeMultiplier', value: 1.2 },
  },
]

const save_key = 'catcafe_prestige'

interface PrestigeSaveData {
  prestigePoints: number
  prestigeCount: number
  buildingsPurchased: string[]
}

export const usePrestigeStore = defineStore('prestige', () => {
  const prestigePoints = ref(0)
  const prestigeCount = ref(0)
  const buildings = ref<Building[]>(defaultBuildings.map(building => ({ ...building })))

  const unlockedThemes = computed<Set<ThemeId>>(() => {
    const set = new Set<ThemeId>(['warm'])
    for (const building of buildings.value) {
      if (building.purchased) set.add(building.themeUnlock)
    }
    return set
  })

  const permanentIncomeMultiplier = computed(() => {
    let mult = 1
    for (const building of buildings.value) {
      if (building.purchased && building.bonus.type === 'incomeMultiplier') {
        mult *= building.bonus.value
      }
    }
    return mult
  })

  const startingBonuses = computed(() => {
    let clickMultiplier = 1
    let catCapacityBonus = 0
    for (const building of buildings.value) {
      if (!building.purchased) continue
      if (building.bonus.type === 'clickMultiplier') clickMultiplier *= building.bonus.value
      if (building.bonus.type === 'catCapacity') catCapacityBonus += building.bonus.value
    }
    return { clickMultiplier, catCapacityBonus }
  })

  const canAffordBuilding = (id: string) => {
    const building = buildings.value.find(building => building.id === id)
    return building ? !building.purchased && prestigePoints.value >= building.cost : false
  }

  function load() {
    try {
      const save = localStorage.getItem(save_key)
      if (!save) return
      const data: PrestigeSaveData = JSON.parse(save)
      prestigePoints.value = data.prestigePoints || 0
      prestigeCount.value = data.prestigeCount || 0
      const purchased = new Set(data.buildingsPurchased || [])
      buildings.value = defaultBuildings.map(building => ({
        ...building,
        purchased: purchased.has(building.id),
      }))
    } catch {
      const data: PrestigeSaveData = {
        prestigePoints: 0,
        prestigeCount: 0,
        buildingsPurchased: [],
      }
      localStorage.setItem(save_key, JSON.stringify(data))
    }
  }

  function save() {
    const data: PrestigeSaveData = {
      prestigePoints: prestigePoints.value,
      prestigeCount: prestigeCount.value,
      buildingsPurchased: buildings.value.filter(building => building.purchased).map(building => building.id),
    }
    localStorage.setItem(save_key, JSON.stringify(data))
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function prestige(resetFn: (bonuses: { clickMultiplier: number; catCapacityBonus: number }) => void) {
    prestigeCount.value++
    resetFn(startingBonuses.value)
    save()
  }

  function awardPoints(points: number) {
    prestigePoints.value += points
    save()
  }

  function buyBuilding(id: string) {
    const building = buildings.value.find(building => building.id === id)
    if (!building || building.purchased || prestigePoints.value < building.cost) return
    prestigePoints.value -= building.cost
    building.purchased = true
    save()
  }

  load()

  return {
    prestigePoints,
    prestigeCount,
    buildings,
    unlockedThemes,
    permanentIncomeMultiplier,
    startingBonuses,
    canAffordBuilding,
    prestige,
    awardPoints,
    buyBuilding,
  }
})
