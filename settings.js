import { Storage } from './js/storage.js';

let debounceTimers = {};

function normalizeUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return 'https://' + url;
}

function debounce(key, fn, delay = 500) {
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }
  debounceTimers[key] = setTimeout(fn, delay);
}

function showSaveFlash(parentElement) {
  const flash = document.createElement('span');
  flash.className = 'settings-save-flash';
  flash.textContent = 'SAVED ✓';
  parentElement.appendChild(flash);
  
  setTimeout(() => {
    if (flash.parentElement) {
      flash.parentElement.removeChild(flash);
    }
  }, 1500);
}

function showError(parentElement, message) {
  const existingError = parentElement.querySelector('.settings-error');
  if (existingError) {
    existingError.remove();
  }
  
  const error = document.createElement('div');
  error.className = 'settings-error';
  error.textContent = message;
  parentElement.appendChild(error);
  
  setTimeout(() => {
    if (error.parentElement) {
      error.remove();
    }
  }, 3000);
}

function createSection(title, description = '') {
  const section = document.createElement('section');
  section.className = 'settings-section';
  
  const titleEl = document.createElement('h2');
  titleEl.className = 'settings-section-title';
  titleEl.textContent = title;
  section.appendChild(titleEl);
  
  if (description) {
    const desc = document.createElement('p');
    desc.className = 'settings-section-desc';
    desc.textContent = description;
    section.appendChild(desc);
  }
  
  return section;
}

async function renderIdentitySection(container) {
  const section = createSection('IDENTITY', 'Your operator handle displayed across ~/page');
  
  const handle = await Storage.get('handle', 'operator');
  
  const inputWrapper = document.createElement('div');
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'settings-input';
  input.placeholder = 'operator';
  input.value = handle;
  input.maxLength = 50;
  
  input.addEventListener('input', (e) => {
    const value = e.target.value.trim() || 'operator';
    debounce('handle', async () => {
      await Storage.set('handle', value);
      showSaveFlash(inputWrapper);
    });
  });
  
  inputWrapper.appendChild(input);
  section.appendChild(inputWrapper);
  
  container.appendChild(section);
}

async function renderSearchSection(container) {
  const section = document.createElement('div');
  section.className = 'settings-section';

  const title = document.createElement('h2');
  title.className = 'settings-section-title';
  title.textContent = 'SEARCH';
  section.appendChild(title);

  const engines = {
    duckduckgo: 'DuckDuckGo',
    google:     'Google',
    brave:      'Brave',
    bing:       'Bing',
    kagi:       'Kagi',
  };

  const current = await Storage.get('searchEngine', 'duckduckgo');

  const row = document.createElement('div');
  row.className = 'settings-field-row';

  const label = document.createElement('label');
  label.className = 'settings-label text-dim';
  label.textContent = 'Search engine';

  const select = document.createElement('select');
  select.className = 'settings-select';

  Object.entries(engines).forEach(([value, name]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = name;
    if (value === current) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', async () => {
    await Storage.set('searchEngine', select.value);
    showSaveFlash(row);
  });

  row.appendChild(label);
  row.appendChild(select);
  section.appendChild(row);
  container.appendChild(section);
}

