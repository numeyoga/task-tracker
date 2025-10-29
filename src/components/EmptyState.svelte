<script>
  /**
   * EmptyState Component
   *
   * A reusable component for displaying empty states, loading states, and error states
   * with consistent styling and structure.
   *
   * Props:
   * - icon: Icon name or path data (string)
   * - title: Main heading text (string)
   * - description: Supporting text (string)
   * - actionText: Button text (string, optional)
   * - actionVariant: Button style variant (string, default: "primary")
   * - size: Size variant - "sm", "md", "lg" (string, default: "md")
   * - type: Visual type - "empty", "loading", "error" (string, default: "empty")
   *
   * Events:
   * - action: Fired when action button is clicked
   */

  export let icon = 'M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  export let title = 'No Items Yet';
  export let description = 'Get started by creating your first item';
  export let actionText = '';
  export let actionVariant = 'primary';
  export let size = 'md';
  export let type = 'empty';

  // Size configurations
  const sizes = {
    sm: {
      container: 'py-8',
      icon: 'w-12 h-12',
      title: 'text-base',
      description: 'text-sm'
    },
    md: {
      container: 'py-12',
      icon: 'w-16 h-16',
      title: 'text-lg',
      description: 'text-base'
    },
    lg: {
      container: 'py-16',
      icon: 'w-20 h-20',
      title: 'text-xl',
      description: 'text-lg'
    }
  };

  // Type configurations
  const types = {
    empty: {
      iconColor: 'text-base-content/30',
      titleColor: 'text-base-content',
      descriptionColor: 'text-base-content/70'
    },
    loading: {
      iconColor: 'text-primary',
      titleColor: 'text-base-content',
      descriptionColor: 'text-base-content/70'
    },
    error: {
      iconColor: 'text-error',
      titleColor: 'text-error',
      descriptionColor: 'text-error/70'
    }
  };

  $: sizeConfig = sizes[size] || sizes.md;
  $: typeConfig = types[type] || types.empty;
</script>

<div class="text-center {sizeConfig.container}">
  <!-- Icon -->
  {#if type === 'loading'}
    <div class="loading loading-spinner loading-lg {typeConfig.iconColor} mx-auto mb-4"></div>
  {:else}
    <svg
      class="{sizeConfig.icon} mx-auto {typeConfig.iconColor} mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon}></path>
    </svg>
  {/if}

  <!-- Title -->
  <h3 class="{sizeConfig.title} font-semibold {typeConfig.titleColor} mb-2">
    {title}
  </h3>

  <!-- Description -->
  {#if description}
    <p class="{sizeConfig.description} {typeConfig.descriptionColor} mb-4">
      {description}
    </p>
  {/if}

  <!-- Action Button -->
  {#if actionText}
    <button
      class="btn btn-{actionVariant}"
      on:click
    >
      {actionText}
    </button>
  {/if}

  <!-- Slot for custom content -->
  <slot />
</div>
