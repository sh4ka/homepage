/**
 * ~/page Storage Abstraction Layer
 * Wraps browser.storage.local with schema versioning and migration support
 */

const SCHEMA_VERSION = 1;

const DEFAULT_DATA = {
  schemaVersion: 1,
  handle: 'operator',
  links: [],
  linksGrid: { cols: 3, rows: 2 },
  feeds: [],
  feedRefreshMinutes: 30,
  feedCache: {},
  stats: { installDate: null, tabsOpened: 0 },
  searchEngine: 'duckduckgo',
  greeting: { handle: 'operator', quotes: true, timeAware: true },
  onboardingComplete: false,
};

/**
 * Initialize storage: check schema version and migrate if needed
 */
async function init() {
  try {
    const result = await browser.storage.local.get('schemaVersion');
    const storedVersion = result.schemaVersion;

    if (storedVersion === undefined) {
      // First run: write DEFAULT_DATA
      await browser.storage.local.set(DEFAULT_DATA);
      console.log('[~/page Storage] Initialized with default data');
    } else if (storedVersion < SCHEMA_VERSION) {
      // Schema version mismatch: run migration
      await migrate(storedVersion, SCHEMA_VERSION);
    }
  } catch (error) {
    console.error('[~/page Storage]', error.message);
    throw error;
  }
}

/**
 * Get a single value from storage
 * @param {string} key - The key to retrieve
 * @param {*} defaultValue - Value to return if key not found
 * @returns {Promise<*>} The stored value or defaultValue
 */
async function get(key, defaultValue = undefined) {
  try {
    const result = await browser.storage.local.get(key);
    return result[key] !== undefined ? result[key] : defaultValue;
  } catch (error) {
    console.error('[~/page Storage]', error.message);
    throw error;
  }
}

/**
 * Get all stored data
 * @returns {Promise<Object>} All stored key-value pairs
 */
async function getAll() {
  try {
    const result = await browser.storage.local.get(null);
    return result;
  } catch (error) {
    console.error('[~/page Storage]', error.message);
    throw error;
  }
}

/**
 * Set a single key-value pair
 * @param {string} key - The key to set
 * @param {*} value - The value to store
 * @returns {Promise<void>}
 */
async function set(key, value) {
  try {
    await browser.storage.local.set({ [key]: value });
  } catch (error) {
    console.error('[~/page Storage]', error.message);
    throw error;
  }
}

/**
 * Set multiple key-value pairs
 * @param {Object} obj - Object with key-value pairs to store
 * @returns {Promise<void>}
 */
async function setMany(obj) {
  try {
    await browser.storage.local.set(obj);
  } catch (error) {
    console.error('[~/page Storage]', error.message);
    throw error;
  }
}

/**
 * Remove a single key from storage
 * @param {string} key - The key to remove
 * @returns {Promise<void>}
 */
async function remove(key) {
  try {
    await browser.storage.local.remove(key);
  } catch (error) {
    console.error('[~/page Storage]', error.message);
    throw error;
  }
}

/**
 * Clear all storage data
 * @param {boolean} confirm - Must be true to actually clear
 * @returns {Promise<void>}
 */
async function clear(confirm = false) {
  try {
    if (!confirm) {
      console.warn('[~/page Storage] Clear requires confirm=true');
      return;
    }
    await browser.storage.local.clear();
    // Re-write DEFAULT_DATA after clearing
    await browser.storage.local.set(DEFAULT_DATA);
    console.log('[~/page Storage] Cleared and re-initialized with default data');
  } catch (error) {
    console.error('[~/page Storage]', error.message);
    throw error;
  }
}

/**
 * Get the current schema version
 * @returns {Promise<number>} The schema version
 */
async function getSchemaVersion() {
  try {
    const result = await browser.storage.local.get('schemaVersion');
    return result.schemaVersion !== undefined ? result.schemaVersion : SCHEMA_VERSION;
  } catch (error) {
    console.error('[~/page Storage]', error.message);
    throw error;
  }
}

/**
 * Migrate storage schema from one version to another
 * @param {number} fromVersion - Current schema version
 * @param {number} toVersion - Target schema version
 * @returns {Promise<void>}
 */
async function migrate(fromVersion, toVersion) {
  try {
    console.log(`[~/page Storage] Migrating from v${fromVersion} to v${toVersion}`);
    // Stub: Add migration logic here as schema evolves
    // For now, just update the schema version
    await browser.storage.local.set({ schemaVersion: toVersion });
    console.log(`[~/page Storage] Migration complete`);
  } catch (error) {
    console.error('[~/page Storage]', error.message);
    throw error;
  }
}

export const Storage = {
  init,
  get,
  getAll,
  set,
  setMany,
  remove,
  clear,
  getSchemaVersion,
  migrate,
};

export { SCHEMA_VERSION, DEFAULT_DATA };