async function renderQuickLinksSection(container) {
  const section = createSection('QUICK LINKS', 'Your favorite sites (max 12)');
  
  const links = await Storage.get('links', []);
  
  const listContainer = document.createElement('div');
  
  function renderLinksList() {
    listContainer.innerHTML = '';
    
    if (links.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'settings-note';
      empty.textContent = 'No links added yet. Add your first link below.';
      listContainer.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'settings-list';
      
      links.forEach((link, index) => {
        const item = document.createElement('li');
        item.className = 'settings-list-item';
        
        const content = document.createElement('div');
        content.className = 'settings-list-item-content';
        
        const label = document.createElement('div');
        label.className = 'settings-list-item-label';
        label.textContent = link.label;
        
        const url = document.createElement('div');
        url.className = 'settings-list-item-url';
        url.textContent = link.url;
        
        content.appendChild(label);
        content.appendChild(url);
        
        const actions = document.createElement('div');
        actions.className = 'settings-list-item-actions';
        
        if (index > 0) {
          const upBtn = document.createElement('button');
          upBtn.className = 'settings-btn settings-btn-small';
          upBtn.textContent = '↑';
          upBtn.title = 'Move up';
          upBtn.addEventListener('click', async () => {
            [links[index - 1], links[index]] = [links[index], links[index - 1]];
            await Storage.set('links', links);
            renderLinksList();
            showSaveFlash(listContainer);
          });
          actions.appendChild(upBtn);
        }
        
        if (index < links.length - 1) {
          const downBtn = document.createElement('button');
          downBtn.className = 'settings-btn settings-btn-small';
          downBtn.textContent = '↓';
          downBtn.title = 'Move down';
          downBtn.addEventListener('click', async () => {
            [links[index], links[index + 1]] = [links[index + 1], links[index]];
            await Storage.set('links', links);
            renderLinksList();
            showSaveFlash(listContainer);
          });
          actions.appendChild(downBtn);
        }
        
        const editBtn = document.createElement('button');
        editBtn.className = 'settings-btn settings-btn-small';
        editBtn.textContent = 'EDIT';
        editBtn.addEventListener('click', () => {
          showEditForm(index, link);
        });
        actions.appendChild(editBtn);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'settings-btn settings-btn-small settings-btn-danger';
        removeBtn.textContent = 'REMOVE';
        removeBtn.addEventListener('click', async () => {
          links.splice(index, 1);
          await Storage.set('links', links);
          renderLinksList();
          showSaveFlash(listContainer);
        });
        actions.appendChild(removeBtn);
        
        item.appendChild(content);
        item.appendChild(actions);
        list.appendChild(item);
      });
      
      listContainer.appendChild(list);
    }
  }
  
  function showEditForm(index, link) {
    const formRow = document.createElement('div');
    formRow.className = 'settings-form-row';
    
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'settings-input';
    labelInput.placeholder = 'Label';
    labelInput.value = link.label;
    
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.className = 'settings-input';
    urlInput.placeholder = 'https://example.com';
    urlInput.value = link.url;
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'settings-btn settings-btn-success';
    saveBtn.textContent = 'SAVE';
    saveBtn.addEventListener('click', async () => {
      const label = labelInput.value.trim();
      const url = normalizeUrl(urlInput.value.trim());
      
      if (!label) {
        showError(formRow, 'Label is required');
        return;
      }
      
      try {
        new URL(url);
      } catch {
        showError(formRow, 'Invalid URL format');
        return;
      }
      
      links[index] = { label, url };
      await Storage.set('links', links);
      formRow.remove();
      renderLinksList();
      showSaveFlash(listContainer);
    });
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'settings-btn';
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.addEventListener('click', () => {
      formRow.remove();
      renderLinksList();
    });
    
    formRow.appendChild(labelInput);
    formRow.appendChild(urlInput);
    formRow.appendChild(saveBtn);
    formRow.appendChild(cancelBtn);
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveBtn.click(); });
    labelInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') urlInput.focus(); });
    
    listContainer.innerHTML = '';
    listContainer.appendChild(formRow);
  }
  
  renderLinksList();
  section.appendChild(listContainer);
  
  if (links.length < 12) {
    const addForm = document.createElement('div');
    addForm.style.marginTop = '1rem';
    
    const formRow = document.createElement('div');
    formRow.className = 'settings-form-row';
    
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'settings-input';
    labelInput.placeholder = 'Label';
    
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.className = 'settings-input';
    urlInput.placeholder = 'https://example.com';
    
    const addBtn = document.createElement('button');
    addBtn.className = 'settings-btn settings-btn-success';
    addBtn.textContent = '+ ADD';
    addBtn.addEventListener('click', async () => {
      const label = labelInput.value.trim();
      const url = normalizeUrl(urlInput.value.trim());
      
      if (!label) {
        showError(addForm, 'Label is required');
        return;
      }
      
      try {
        new URL(url);
      } catch {
        showError(addForm, 'Invalid URL format');
        return;
      }
      
      if (links.length >= 12) {
        showError(addForm, 'Maximum 12 links allowed');
        return;
      }
      
      links.push({ label, url });
      await Storage.set('links', links);
      labelInput.value = '';
      urlInput.value = '';
      renderLinksList();
      showSaveFlash(addForm);
      
      if (links.length >= 12) {
        addForm.remove();
      }
    });
    
    formRow.appendChild(labelInput);
    formRow.appendChild(urlInput);
    formRow.appendChild(addBtn);
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });
    labelInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') urlInput.focus(); });
    addForm.appendChild(formRow);
    section.appendChild(addForm);
  } else {
    const maxNote = document.createElement('p');
    maxNote.className = 'settings-note';
    maxNote.textContent = 'Maximum link limit reached (12/12)';
    section.appendChild(maxNote);
  }
  
  container.appendChild(section);
}

