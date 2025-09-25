<script>
  import { createEventDispatcher } from 'svelte';
  import { writable, derived } from 'svelte/store';

  const dispatch = createEventDispatcher();

  export let showTodayOnly = false;
  export let showEditControls = true;
  export let size = 'normal'; // 'sm', 'normal', 'lg'

  // Activity counter data - in a real app, this would come from a store/service
  const activityCounters = writable([
    {
      id: 'coffee',
      name: 'Coffee',
      icon: '☕',
      color: 'warning',
      count: 3,
      todayCount: 2,
      description: 'Cups of coffee',
      lastIncrement: new Date().toISOString(),
      goal: 4,
      unit: 'cups'
    },
    {
      id: 'breaks',
      name: 'Short Breaks',
      icon: '⏸️',
      color: 'info',
      count: 5,
      todayCount: 3,
      description: '5-15 minute breaks',
      lastIncrement: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      goal: 6,
      unit: 'breaks'
    },
    {
      id: 'water',
      name: 'Water',
      icon: '💧',
      color: 'accent',
      count: 4,
      todayCount: 4,
      description: 'Glasses of water',
      lastIncrement: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
      goal: 8,
      unit: 'glasses'
    },
    {
      id: 'interruptions',
      name: 'Interruptions',
      icon: '🔔',
      color: 'error',
      count: 2,
      todayCount: 2,
      description: 'Work interruptions',
      lastIncrement: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
      goal: null, // No goal - we want to minimize this
      unit: 'times'
    }
  ]);

  // Size classes
  const sizeClasses = {
    sm: {
      card: 'card-compact',
      text: 'text-sm',
      count: 'text-xl',
      button: 'btn-sm',
      icon: 'text-lg'
    },
    normal: {
      card: '',
      text: 'text-base',
      count: 'text-2xl',
      button: '',
      icon: 'text-xl'
    },
    lg: {
      card: '',
      text: 'text-lg',
      count: 'text-3xl',
      button: 'btn-lg',
      icon: 'text-2xl'
    }
  };

  $: classes = sizeClasses[size] || sizeClasses.normal;

  // Derived store for filtered counters
  $: displayCounters = derived(activityCounters, ($counters) =>
    $counters.map((counter) => ({
      ...counter,
      displayCount: showTodayOnly ? counter.todayCount : counter.count,
      progressPercentage: counter.goal
        ? Math.min(((showTodayOnly ? counter.todayCount : counter.count) / counter.goal) * 100, 100)
        : 0,
      isOverGoal:
        counter.goal && (showTodayOnly ? counter.todayCount : counter.count) > counter.goal,
      isAtGoal:
        counter.goal && (showTodayOnly ? counter.todayCount : counter.count) >= counter.goal,
      lastIncrementText: formatTimeAgo(new Date(counter.lastIncrement))
    }))
  );

  function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }

  function getColorClass(color, type = 'text') {
    const colorMap = {
      primary: type === 'text' ? 'text-primary' : 'bg-primary',
      secondary: type === 'text' ? 'text-secondary' : 'bg-secondary',
      accent: type === 'text' ? 'text-accent' : 'bg-accent',
      success: type === 'text' ? 'text-success' : 'bg-success',
      warning: type === 'text' ? 'text-warning' : 'bg-warning',
      error: type === 'text' ? 'text-error' : 'bg-error',
      info: type === 'text' ? 'text-info' : 'bg-info'
    };
    return colorMap[color] || colorMap.primary;
  }

  async function incrementCounter(counterId) {
    try {
      activityCounters.update((counters) =>
        counters.map((counter) => {
          if (counter.id === counterId) {
            return {
              ...counter,
              count: counter.count + 1,
              todayCount: counter.todayCount + 1,
              lastIncrement: new Date().toISOString()
            };
          }
          return counter;
        })
      );

      dispatch('counterIncremented', { counterId });
    } catch (error) {
      dispatch('error', { message: `Failed to increment counter: ${error.message}` });
    }
  }

  async function decrementCounter(counterId) {
    try {
      activityCounters.update((counters) =>
        counters.map((counter) => {
          if (counter.id === counterId && counter.todayCount > 0) {
            return {
              ...counter,
              count: Math.max(0, counter.count - 1),
              todayCount: Math.max(0, counter.todayCount - 1),
              lastIncrement: new Date().toISOString()
            };
          }
          return counter;
        })
      );

      dispatch('counterDecremented', { counterId });
    } catch (error) {
      dispatch('error', { message: `Failed to decrement counter: ${error.message}` });
    }
  }

  function resetCounter(counterId) {
    try {
      activityCounters.update((counters) =>
        counters.map((counter) => {
          if (counter.id === counterId) {
            return {
              ...counter,
              todayCount: 0,
              lastIncrement: new Date().toISOString()
            };
          }
          return counter;
        })
      );

      dispatch('counterReset', { counterId });
    } catch (error) {
      dispatch('error', { message: `Failed to reset counter: ${error.message}` });
    }
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <h3 class="font-semibold {classes.text}">Activity Counters</h3>
    <div class="flex items-center space-x-2">
      <!-- Time Period Toggle -->
      <div class="join">
        <input
          class="join-item btn {classes.button}"
          type="radio"
          name="period"
          aria-label="Today"
          bind:group={showTodayOnly}
          value={true}
        />
        <input
          class="join-item btn {classes.button}"
          type="radio"
          name="period"
          aria-label="Total"
          bind:group={showTodayOnly}
          value={false}
        />
      </div>
    </div>
  </div>

  <!-- Counters Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each $displayCounters as counter (counter.id)}
      <div class="card bg-base-100 border {classes.card}">
        <div class="card-body p-4">
          <!-- Counter Header -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <span class={classes.icon}>{counter.icon}</span>
              <div>
                <h4 class="font-medium {classes.text}">{counter.name}</h4>
                <p class="text-xs text-base-content/60">{counter.description}</p>
              </div>
            </div>
          </div>

          <!-- Count Display -->
          <div class="text-center mb-3">
            <div class="font-bold {classes.count} {getColorClass(counter.color)}">
              {counter.displayCount}
              <span class="text-sm font-normal text-base-content/60 ml-1">{counter.unit}</span>
            </div>

            <!-- Progress Bar (if goal exists) -->
            {#if counter.goal}
              <div class="w-full bg-base-300 rounded-full h-1.5 mt-2">
                <div
                  class="h-1.5 rounded-full transition-all duration-300 {getColorClass(
                    counter.color,
                    'bg'
                  )}"
                  class:bg-success={counter.isAtGoal && counter.color !== 'error'}
                  class:bg-error={counter.isOverGoal && counter.color === 'error'}
                  style="width: {counter.progressPercentage}%"
                ></div>
              </div>
              <div class="text-xs text-base-content/50 mt-1">
                {#if counter.color === 'error'}
                  Goal: ≤ {counter.goal}
                {:else}
                  Goal: {counter.goal} {counter.unit}
                {/if}
                {#if counter.isAtGoal && counter.color !== 'error'}
                  ✓
                {:else if counter.isOverGoal && counter.color === 'error'}
                  ⚠️
                {/if}
              </div>
            {/if}
          </div>

          <!-- Controls -->
          {#if showEditControls}
            <div class="flex items-center justify-between">
              <!-- Decrement -->
              <button
                class="btn btn-circle btn-ghost {classes.button}"
                disabled={counter.todayCount === 0}
                on:click={() => decrementCounter(counter.id)}
                title="Decrease count"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"
                  ></path>
                </svg>
              </button>

              <!-- Last Updated -->
              <div class="text-center">
                <div class="text-xs text-base-content/50">
                  {counter.lastIncrementText}
                </div>
              </div>

              <!-- Increment -->
              <button
                class="btn btn-circle {getColorClass(counter.color) === 'text-error'
                  ? 'btn-error'
                  : 'btn-primary'} {classes.button}"
                on:click={() => incrementCounter(counter.id)}
                title="Increase count"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
              </button>
            </div>

            <!-- Reset Button (for today only) -->
            {#if showTodayOnly && counter.todayCount > 0}
              <button
                class="btn btn-ghost btn-sm w-full mt-2 opacity-60 hover:opacity-100"
                on:click={() => resetCounter(counter.id)}
                title="Reset today's count"
              >
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                Reset Today
              </button>
            {/if}
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Summary Stats -->
  <div class="card bg-base-100 border">
    <div class="card-body p-4">
      <h4 class="font-semibold mb-3">Daily Summary</h4>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Total Activities -->
        <div class="text-center">
          <div class="font-bold text-primary text-xl">
            {$displayCounters.reduce((sum, c) => sum + c.displayCount, 0)}
          </div>
          <div class="text-xs text-base-content/60">Total Activities</div>
        </div>

        <!-- Goals Met -->
        <div class="text-center">
          <div class="font-bold text-success text-xl">
            {$displayCounters.filter((c) => c.isAtGoal && c.color !== 'error').length}
          </div>
          <div class="text-xs text-base-content/60">Goals Met</div>
        </div>

        <!-- Goals Remaining -->
        <div class="text-center">
          <div class="font-bold text-info text-xl">
            {$displayCounters.filter((c) => c.goal && !c.isAtGoal && c.color !== 'error').length}
          </div>
          <div class="text-xs text-base-content/60">Goals Remaining</div>
        </div>

        <!-- Wellness Score -->
        <div class="text-center">
          <div class="font-bold text-accent text-xl">
            {Math.round(
              ($displayCounters.filter((c) => c.isAtGoal && c.color !== 'error').length /
                $displayCounters.filter((c) => c.goal && c.color !== 'error').length) *
                100
            ) || 0}%
          </div>
          <div class="text-xs text-base-content/60">Wellness Score</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  {#if showEditControls}
    <div class="flex flex-wrap gap-2 justify-center">
      <button class="btn btn-outline btn-sm" on:click={() => incrementCounter('coffee')}>
        ☕ +1 Coffee
      </button>
      <button class="btn btn-outline btn-sm" on:click={() => incrementCounter('water')}>
        💧 +1 Water
      </button>
      <button class="btn btn-outline btn-sm" on:click={() => incrementCounter('breaks')}>
        ⏸️ +1 Break
      </button>
    </div>
  {/if}
</div>

<style>
  .join-item:checked {
    background-color: hsl(var(--p));
    border-color: hsl(var(--p));
    color: hsl(var(--pc));
  }

  .bg-primary {
    background-color: hsl(var(--p));
  }
  .bg-secondary {
    background-color: hsl(var(--s));
  }
  .bg-accent {
    background-color: hsl(var(--a));
  }
  .bg-success {
    background-color: hsl(var(--su));
  }
  .bg-warning {
    background-color: hsl(var(--wa));
  }
  .bg-error {
    background-color: hsl(var(--er));
  }
  .bg-info {
    background-color: hsl(var(--in));
  }

  .text-primary {
    color: hsl(var(--p));
  }
  .text-secondary {
    color: hsl(var(--s));
  }
  .text-accent {
    color: hsl(var(--a));
  }
  .text-success {
    color: hsl(var(--su));
  }
  .text-warning {
    color: hsl(var(--wa));
  }
  .text-error {
    color: hsl(var(--er));
  }
  .text-info {
    color: hsl(var(--in));
  }
</style>
