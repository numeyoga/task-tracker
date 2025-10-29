<script>
  import { currentSettings, availableThemes, settingsActions } from '../../stores/settings.js';
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Page Header -->
  <div>
    <h1 class="text-4xl font-bold text-base-content mb-2">Settings</h1>
    <p class="text-base-content/70">Configure your work time tracking preferences</p>
  </div>

  <!-- Settings Form -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Theme Settings -->
        <div class="form-control">
          <label class="label" for="theme-select">
            <span class="label-text font-semibold">Theme</span>
          </label>
          <select
            id="theme-select"
            class="select select-bordered"
            bind:value={$currentSettings.theme}
            on:change={(e) => settingsActions.updateSetting('theme', e.target.value)}
          >
            {#each $availableThemes as theme (theme.value)}
              <option value={theme.value}>{theme.label}</option>
            {/each}
          </select>
          <div class="label">
            <span class="label-text-alt">Choose your preferred color theme</span>
          </div>
        </div>

        <!-- Time Format -->
        <div class="form-control">
          <div class="label">
            <span class="label-text font-semibold">Time Format</span>
          </div>
          <div class="flex space-x-4">
            <label class="cursor-pointer label">
              <input
                type="radio"
                class="radio radio-primary"
                bind:group={$currentSettings.timeFormat24h}
                value={true}
              />
              <span class="label-text ml-2">24-hour (14:30)</span>
            </label>
            <label class="cursor-pointer label">
              <input
                type="radio"
                class="radio radio-primary"
                bind:group={$currentSettings.timeFormat24h}
                value={false}
              />
              <span class="label-text ml-2">12-hour (2:30 PM)</span>
            </label>
          </div>
        </div>

        <!-- Daily Presence Requirement -->
        <div class="form-control">
          <label class="label" for="daily-presence-input">
            <span class="label-text font-semibold">Required Daily Presence</span>
          </label>
          <input
            id="daily-presence-input"
            type="number"
            min="1"
            max="16"
            step="0.5"
            class="input input-bordered"
            value={($currentSettings.requiredDailyPresence || 0) / (1000 * 60 * 60)}
            on:change={(e) =>
              settingsActions.updateSetting(
                'requiredDailyPresence',
                parseFloat(e.target.value) * 60 * 60 * 1000
              )}
          />
          <div class="label">
            <span class="label-text-alt">Hours per day (1-16)</span>
          </div>
        </div>

        <!-- Timer Max Duration -->
        <div class="form-control">
          <label class="label" for="timer-max-duration-input">
            <span class="label-text font-semibold">Timer Max Duration</span>
          </label>
          <input
            id="timer-max-duration-input"
            type="number"
            min="1"
            max="24"
            step="0.5"
            class="input input-bordered"
            value={($currentSettings.timerMaxDuration || 0) / (1000 * 60 * 60)}
            on:change={(e) =>
              settingsActions.updateSetting(
                'timerMaxDuration',
                parseFloat(e.target.value) * 60 * 60 * 1000
              )}
          />
          <div class="label">
            <span class="label-text-alt">Auto-stop timer after this many hours (1-24)</span>
          </div>
        </div>

        <!-- Auto Save Interval -->
        <div class="form-control">
          <label class="label" for="auto-save-interval-input">
            <span class="label-text font-semibold">Auto-Save Interval</span>
          </label>
          <input
            id="auto-save-interval-input"
            type="number"
            min="1"
            max="300"
            class="input input-bordered"
            value={($currentSettings.autoSaveInterval || 0) / 1000}
            on:change={(e) =>
              settingsActions.updateSetting('autoSaveInterval', parseInt(e.target.value) * 1000)}
          />
          <div class="label">
            <span class="label-text-alt">Seconds between auto-saves (1-300)</span>
          </div>
        </div>

        <!-- Data Retention -->
        <div class="form-control">
          <label class="label" for="data-retention-input">
            <span class="label-text font-semibold">Data Retention</span>
          </label>
          <input
            id="data-retention-input"
            type="number"
            min="1"
            max="52"
            class="input input-bordered"
            value={$currentSettings.dataRetentionWeeks || 5}
            on:change={(e) =>
              settingsActions.updateSetting('dataRetentionWeeks', parseInt(e.target.value))}
          />
          <div class="label">
            <span class="label-text-alt">Weeks to keep historical data (1-52)</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions justify-end mt-6 space-x-2">
        <button class="btn btn-outline" on:click={() => settingsActions.resetToDefaults()}>
          Reset to Defaults
        </button>
        <button class="btn btn-primary" on:click={() => console.log('Settings saved')}>
          Save Settings
        </button>
      </div>
    </div>
  </div>

  <!-- Import/Export Section -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title mb-4">Backup & Restore</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          class="btn btn-outline"
          on:click={async () => {
            try {
              const exportData = await settingsActions.exportSettings();
              console.log('Settings exported:', exportData);
            } catch (error) {
              console.error('Export failed:', error);
            }
          }}
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          Export Settings
        </button>

        <button class="btn btn-outline">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
          Import Settings
        </button>
      </div>
    </div>
  </div>
</div>
