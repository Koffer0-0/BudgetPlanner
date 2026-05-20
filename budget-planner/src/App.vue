<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
import AdBlock from '@/components/AdBlock.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <div class="flex flex-1 min-w-0">
      <!-- Main content -->
      <div class="flex-1 min-w-0 flex flex-col">
        <router-view />
      </div>

      <!-- Right sidebar — only on very wide screens (≥1536px) -->
      <aside class="hidden 2xl:flex flex-col items-center w-48 flex-shrink-0 pt-[72px] pb-6 pr-4">
        <div class="sticky top-6">
          <AdBlock type="sidebar" />
        </div>
      </aside>
    </div>

    <AppFooter />
  </div>
</template>
