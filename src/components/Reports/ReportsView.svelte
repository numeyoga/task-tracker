<script>
  import { selectedDate, dailyReport, reportActions } from '../../stores/reports.js';
  import EmptyState from '../EmptyState.svelte';
  import WeeklyReport from './WeeklyReport.svelte';
  import AuditView from './AuditView.svelte';
  import ProgressBar from '../ProgressBar.svelte';

  // Tab state
  let activeTab = 'daily'; // 'daily', 'weekly', 'audit'

  // Initialize with today's date
  $: if (!$selectedDate) {
    selectedDate.set(new Date().toISOString().split('T')[0]);
  }

  function setActiveTab(tab) {
    activeTab = tab;
  }

  function handleExport(event) {
    console.log('Export requested:', event.detail);
    // TODO: Implement export functionality
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Page Header -->
  <div>
    <h1 class="text-4xl font-bold text-base-content mb-2">Reports</h1>
    <p class="text-base-content/70">View your work time reports and analytics</p>
  </div>

  <!-- Report Type Selector -->
  <div class="tabs tabs-boxed">
    <button
      class="tab {activeTab === 'daily' ? 'tab-active' : ''}"
      on:click={() => setActiveTab('daily')}
    >
      Daily Report
    </button>
    <button
      class="tab {activeTab === 'weekly' ? 'tab-active' : ''}"
      on:click={() => setActiveTab('weekly')}
    >
      Weekly Report
    </button>
    <button
      class="tab {activeTab === 'audit' ? 'tab-active' : ''}"
      on:click={() => setActiveTab('audit')}
    >
      Audit View
    </button>
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'daily'}
    <!-- Daily Report -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-between items-center mb-6">
          <h2 class="card-title">Daily Summary</h2>
          <input type="date" class="input input-bordered" bind:value={$selectedDate} />
        </div>

        {#if $dailyReport}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Arrival Time</div>
              <div class="stat-value text-lg">
                {$dailyReport.arrivalTime
                  ? new Date($dailyReport.arrivalTime).toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '--:--'}
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Total Presence</div>
              <div class="stat-value text-lg text-primary">
                {Math.round((($dailyReport.totalPresenceTime || 0) / (1000 * 60 * 60)) * 100) / 100}h
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Task Time</div>
              <div class="stat-value text-lg text-success">
                {Math.round((($dailyReport.totalTaskTime || 0) / (1000 * 60 * 60)) * 100) / 100}h
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Efficiency</div>
              <div class="stat-value text-lg text-accent">
                {$dailyReport.efficiency || 0}%
              </div>
            </div>
          </div>

          <!-- Task Breakdown with Visual Progress Bars -->
          {#if $dailyReport.taskBreakdown && $dailyReport.taskBreakdown.length > 0}
            <div class="mt-6">
              <h3 class="text-lg font-semibold mb-4">Task Breakdown</h3>
              <div class="space-y-4">
                {#each $dailyReport.taskBreakdown as task (task.taskId)}
                  {@const taskHours = Math.round(((task.totalTime || 0) / (1000 * 60 * 60)) * 100) / 100}
                  {@const maxTime = Math.max(...$dailyReport.taskBreakdown.map(t => t.totalTime || 0))}
                  <div class="p-4 bg-base-200 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                      <span class="font-medium">{task.taskName}</span>
                      <span class="text-primary font-bold">{taskHours}h</span>
                    </div>
                    <ProgressBar
                      value={task.totalTime || 0}
                      max={maxTime}
                      color="primary"
                      size="md"
                      showPercentage={false}
                    />
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {:else}
          <EmptyState
            icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            title="No Data Available"
            description="No work time recorded for this date"
          />
        {/if}
      </div>
    </div>
  {:else if activeTab === 'weekly'}
    <!-- Weekly Report -->
    <WeeklyReport on:export={handleExport} />
  {:else if activeTab === 'audit'}
    <!-- Audit View -->
    <AuditView />
  {/if}
</div>