async function renderLinkGridSection(container) {
  const section = createSection('LINK GRID', 'Configure grid layout for quick links');
  
  const grid = await Storage.get('linksGrid', { cols: 3, rows: 2 });
  
  const gridContainer = document.createElement('div');
  gridContainer.className = 'settings-grid-selector';
  
  const colOption = document.createElement('div');
  colOption.className = 'settings-grid-option';
  
  const colLabel = document.createElement('label');
  colLabel.textContent = 'Columns';
  
  const colSelect = document.createElement('select');
  colSelect.className = 'settings-select';
  [2, 3, 4].forEach(val => {
    const option = document.createElement('option');
    option.value = val;
    option.textContent = val;
    option.selected = grid.cols === val;
    colSelect.appendChild(option);
  });
  
  colSelect.addEventListener('change', async (e) => {
    grid.cols = parseInt(e.target.value, 10);
    await Storage.set('linksGrid', grid);
    showSaveFlash(gridContainer);
  });
  
  colOption.appendChild(colLabel);
  colOption.appendChild(colSelect);
  
  const rowOption = document.createElement('div');
  rowOption.className = 'settings-grid-option';
  
  const rowLabel = document.createElement('label');
  rowLabel.textContent = 'Rows';
  
  const rowSelect = document.createElement('select');
  rowSelect.className = 'settings-select';
  [2, 3, 4].forEach(val => {
    const option = document.createElement('option');
    option.value = val;
    option.textContent = val;
    option.selected = grid.rows === val;
    rowSelect.appendChild(option);
  });
  
  rowSelect.addEventListener('change', async (e) => {
    grid.rows = parseInt(e.target.value, 10);
    await Storage.set('linksGrid', grid);
    showSaveFlash(gridContainer);
  });
  
  rowOption.appendChild(rowLabel);
  rowOption.appendChild(rowSelect);
  
  gridContainer.appendChild(colOption);
  gridContainer.appendChild(rowOption);
  section.appendChild(gridContainer);
  
  container.appendChild(section);
}

