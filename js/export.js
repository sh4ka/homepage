/**
 * ~/page Export/Import Module
 * Handles JSON backup export and import for data portability
 */

import { Storage, SCHEMA_VERSION } from './storage.js';

/**
 * Export all data (except feedCache) as JSON file download
 * @returns {Promise<{success: boolean, filename: string}>}
 */
export async function exportData() {
  const allData = await Storage.getAll();

  // Remove transient data
  const exportableData = { ...allData };
  delete exportableData.feedCache;

  const exportObj = {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: exportableData,
  };

  const json = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().split('T')[0];
  const filename = `hackpage-backup-${today}.json`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
  return { success: true, filename };
}

/**
 * Import data from a JSON backup file
 * @param {File} file - The JSON file to import
 * @returns {Promise<{success: boolean, error?: string, warning?: string}>}
 */
export async function importData(file) {
  if (!file) return { success: false, error: 'No file provided' };

  let text;
  try {
    text = await file.text();
  } catch (err) {
    return { success: false, error: 'COULD NOT READ FILE' };
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { success: false, error: 'INVALID JSON FILE' };
  }

  // Validate structure
  if (!parsed.version || !parsed.data) {
    return { success: false, error: 'INVALID BACKUP FILE FORMAT' };
  }

  let warning = null;
  if (parsed.version > SCHEMA_VERSION) {
    warning = 'FILE FROM NEWER VERSION — IMPORT MAY LOSE DATA';
  }

  // Write to storage
  try {
    await Storage.setMany(parsed.data);
    return { success: true, warning };
  } catch (err) {
    return { success: false, error: `IMPORT FAILED: ${err.message}` };
  }
}

/**
 * Get a preview of what will be exported
 * @returns {Promise<{links: number, feeds: number, handle: string, size: string}>}
 */
export async function getExportPreview() {
  const allData = await Storage.getAll();
  const links = allData.links || [];
  const feeds = allData.feeds || [];
  const handle = allData.handle || 'operator';

  const exportableData = { ...allData };
  delete exportableData.feedCache;
  const json = JSON.stringify(exportableData);
  const bytes = new TextEncoder().encode(json).length;
  const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

  return { links: links.length, feeds: feeds.length, handle, size };
}

/**
 * Initialize export keyboard shortcut listener
 * Listens for 'hackpage:export' custom event dispatched by ShortcutManager
 */
export function initExportShortcut() {
  document.addEventListener('hackpage:export', async () => {
    await exportData();
  });
}
