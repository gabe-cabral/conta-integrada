<script setup lang="ts">
const props = withDefaults(defineProps<{
  name?: string | null
  size?: number
  src?: string | null
}>(), {
  name: null,
  size: 32,
  src: null,
});

const imageAvailable = ref(true);

const initials = computed(() => {
  const words = (props.name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || '?';
});

const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.max(12, props.size * 0.34)}px`,
}));

watch(() => props.src, () => {
  imageAvailable.value = true;
});
</script>

<template>
  <span
    class="user-avatar rounded-circle"
    :style="avatarStyle"
  >
    <img
      v-if="src && imageAvailable"
      :src="src"
      :alt="name ? `Foto de ${name}` : 'Foto do usuário'"
      class="user-avatar-image"
      @error="imageAvailable = false"
    />
    <span
      v-else
      class="user-avatar-initials"
      role="img"
      :aria-label="name ? `Iniciais de ${name}` : 'Avatar do usuário'"
    >
      {{ initials }}
    </span>
  </span>
</template>

<style scoped>
.user-avatar {
  display: inline-flex;
  flex: 0 0 auto;
  overflow: hidden;
  vertical-align: middle;
}

.user-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar-initials {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--bs-white);
  background: var(--bs-primary);
  font-weight: 600;
}
</style>
