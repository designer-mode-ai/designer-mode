<template>
  <div class="app">
    <header class="app-header">
      <h1>Designer Mode — Vue Example</h1>
      <p>Press <kbd>Ctrl+Shift+D</kbd> to activate the inspector, then click any element.</p>
    </header>

    <main class="app-main">
      <AppCard title="Buttons">
        <AppButton data-testid="primary-btn" @click="handleClick">Primary Button</AppButton>
        <AppButton variant="secondary" data-testid="secondary-btn">Secondary</AppButton>
      </AppCard>

      <AppCard title="Typography">
        <h2>Heading 2</h2>
        <p>Regular paragraph text with <strong>bold</strong> and <em>italic</em> styling.</p>
      </AppCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppCard from './components/AppCard.vue';
import AppButton from './components/AppButton.vue';

function handleClick() {
  alert('Button clicked!');
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f8fa; }

.app { min-height: 100vh; }

.app-header {
  background: #1e1e1e;
  color: #e0e0e0;
  padding: 24px 32px;
}

.app-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
.app-header p { font-size: 14px; color: #888; }
.app-header kbd { background: #333; border-radius: 4px; padding: 1px 5px; font-size: 12px; font-family: monospace; }

.app-main {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
