/**
 * Service Registry
 * Central registry for dependency injection and service management
 */

import { DataService } from './DataService.js';
import { TimerService } from './TimerService.js';
import { TaskService } from './TaskService.js';
import { ReportService } from './ReportService.js';
import { SettingsService } from './SettingsService.js';

/**
 * ServiceRegistry class manages all application services
 * Provides dependency injection and centralized service lifecycle management
 */
export class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.initialized = false;
  }

  /**
   * Initialize all services with proper dependency injection
   */
  async initialize() {
    if (this.initialized) {
      console.warn('ServiceRegistry already initialized');
      return;
    }

    try {
      console.log('Initializing ServiceRegistry...');

      // Initialize DataService first (no dependencies)
      const dataService = new DataService();
      await dataService.initialize();
      this.services.set('dataService', dataService);
      console.log('DataService initialized');

      // Initialize SettingsService (depends on DataService)
      const settingsService = new SettingsService(dataService);
      await settingsService.initialize();
      this.services.set('settingsService', settingsService);
      console.log('SettingsService initialized');

      // Initialize TaskService (depends on DataService)
      const taskService = new TaskService(dataService);
      this.services.set('taskService', taskService);
      console.log('TaskService initialized');

      // Initialize TimerService (depends on DataService and TaskService)
      const timerService = new TimerService(dataService, taskService);
      await timerService.initialize();
      this.services.set('timerService', timerService);
      console.log('TimerService initialized');

      // Initialize ReportService (depends on DataService)
      const reportService = new ReportService(dataService);
      this.services.set('reportService', reportService);
      console.log('ReportService initialized');

      // Set up cross-service connections
      this.setupServiceConnections();

      this.initialized = true;
      console.log('ServiceRegistry initialization complete');
    } catch (error) {
      console.error('Error initializing ServiceRegistry:', error);
      throw error;
    }
  }

  /**
   * Set up connections between services for events and callbacks
   */
  setupServiceConnections() {
    const timerService = this.services.get('timerService');
    const taskService = this.services.get('taskService');
    const settingsService = this.services.get('settingsService');

    // Timer service listens to settings changes for max duration
    if (settingsService && timerService) {
      settingsService.on('settingsChanged', (data) => {
        if (data.changes.includes('timerMaxDuration')) {
          timerService.setMaxDuration(data.settings.timerMaxDuration);
        }
      });
    }

    // Task service updates task total time when timer stops
    if (timerService && taskService) {
      timerService.on('timerStopped', async (data) => {
        try {
          await taskService.updateTaskTotalTime(data.taskId);
        } catch (error) {
          console.error('Error updating task total time:', error);
        }
      });
    }

    console.log('Service connections established');
  }

  /**
   * Get service by name
   * @param {string} serviceName - Name of the service
   * @returns {Object} - Service instance
   */
  getService(serviceName) {
    if (!this.initialized) {
      throw new Error('ServiceRegistry not initialized. Call initialize() first.');
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    return service;
  }

  /**
   * Check if service exists
   * @param {string} serviceName - Name of the service
   * @returns {boolean} - True if service exists
   */
  hasService(serviceName) {
    return this.services.has(serviceName);
  }

  /**
   * Get all available service names
   * @returns {string[]} - Array of service names
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }

  /**
   * Get service health status
   * @returns {Object} - Health status of all services
   */
  getHealthStatus() {
    const status = {
      initialized: this.initialized,
      services: {},
      healthy: true
    };

    this.services.forEach((service, name) => {
      try {
        // Basic health check - service exists and has expected methods
        const healthy = service && typeof service.destroy === 'function';
        status.services[name] = {
          healthy,
          hasEventListeners: service.eventListeners && service.eventListeners.size >= 0
        };

        if (!healthy) {
          status.healthy = false;
        }
      } catch (error) {
        status.services[name] = {
          healthy: false,
          error: error.message
        };
        status.healthy = false;
      }
    });

    return status;
  }

  /**
   * Destroy all services and clean up
   */
  async destroy() {
    if (!this.initialized) {
      return;
    }

    console.log('Destroying ServiceRegistry...');

    // Destroy services in reverse order of initialization
    const serviceNames = [
      'reportService',
      'timerService',
      'taskService',
      'settingsService',
      'dataService'
    ];

    for (const serviceName of serviceNames) {
      const service = this.services.get(serviceName);
      if (service && typeof service.destroy === 'function') {
        try {
          await service.destroy();
          console.log(`${serviceName} destroyed`);
        } catch (error) {
          console.error(`Error destroying ${serviceName}:`, error);
        }
      }
    }

    this.services.clear();
    this.initialized = false;
    console.log('ServiceRegistry destroyed');
  }

  /**
   * Restart the registry (destroy and reinitialize)
   */
  async restart() {
    await this.destroy();
    await this.initialize();
  }
}

// Global singleton instance
let registryInstance = null;

/**
 * Get the global service registry instance
 * @returns {ServiceRegistry} - Singleton registry instance
 */
export function getServiceRegistry() {
  if (!registryInstance) {
    registryInstance = new ServiceRegistry();
  }
  return registryInstance;
}

/**
 * Initialize the global service registry
 * @returns {Promise<ServiceRegistry>} - Initialized registry instance
 */
export async function initializeServices() {
  const registry = getServiceRegistry();
  await registry.initialize();
  return registry;
}

/**
 * Get service from global registry
 * @param {string} serviceName - Name of the service
 * @returns {Object} - Service instance
 */
export function getService(serviceName) {
  const registry = getServiceRegistry();
  return registry.getService(serviceName);
}

/**
 * Convenience functions for getting specific services
 */
export function getDataService() {
  return getService('dataService');
}

export function getTimerService() {
  return getService('timerService');
}

export function getTaskService() {
  return getService('taskService');
}

export function getReportService() {
  return getService('reportService');
}

export function getSettingsService() {
  return getService('settingsService');
}

/**
 * Cleanup function for application shutdown
 */
export async function destroyServices() {
  if (registryInstance) {
    await registryInstance.destroy();
    registryInstance = null;
  }
}

/**
 * Export all service classes for direct use if needed
 */
export { DataService, TimerService, TaskService, ReportService, SettingsService };
