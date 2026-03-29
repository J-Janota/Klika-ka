<script setup lang="ts">
import { useGameStore } from '../stores/game'
import CatCard from './CatCard.vue'

const store = useGameStore()
</script>

<template>
  <section class="myCatsSection">
    <h2>My Cats ({{ store.cats.length }}/{{ store.catCapacity }})</h2>
    <ul class="catsContainer" v-if="store.cats.length > 0">
      <CatCard v-for="cat in store.cats" :key="cat.id" :cat="cat" />
    </ul>
    <div class="emptyCats" v-else>
      <p>No cats yet! Adopt one from the shop.</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.myCatsSection {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  box-shadow: 0 8px 32px var(--panel-shadow);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 1rem;
  padding: 1rem;
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;

  h2 {
    color: var(--text-1);
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--panel-border);
  }
}

.catsContainer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  list-style: none;
  overflow-y: auto;
  align-content: flex-start;
  flex: 1;
  padding: 1rem;

  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--panel-border); border-radius: 2px; }
}

.emptyCats {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 0.9rem;
}
</style>
