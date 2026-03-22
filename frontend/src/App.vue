<template>
  <div id="app">
    <AppLayout v-if="authStore.isAuthenticated" />
    <RouterView v-else />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import { useAuthStore } from './stores/auth';
import AppLayout from './components/shared/AppLayout.vue';

const authStore = useAuthStore();
</script>