async function renderRSSFeedsSection(container) {
  const section = createSection('RSS FEEDS', 'Manage news feeds (max 10)');
  
  const feeds = await Storage.get('feeds', []);
  
  const listContainer = document.createElement('div');
  
  function renderFeedsList() {
    listContainer.innerHTML = '';
    
    if (feeds.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'settings-note';
      empty.textContent = 'No feeds added yet. Add your first feed below.';
      listContainer.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'settings-list';
      
      feeds.forEach((feed, index) => {
        const item = document.createElement('li');
        item.className = 'settings-list-item';
        
        const content = document.createElement('div');
        content.className = 'settings-list-item-content';
        
        const title = document.createElement('div');
        title.className = 'settings-list-item-label';
        title.textContent = feed.title;
        
        const url = document.createElement('div');
        url.className = 'settings-list-item-url';
        url.textContent = feed.url;
        
        content.appendChild(title);
        content.appendChild(url);
        
        const actions = document.createElement('div');
        actions.className = 'settings-list-item-actions';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'settings-btn settings-btn-small settings-btn-danger';
        removeBtn.textContent = 'REMOVE';
        removeBtn.addEventListener('click', async () => {
          feeds.splice(index, 1);
          await Storage.set('feeds', feeds);
          renderFeedsList();
          showSaveFlash(listContainer);
        });
        actions.appendChild(removeBtn);
        
        item.appendChild(content);
        item.appendChild(actions);
        list.appendChild(item);
      });
      
      listContainer.appendChild(list);
    }
  }
  
  renderFeedsList();
  section.appendChild(listContainer);
  
  if (feeds.length < 10) {
    const addForm = document.createElement('div');
    addForm.style.marginTop = '1rem';
    
    const note = document.createElement('p');
    note.className = 'settings-note';
    note.textContent = 'Permission required to fetch feed domain';
    addForm.appendChild(note);
    
    const formRow = document.createElement('div');
    formRow.className = 'settings-form-row';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'settings-input';
    titleInput.placeholder = 'Feed title';
    
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.className = 'settings-input';
    urlInput.placeholder = 'https://example.com/feed.xml';
    
    const addBtn = document.createElement('button');
    addBtn.className = 'settings-btn settings-btn-success';
    addBtn.textContent = '+ ADD FEED';
    addBtn.addEventListener('click', async () => {
      const title = titleInput.value.trim();
      const url = urlInput.value.trim();
      
      if (!title) {
        showError(addForm, 'Feed title is required');
        return;
      }
      
      try {
        new URL(url);
      } catch {
        showError(addForm, 'Invalid URL format');
        return;
      }
      
      if (feeds.length >= 10) {
        showError(addForm, 'Maximum 10 feeds allowed');
        return;
      }
      
      try {
        const response = await browser.runtime.sendMessage({
          action: 'requestFeedPermission',
          url: url
        });
        
        if (response && response.granted) {
          feeds.push({ title, url });
          await Storage.set('feeds', feeds);
          titleInput.value = '';
          urlInput.value = '';
          renderFeedsList();
          showSaveFlash(addForm);
          
          if (feeds.length >= 10) {
            addForm.remove();
          }
        } else {
          showError(addForm, 'Permission denied for this feed domain');
        }
      } catch (error) {
        showError(addForm, 'Failed to request permission: ' + error.message);
      }
    });
    
    formRow.appendChild(titleInput);
    formRow.appendChild(urlInput);
    formRow.appendChild(addBtn);
    addForm.appendChild(formRow);
    section.appendChild(addForm);
  } else {
    const maxNote = document.createElement('p');
    maxNote.className = 'settings-note';
    maxNote.textContent = 'Maximum feed limit reached (10/10)';
    section.appendChild(maxNote);
  }
  
  container.appendChild(section);
}

async function renderDataSection(container) {
  const section = createSection('DATA', 'Export, import, or clear all your data');
  
  const actions = document.createElement('div');
  actions.className = 'settings-data-actions';
  
  const exportBtn = document.createElement('button');
  exportBtn.className = 'settings-btn settings-btn-success';
  exportBtn.textContent = 'EXPORT';
  exportBtn.addEventListener('click', async () => {
    try {
      const allData = await Storage.getAll();
      const { feedCache, ...dataToExport } = allData;
      
      const exportObject = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: dataToExport
      };
      
      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tildepage-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showSaveFlash(actions);
    } catch (error) {
      showError(section, 'Export failed: ' + error.message);
    }
  });
  
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json';
  importInput.className = 'settings-file-input';
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      if (!parsed.data) {
        showError(section, 'Invalid backup file format');
        return;
      }
      
      const confirmed = confirm('IMPORT WILL OVERWRITE ALL CURRENT DATA. Continue?');
      if (!confirmed) {
        importInput.value = '';
        return;
      }
      
      await Storage.setMany(parsed.data);
      showSaveFlash(actions);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      showError(section, 'Import failed: ' + error.message);
    }
    
    importInput.value = '';
  });
  
  const importBtn = document.createElement('button');
  importBtn.className = 'settings-btn';
  importBtn.textContent = 'IMPORT';
  importBtn.addEventListener('click', () => {
    importInput.click();
  });
  
  const clearBtn = document.createElement('button');
  clearBtn.className = 'settings-btn settings-btn-danger';
  clearBtn.textContent = 'CLEAR ALL';
  clearBtn.addEventListener('click', () => {
    showClearConfirm();
  });
  
  actions.appendChild(exportBtn);
  actions.appendChild(importBtn);
  actions.appendChild(importInput);
  actions.appendChild(clearBtn);
  section.appendChild(actions);
  
  function showClearConfirm() {
    const confirmBox = document.createElement('div');
    confirmBox.className = 'settings-clear-confirm';
    
    const instruction = document.createElement('p');
    instruction.style.flex = '0 0 auto';
    instruction.style.fontWeight = '700';
    instruction.style.color = 'var(--color-magenta)';
    instruction.textContent = "TYPE 'CONFIRM' TO PROCEED:";
    
    const confirmInput = document.createElement('input');
    confirmInput.type = 'text';
    confirmInput.className = 'settings-input';
    confirmInput.placeholder = 'CONFIRM';
    
    const proceedBtn = document.createElement('button');
    proceedBtn.className = 'settings-btn settings-btn-danger';
    proceedBtn.textContent = 'DELETE ALL';
    proceedBtn.addEventListener('click', async () => {
      if (confirmInput.value === 'CONFIRM') {
        await Storage.clear(true);
        confirmBox.remove();
        showSaveFlash(section);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showError(confirmBox, 'Must type CONFIRM exactly');
      }
    });
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'settings-btn';
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.addEventListener('click', () => {
      confirmBox.remove();
    });
    
    confirmBox.appendChild(instruction);
    confirmBox.appendChild(confirmInput);
    confirmBox.appendChild(proceedBtn);
    confirmBox.appendChild(cancelBtn);
    section.appendChild(confirmBox);
  }
  
  container.appendChild(section);
}

