<script setup lang="ts">
import { onMounted, useId } from 'vue'

// ─── Replace with your AdSense Publisher ID ─────────────────────────────────
const PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX'
// ─── Replace with your Ad Slot ID (from AdSense dashboard) ──────────────────
const AD_SLOT = 'XXXXXXXXXX'
// ────────────────────────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{ type?: 'sidebar' | 'banner' }>(), { type: 'sidebar' })

const isConfigured = !PUBLISHER_ID.includes('X') && !AD_SLOT.includes('X')
const isDev = import.meta.env.DEV
const showPlaceholder = isDev || !isConfigured

const id = useId()

// Sidebar: 160×600  |  Banner: 728×90 (responsive)
const width = props.type === 'sidebar' ? 160 : 728
const height = props.type === 'sidebar' ? 600 : 90

onMounted(() => {
  if (showPlaceholder) return
  try {
    // @ts-expect-error adsbygoogle global
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  } catch {
    // AdSense not loaded
  }
})
</script>

<template>
  <!-- Placeholder (dev / not configured) -->
  <div
    v-if="showPlaceholder"
    :style="{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }"
    class="rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center flex-col gap-1"
  >
    <span class="text-xs text-slate-300 font-medium">Ad</span>
    <span class="text-[10px] text-slate-200">{{ width }}×{{ height }}</span>
  </div>

  <!-- Real AdSense unit (production) -->
  <ins
    v-else
    :id="id"
    class="adsbygoogle"
    style="display:block"
    :data-ad-client="PUBLISHER_ID"
    :data-ad-slot="AD_SLOT"
    :data-ad-format="type === 'banner' ? 'auto' : 'vertical'"
    data-full-width-responsive="true"
    :style="{ display: 'block', width: `${width}px`, height: type === 'sidebar' ? `${height}px` : 'auto' }"
  />
</template>
