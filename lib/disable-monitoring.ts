/**
 * Temporary: Disable heavy monitoring systems to reduce memory usage
 * This disables background timers that are causing memory leaks on Render
 */

// Disable metrics collection in production to save memory
if (process.env.NODE_ENV === 'production') {
  console.log('🚫 Disabling heavy monitoring systems to save memory...');

  // Override problematic modules
  const mockTimer = {
    start: () => console.log('Timer disabled for memory optimization'),
    stop: () => {},
    interval: null
  };

  // Mock expensive imports
  try {
    // Prevent dashboard engine from starting timers
    if (require.cache[require.resolve('./observability/dashboard-engine')]) {
      delete require.cache[require.resolve('./observability/dashboard-engine')];
    }

    // Prevent metrics collector from starting
    if (require.cache[require.resolve('./observability/metrics-collector')]) {
      delete require.cache[require.resolve('./observability/metrics-collector')];
    }

    // Prevent database monitoring
    if (require.cache[require.resolve('./db/monitoring')]) {
      delete require.cache[require.resolve('./db/monitoring')];
    }
  } catch (error) {
    // Safe to ignore - modules might not exist
  }
}

export default {};