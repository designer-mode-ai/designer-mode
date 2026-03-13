<template>
  <button :class="['app-button', `app-button--${variant}`]" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary';
}>();
</script>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.app-button--primary, .app-button:not(.app-button--secondary) {
  background: #037DD6;
  color: #fff;
}

.app-button--primary:hover { background: #0260b4; }

.app-button--secondary {
  background: #f0f0f0;
  color: #333;
}

.app-button--secondary:hover { background: #e0e0e0; }
</style>
