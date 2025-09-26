<script>
  import { navigationItems, viewActions, currentViewInfo } from '../stores/view.js';
  import { timerStatus } from '../stores/timer.js';

  // Icons (using simple SVG icons to avoid external dependencies)
  const icons = {
    timer: 'M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 9h4m-4 0V5m0 6a1 1 0 11-2 0 1 1 0 012 0z',
    list: 'M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    chart:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    settings:
      'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
    history: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z'
  };

  function handleNavigation(viewId) {
    viewActions.navigateTo(viewId);
  }
</script>

<!-- Navigation Sidebar -->
<div class="flex flex-col h-full">
  <!-- Logo/Brand -->
  <div class="p-6 border-b border-base-300">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
        <svg
          class="w-6 h-6 text-primary-content"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icons.timer}
          ></path>
        </svg>
      </div>
      <div>
        <h1 class="text-xl font-bold text-base-content">Work Timer</h1>
        <p class="text-sm text-base-content/60">Track your productivity</p>
      </div>
    </div>
  </div>

  <!-- Timer Status Display -->
  {#if $timerStatus.hasActiveTimer}
    <div class="p-4 bg-primary/10 border-b border-base-300">
      <div class="flex items-center space-x-3">
        <div class="w-3 h-3 bg-success rounded-full animate-pulse"></div>
        <div class="flex-1">
          <div class="text-sm font-medium text-base-content">Timer Running</div>
          <div class="text-xs text-base-content/70 truncate">
            {$timerStatus.currentTaskName}
          </div>
          <div class="text-lg font-mono font-bold text-primary">
            {$timerStatus.formattedElapsed}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="p-4 bg-base-200/50 border-b border-base-300">
      <div class="flex items-center space-x-3">
        <div class="w-3 h-3 bg-base-content/30 rounded-full"></div>
        <div class="flex-1">
          <div class="text-sm text-base-content/70">No active timer</div>
          <div class="text-xs text-base-content/50">Ready to start tracking</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Navigation Menu -->
  <nav class="flex-1 p-4">
    <ul class="menu w-full">
      {#each $navigationItems as item (item.id)}
        <li>
          <button
            class="flex items-center space-x-3 w-full text-left p-3 rounded-lg transition-colors {item.isActive
              ? 'bg-primary text-primary-content'
              : 'hover:bg-base-200'}"
            on:click={() => handleNavigation(item.id)}
            aria-current={item.isActive ? 'page' : undefined}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d={icons[item.icon]}
              ></path>
            </svg>
            <span class="font-medium">{item.name}</span>
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <!-- Quick Actions -->
  <div class="p-4 border-t border-base-300">
    <div class="text-xs font-semibold text-base-content/50 mb-3 uppercase tracking-wider">
      Quick Actions
    </div>
    <div class="space-y-2">
      {#if $timerStatus.hasActiveTimer}
        <button
          class="btn btn-error btn-sm w-full"
          on:click={() => {
            // This would call timer actions
            console.log('Stop timer');
          }}
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
          Stop Timer
        </button>
      {:else}
        <button class="btn btn-primary btn-sm w-full" on:click={() => handleNavigation('timer')}>
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 4h10a1 1 0 001-1V7a1 1 0 00-1-1H7a1 1 0 00-1 1v10a1 1 0 001 1z"
            ></path>
          </svg>
          Start Timer
        </button>
      {/if}

      {#if $timerStatus.hasActiveMealBreak}
        <button
          class="btn btn-warning btn-sm w-full"
          on:click={() => {
            console.log('Stop meal break');
          }}
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
          End Meal Break
        </button>
      {:else}
        <button
          class="btn btn-outline btn-sm w-full"
          on:click={() => {
            console.log('Start meal break');
          }}
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          Meal Break
        </button>
      {/if}
    </div>
  </div>

  <!-- Footer Info -->
  <div class="p-4 border-t border-base-300 text-center">
    <div class="text-xs text-base-content/50">Work Time Tracker v1.0</div>
    <div class="text-xs text-base-content/40 mt-1">
      Current View: {$currentViewInfo.name}
    </div>
  </div>
</div>

<style>
  .menu li button {
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .menu li button:hover {
    transform: translateY(-1px);
  }

  .menu li button[aria-current='page'] {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
</style>
