<script>
  import { createEventDispatcher } from 'svelte';
  import { allTasks } from '../../stores/tasks.js';

  const dispatch = createEventDispatcher();

  export let weekOffset = 0; // 0 = current week, -1 = last week, etc.
  export let showNavigation = true;
  export let showExportOptions = true;

  let isLoading = false;

  // Calculate week dates
  $: weekDates = getWeekDates(weekOffset);
  $: weekLabel = getWeekLabel(weekDates);

  // Generate mock data for demonstration
  $: weeklyData = generateWeeklyData(weekDates, $allTasks);

  function getWeekDates(offset = 0) {
    const today = new Date();
    const currentDay = today.getDay();
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const monday = new Date(today);

    // Get Monday of the target week
    monday.setDate(today.getDate() - currentDay + 1 + offset * 7);

    const dates = [];
    for (let i = 0; i < 5; i++) {
      // Monday to Friday
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }

    return dates;
  }

  function getWeekLabel(dates) {
    const start = dates[0];
    const end = dates[dates.length - 1];

    if (weekOffset === 0) {
      return 'This Week';
    } else if (weekOffset === -1) {
      return 'Last Week';
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  }

  function generateWeeklyData(dates, tasks) {
    // In a real app, this would fetch actual data from the service
    const dailyData = dates.map((date) => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isFuture = date > new Date();

      // Generate realistic work data
      const workMinutes = isFuture ? 0 : Math.floor(Math.random() * 120) + 360; // 6-8 hours
      const breakMinutes = isFuture ? 0 : Math.floor(Math.random() * 30) + 45; // 45-75 min
      const mealMinutes = isFuture ? 0 : Math.floor(Math.random() * 30) + 30; // 30-60 min

      // Task distribution
      const taskData = tasks.slice(0, 3).map((task) => ({
        id: task.id,
        name: task.name,
        color: task.color,
        minutes: isFuture ? 0 : Math.floor(Math.random() * 180) + 60,
        sessions: isFuture ? 0 : Math.floor(Math.random() * 4) + 1
      }));

      return {
        date,
        dayName,
        isWeekend,
        isFuture,
        workMinutes,
        breakMinutes,
        mealMinutes,
        totalMinutes: workMinutes + breakMinutes + mealMinutes,
        taskData,
        efficiency: isFuture ? 0 : Math.floor(Math.random() * 30) + 70 // 70-100%
      };
    });

    // Calculate weekly totals
    const totals = {
      workHours:
        Math.round((dailyData.reduce((sum, day) => sum + day.workMinutes, 0) / 60) * 10) / 10,
      breakHours:
        Math.round((dailyData.reduce((sum, day) => sum + day.breakMinutes, 0) / 60) * 10) / 10,
      mealHours:
        Math.round((dailyData.reduce((sum, day) => sum + day.mealMinutes, 0) / 60) * 10) / 10,
      totalHours:
        Math.round((dailyData.reduce((sum, day) => sum + day.totalMinutes, 0) / 60) * 10) / 10,
      averageEfficiency:
        Math.round(
          dailyData.filter((d) => !d.isFuture).reduce((sum, day) => sum + day.efficiency, 0) /
            dailyData.filter((d) => !d.isFuture).length
        ) || 0,
      workDays: dailyData.filter((d) => !d.isFuture && d.workMinutes > 0).length
    };

    return { dailyData, totals };
  }

  function formatHours(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function formatEfficiency(percentage) {
    if (percentage >= 90) return { class: 'text-success', icon: '🎯' };
    if (percentage >= 80) return { class: 'text-primary', icon: '✅' };
    if (percentage >= 70) return { class: 'text-warning', icon: '⚠️' };
    return { class: 'text-error', icon: '❌' };
  }

  function getColorClass(color, type = 'text') {
    const colorMap = {
      primary: type === 'text' ? 'text-primary' : 'bg-primary',
      secondary: type === 'text' ? 'text-secondary' : 'bg-secondary',
      accent: type === 'text' ? 'text-accent' : 'bg-accent',
      success: type === 'text' ? 'text-success' : 'bg-success',
      warning: type === 'text' ? 'text-warning' : 'bg-warning',
      error: type === 'text' ? 'text-error' : 'bg-error',
      info: type === 'text' ? 'text-info' : 'bg-info',
      neutral: type === 'text' ? 'text-neutral' : 'bg-neutral'
    };
    return colorMap[color] || colorMap.primary;
  }

  function handleExport(format) {
    dispatch('export', { format, weekOffset, data: weeklyData });
  }

  function navigateWeek(direction) {
    weekOffset += direction;
    dispatch('weekChanged', { weekOffset });
  }
</script>

<div class="space-y-6">
  <!-- Header with Navigation -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold">Weekly Report</h2>
      <p class="text-base-content/60">{weekLabel}</p>
    </div>

    {#if showNavigation}
      <div class="flex items-center space-x-2">
        <button
          class="btn btn-ghost btn-sm"
          on:click={() => navigateWeek(-1)}
          title="Previous week"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Previous
        </button>

        <button
          class="btn btn-ghost btn-sm"
          on:click={() => (weekOffset = 0)}
          disabled={weekOffset === 0}
        >
          This Week
        </button>

        <button
          class="btn btn-ghost btn-sm"
          on:click={() => navigateWeek(1)}
          disabled={weekOffset >= 0}
          title="Next week"
        >
          Next
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </button>
      </div>
    {/if}
  </div>

  <!-- Weekly Summary Stats -->
  <div class="stats stats-vertical lg:stats-horizontal shadow bg-base-100 w-full">
    <div class="stat">
      <div class="stat-title">Total Work Hours</div>
      <div class="stat-value text-primary">{weeklyData.totals.workHours}h</div>
      <div class="stat-desc">{weeklyData.totals.workDays} working days</div>
    </div>

    <div class="stat">
      <div class="stat-title">Break Time</div>
      <div class="stat-value text-info">{weeklyData.totals.breakHours}h</div>
      <div class="stat-desc">Including {weeklyData.totals.mealHours}h meals</div>
    </div>

    <div class="stat">
      <div class="stat-title">Avg Efficiency</div>
      <div class="stat-value {formatEfficiency(weeklyData.totals.averageEfficiency).class}">
        {weeklyData.totals.averageEfficiency}%
      </div>
      <div class="stat-desc">
        {formatEfficiency(weeklyData.totals.averageEfficiency).icon} Performance
      </div>
    </div>

    <div class="stat">
      <div class="stat-title">Total Hours</div>
      <div class="stat-value text-accent">{weeklyData.totals.totalHours}h</div>
      <div class="stat-desc">Work + Breaks</div>
    </div>
  </div>

  <!-- Daily Breakdown -->
  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <h3 class="card-title">Daily Breakdown</h3>

      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Day</th>
              <th>Work Time</th>
              <th>Breaks</th>
              <th>Efficiency</th>
              <th>Top Tasks</th>
            </tr>
          </thead>
          <tbody>
            {#each weeklyData.dailyData as day (day.date.toISOString())}
              <tr class:opacity-50={day.isFuture}>
                <td>
                  <div>
                    <div class="font-semibold">{day.dayName}</div>
                    <div class="text-sm text-base-content/60">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </td>

                <td>
                  {#if day.isFuture}
                    <span class="text-base-content/50">—</span>
                  {:else}
                    <div class="font-mono font-semibold">
                      {formatHours(day.workMinutes)}
                    </div>
                  {/if}
                </td>

                <td>
                  {#if day.isFuture}
                    <span class="text-base-content/50">—</span>
                  {:else}
                    <div class="text-sm">
                      <div>{formatHours(day.breakMinutes)} breaks</div>
                      <div class="text-base-content/60">{formatHours(day.mealMinutes)} meals</div>
                    </div>
                  {/if}
                </td>

                <td>
                  {#if day.isFuture}
                    <span class="text-base-content/50">—</span>
                  {:else}
                    <div class="flex items-center space-x-1">
                      <span class="{formatEfficiency(day.efficiency).class} font-semibold">
                        {day.efficiency}%
                      </span>
                      <span>{formatEfficiency(day.efficiency).icon}</span>
                    </div>
                  {/if}
                </td>

                <td>
                  {#if day.isFuture}
                    <span class="text-base-content/50">—</span>
                  {:else}
                    <div class="flex flex-wrap gap-1">
                      {#each day.taskData.slice(0, 2) as task (task.id || task.name)}
                        <div class="badge badge-sm {getColorClass(task.color)} badge-outline">
                          {task.name}: {formatHours(task.minutes)}
                        </div>
                      {/each}
                      {#if day.taskData.length > 2}
                        <div class="badge badge-sm badge-ghost">
                          +{day.taskData.length - 2} more
                        </div>
                      {/if}
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Task Distribution Chart -->
  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <h3 class="card-title">Task Distribution</h3>

      {#each $allTasks.slice(0, 5) as task (task.id)}
        {@const weekMinutes = weeklyData.dailyData.reduce((sum, day) => {
          const taskDay = day.taskData.find((t) => t.id === task.id);
          return sum + (taskDay?.minutes || 0);
        }, 0)}

        {#if weekMinutes > 0}
          <div class="mb-4">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full {getColorClass(task.color, 'bg')}"></div>
                <span class="font-medium">{task.name}</span>
              </div>
              <span class="font-mono text-sm">{formatHours(weekMinutes)}</span>
            </div>

            <div class="w-full bg-base-300 rounded-full h-2">
              <div
                class="h-2 rounded-full {getColorClass(task.color, 'bg')}"
                style="width: {(weekMinutes / weeklyData.totals.workHours / 60) * 100}%"
              ></div>
            </div>

            <div class="text-xs text-base-content/60 mt-1">
              {Math.round((weekMinutes / weeklyData.totals.workHours) * 60 * 100)}% of work time
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Export Options -->
  {#if showExportOptions}
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title">Export Report</h3>
        <p class="text-base-content/60 mb-4">
          Export this weekly report in various formats for record keeping or sharing.
        </p>

        <div class="flex flex-wrap gap-2">
          <button class="btn btn-outline" on:click={() => handleExport('pdf')} disabled={isLoading}>
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            Export PDF
          </button>

          <button class="btn btn-outline" on:click={() => handleExport('csv')} disabled={isLoading}>
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            Export CSV
          </button>

          <button
            class="btn btn-outline"
            on:click={() => handleExport('print')}
            disabled={isLoading}
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              ></path>
            </svg>
            Print
          </button>

          <button
            class="btn btn-outline"
            on:click={() => handleExport('email')}
            disabled={isLoading}
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
            Email
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .badge-primary {
    border-color: hsl(var(--p));
    color: hsl(var(--p));
  }
  .badge-secondary {
    border-color: hsl(var(--s));
    color: hsl(var(--s));
  }
  .badge-accent {
    border-color: hsl(var(--a));
    color: hsl(var(--a));
  }
  .badge-success {
    border-color: hsl(var(--su));
    color: hsl(var(--su));
  }
  .badge-warning {
    border-color: hsl(var(--wa));
    color: hsl(var(--wa));
  }
  .badge-error {
    border-color: hsl(var(--er));
    color: hsl(var(--er));
  }
  .badge-info {
    border-color: hsl(var(--in));
    color: hsl(var(--in));
  }
  .badge-neutral {
    border-color: hsl(var(--n));
    color: hsl(var(--n));
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
  .bg-neutral {
    background-color: hsl(var(--n));
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
  .text-neutral {
    color: hsl(var(--n));
  }
</style>