async function renderKeyboardShortcutsSection(container) {
  const section = createSection('KEYBOARD SHORTCUTS', 'Quick actions for power users');
  
  let shortcuts = [];
  
  try {
    const { ShortcutManager } = await import('./js/shortcuts.js');
    shortcuts = ShortcutManager.getAll();
  } catch (error) {
    shortcuts = [
      { key: '/', description: 'Focus search bar' },
      { key: 'Escape', description: 'Blur input / close overlays' },
      { key: ',', description: 'Open settings' },
      { key: '?', description: 'Toggle shortcuts help' },
      { key: 'e', description: 'Export data' },
      { key: 'r', description: 'Refresh RSS feeds' },
      { key: '1-9', description: 'Open quick link 1-9' },
      { key: '0', description: 'Open quick link 10' }
    ];
  }
  
  if (shortcuts.length === 0) {
    const note = document.createElement('p');
    note.className = 'settings-note';
    note.textContent = 'No keyboard shortcuts registered.';
    section.appendChild(note);
  } else {
    const table = document.createElement('table');
    table.className = 'settings-shortcuts-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const keyHeader = document.createElement('th');
    keyHeader.textContent = 'Key';
    
    const descHeader = document.createElement('th');
    descHeader.textContent = 'Action';
    
    headerRow.appendChild(keyHeader);
    headerRow.appendChild(descHeader);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    shortcuts.forEach(shortcut => {
      const row = document.createElement('tr');
      
      const keyCell = document.createElement('td');
      keyCell.className = 'key-cell';
      keyCell.textContent = shortcut.key;
      
      const descCell = document.createElement('td');
      descCell.textContent = shortcut.description;
      
      row.appendChild(keyCell);
      row.appendChild(descCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    section.appendChild(table);
  }
  
  container.appendChild(section);
}

async function init() {
  const content = document.getElementById('settings-content');
  if (!content) return;
  
  await renderIdentitySection(content);
  await renderSearchSection(content);
  await renderQuickLinksSection(content);
  await renderLinkGridSection(content);
  await renderRSSFeedsSection(content);
  await renderDataSection(content);
  await renderKeyboardShortcutsSection(content);
}

function goBack() {
  history.back();
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const active = document.activeElement;
    if (active && active.tagName !== 'BODY') {
      active.blur();
      return;
    }
    goBack();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('settings-back-btn');
  if (backBtn) backBtn.addEventListener('click', (e) => { e.preventDefault(); goBack(); });
});

document.addEventListener('DOMContentLoaded', init);
