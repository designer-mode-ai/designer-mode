<template>
  <div class="card">
    <h2 class="card-title">{{ title }}</h2>
    <div class="card-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-title { font-size: 16px; font-weight: 700; color: #111; margin: 0; }

.card-body { display: flex; flex-direction: column; gap: 10px; }
</style>
