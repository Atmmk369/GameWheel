// DOM Elements
const adminLoginBtn = document.getElementById('admin-login');
const adminPanel = document.getElementById('admin-panel');
const suggestionsList = document.getElementById('suggestions-list');
const manageWheelContent = document.getElementById('manage-wheel-content');
const wheelSelector = document.getElementById('wheel-selector');
const addEntryForm = document.getElementById('add-entry-form');
const entryInput = document.getElementById('entry-input');
const entriesList = document.getElementById('entries-list');
const adminTabs = document.querySelectorAll('.admin-tab');
const adminTabContents = document.querySelectorAll('.admin-tab-content');

// Demo admin credentials (in a real app, this would NEVER be in client-side code)
const ADMIN_PASSWORD = 'admin123';

// Initialize admin panel
function initAdmin() {
  setupAdminEventListeners();
}

// Toggle admin panel visibility
function toggleAdminPanel() {
  // In a real implementation, this would use proper authentication
  const password = prompt('Enter admin password:');
  
  if (password === ADMIN_PASSWORD) {
    adminPanel.style.display = adminPanel.style.display === 'none' ? 'block' : 'none';
    
    // If panel is being shown, load data
    if (adminPanel.style.display === 'block') {
      loadPendingSuggestions();
      loadWheelEntries('main'); // Default to main wheel
    }
    
    // Play click sound
    if (typeof playSound === 'function') {
      playSound(document.getElementById('click-sound'));
    }
  } else {
    alert('Invalid password');
  }
}

// Load pending suggestions from server or localStorage
async function loadPendingSuggestions() {
  // Clear existing list
  suggestionsList.innerHTML = '';
  
  try {
    // Try to load from server
    const response = await fetch('/api/suggestions');
    const suggestions = await response.json();
    
    displaySuggestions(suggestions);
  } catch (error) {
    console.warn('Error loading suggestions from server, using localStorage fallback:', error);
    
    // Fall back to localStorage
    const pendingSuggestions = JSON.parse(localStorage.getItem('pendingSuggestions') || '[]');
    displaySuggestions(pendingSuggestions);
  }
}

// Display suggestions in the admin panel
function displaySuggestions(suggestions) {
  if (suggestions.length === 0) {
    suggestionsList.innerHTML = '<li class="no-items">No pending suggestions</li>';
    return;
  }
  
  // Add each suggestion to the list
  suggestions.forEach(suggestion => {
    const listItem = document.createElement('li');
    
    // Format date
    const date = new Date(suggestion.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    // Create suggestion display
    listItem.innerHTML = `
      <div class="suggestion-info">
        <strong>${suggestion.name}</strong> 
        <span class="suggestion-type">(${suggestion.type})</span>
        <div class="suggestion-date">${formattedDate}</div>
      </div>
      <div class="suggestion-actions">
        <button class="approve-btn" data-id="${suggestion.id}">Approve</button>
        <button class="reject-btn" data-id="${suggestion.id}">Reject</button>
      </div>
    `;
    
    suggestionsList.appendChild(listItem);
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.approve-btn').forEach(button => {
    button.addEventListener('click', () => approveSuggestion(button.dataset.id));
  });
  
  document.querySelectorAll('.reject-btn').forEach(button => {
    button.addEventListener('click', () => rejectSuggestion(button.dataset.id));
  });
}

// Load wheel entries for management
async function loadWheelEntries(wheelType) {
  entriesList.innerHTML = '';
  
  try {
    // Try to load from server
    const response = await fetch(`/api/games/${wheelType}`);
    const entries = await response.json();
    
    displayWheelEntries(entries, wheelType);
  } catch (error) {
    console.warn('Error loading wheel entries from server, using localStorage fallback:', error);
    
    // Fall back to localStorage
    const gameLists = JSON.parse(localStorage.getItem('gameLists') || '{}');
    const entries = gameLists[wheelType] || [];
    
    displayWheelEntries(entries, wheelType);
  }
}

// Display wheel entries for management
function displayWheelEntries(entries, wheelType) {
  if (entries.length === 0) {
    entriesList.innerHTML = '<li class="no-items">No entries in this wheel</li>';
    return;
  }
  
  // Sort entries alphabetically
  const sortedEntries = [...entries].sort();
  
  // Add each entry to the list
  sortedEntries.forEach(entry => {
    const listItem = document.createElement('li');
    listItem.className = 'entry-item';
    
    listItem.innerHTML = `
      <span class="entry-name">${entry}</span>
      <button class="remove-entry-btn" data-wheel="${wheelType}" data-entry="${entry}">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    entriesList.appendChild(listItem);
  });
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-entry-btn').forEach(button => {
    button.addEventListener('click', () => removeEntry(button.dataset.wheel, button.dataset.entry));
  });
}

// Add a new entry to a wheel
async function addEntry(wheelType, entryName) {
  if (!entryName || !wheelType) {
    alert('Please enter a valid entry name and select a wheel type');
    return;
  }
  
  try {
    // Try to add to server
    await fetch(`/api/games/${wheelType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: entryName })
    });
    
    // Refresh the entries list
    loadWheelEntries(wheelType);
    
    // Show notification
    if (typeof showSuggestionNotification === 'function') {
      showSuggestionNotification(true, 'Entry added!');
    } else {
      alert('Entry added!');
    }
  } catch (error) {
    console.warn('Error adding entry to server, using localStorage fallback:', error);
    
    addLocalEntry(wheelType, entryName);
  }
}

// Add entry to localStorage
function addLocalEntry(wheelType, entryName) {
  // Get game lists
  const gameLists = JSON.parse(localStorage.getItem('gameLists') || '{}');
  
  // Create array for wheel type if it doesn't exist
  if (!gameLists[wheelType]) {
    gameLists[wheelType] = [];
  }
  
  // Check for duplicates
  if (gameLists[wheelType].includes(entryName)) {
    alert('This entry already exists in the wheel');
    return;
  }
  
  // Add the entry
  gameLists[wheelType].push(entryName);
  
  // Save back to localStorage
  localStorage.setItem('gameLists', JSON.stringify(gameLists));
  
  // Refresh the entries list
  loadWheelEntries(wheelType);
  
  // Show notification
  if (typeof showSuggestionNotification === 'function') {
    showSuggestionNotification(true, 'Entry added!');
  } else {
    alert('Entry added!');
  }
  
  // Refresh the wheel if it's the current type
  if (typeof window.createWheel === 'function' && 
      typeof window.currentWheel !== 'undefined' && 
      window.currentWheel === wheelType) {
    window.createWheel(wheelType);
  }
}

// Remove an entry from a wheel
async function removeEntry(wheelType, entryName) {
  if (confirm(`Are you sure you want to remove "${entryName}" from the ${wheelType} wheel?`)) {
    try {
      // Try to remove from server
      await fetch(`/api/games/${wheelType}/${encodeURIComponent(entryName)}`, {
        method: 'DELETE'
      });
      
      // Refresh the entries list
      loadWheelEntries(wheelType);
      
      // Show notification
      if (typeof showSuggestionNotification === 'function') {
        showSuggestionNotification(true, 'Entry removed!');
      } else {
        alert('Entry removed!');
      }
    } catch (error) {
      console.warn('Error removing entry from server, using localStorage fallback:', error);
      
      removeLocalEntry(wheelType, entryName);
    }
  }
}

// Remove entry from localStorage
function removeLocalEntry(wheelType, entryName) {
  // Get game lists
  const gameLists = JSON.parse(localStorage.getItem('gameLists') || '{}');
  
  // Skip if wheel doesn't exist
  if (!gameLists[wheelType]) {
    return;
  }
  
  // Find the index of the entry
  const entryIndex = gameLists[wheelType].indexOf(entryName);
  if (entryIndex === -1) {
    return;
  }
  
  // Remove the entry
  gameLists[wheelType].splice(entryIndex, 1);
  
  // Save back to localStorage
  localStorage.setItem('gameLists', JSON.stringify(gameLists));
  
  // Refresh the entries list
  loadWheelEntries(wheelType);
  
  // Show notification
  if (typeof showSuggestionNotification === 'function') {
    showSuggestionNotification(true, 'Entry removed!');
  } else {
    alert('Entry removed!');
  }
  
  // Refresh the wheel if it's the current type
  if (typeof window.createWheel === 'function' && 
      typeof window.currentWheel !== 'undefined' && 
      window.currentWheel === wheelType) {
    window.createWheel(window.currentWheel);
  }
}

// Approve a suggestion
async function approveSuggestion(suggestionId) {
  try {
    // Try to approve on server
    await fetch(`/api/suggestions/${suggestionId}/approve`, {
      method: 'POST'
    });
    
    // Refresh suggestions list
    loadPendingSuggestions();
    
    // Also refresh the entries list if we're on the right tab
    const selectedWheel = wheelSelector.value;
    loadWheelEntries(selectedWheel);
    
    // Play sound
    if (typeof playSound === 'function') {
      playSound(document.getElementById('win-sound'));
    }
    
    // Show notification
    if (typeof showSuggestionNotification === 'function') {
      showSuggestionNotification(true, 'Suggestion approved!');
    }
  } catch (error) {
    console.warn('Error approving suggestion on server, using localStorage fallback:', error);
    
    // Fall back to localStorage
    approveLocalSuggestion(suggestionId);
  }
}

// Approve a suggestion from localStorage
function approveLocalSuggestion(suggestionId) {
  // Get pending suggestions
  const pendingSuggestions = JSON.parse(localStorage.getItem('pendingSuggestions') || '[]');
  const suggestionIndex = pendingSuggestions.findIndex(s => s.id === suggestionId);
  
  if (suggestionIndex === -1) {
    alert('Suggestion not found');
    return;
  }
  
  const suggestion = pendingSuggestions[suggestionIndex];
  
  // Get game lists
  const gameLists = JSON.parse(localStorage.getItem('gameLists') || '{}');
  
  // Add to appropriate game list
  if (!gameLists[suggestion.type]) {
    gameLists[suggestion.type] = [];
  }
  
  gameLists[suggestion.type].push(suggestion.name);
  localStorage.setItem('gameLists', JSON.stringify(gameLists));
  
  // Remove from pending list
  pendingSuggestions.splice(suggestionIndex, 1);
  localStorage.setItem('pendingSuggestions', JSON.stringify(pendingSuggestions));
  
  // Refresh suggestions list
  loadPendingSuggestions();
  
  // Also refresh the entries list if we're on the right tab
  const selectedWheel = wheelSelector.value;
  loadWheelEntries(selectedWheel);
  
  // Play sound
  if (typeof playSound === 'function') {
    playSound(document.getElementById('win-sound'));
  }
  
  // Show notification
  if (typeof showSuggestionNotification === 'function') {
    showSuggestionNotification(true, 'Suggestion approved!');
  }
  
  // Refresh the wheel if it's the current type
  if (typeof window.createWheel === 'function' && 
      typeof window.currentWheel !== 'undefined' && 
      window.currentWheel === suggestion.type) {
    window.createWheel(window.currentWheel);
  }
}

// Reject a suggestion
async function rejectSuggestion(suggestionId) {
  try {
    // Try to reject on server
    await fetch(`/api/suggestions/${suggestionId}/reject`, {
      method: 'POST'
    });
    
    // Refresh suggestions list
    loadPendingSuggestions();
    
    // Play sound
    if (typeof playSound === 'function') {
      playSound(document.getElementById('click-sound'));
    }
    
    // Show notification
    if (typeof showSuggestionNotification === 'function') {
      showSuggestionNotification(true, 'Suggestion rejected');
    }
  } catch (error) {
    console.warn('Error rejecting suggestion on server, using localStorage fallback:', error);
    
    // Fall back to localStorage
    rejectLocalSuggestion(suggestionId);
  }
}

// Reject a suggestion from localStorage
function rejectLocalSuggestion(suggestionId) {
  // Get pending suggestions
  const pendingSuggestions = JSON.parse(localStorage.getItem('pendingSuggestions') || '[]');
  const suggestionIndex = pendingSuggestions.findIndex(s => s.id === suggestionId);
  
  if (suggestionIndex === -1) {
    alert('Suggestion not found');
    return;
  }
  
  // Remove from pending list
  pendingSuggestions.splice(suggestionIndex, 1);
  localStorage.setItem('pendingSuggestions', JSON.stringify(pendingSuggestions));
  
  // Refresh suggestions list
  loadPendingSuggestions();
  
  // Play sound
  if (typeof playSound === 'function') {
    playSound(document.getElementById('click-sound'));
  }
  
  // Show notification
  if (typeof showSuggestionNotification === 'function') {
    showSuggestionNotification(true, 'Suggestion rejected');
  }
}

// Switch between admin tabs
function switchAdminTab(tabId) {
  // Update active tab
  adminTabs.forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.target === tabId) {
      tab.classList.add('active');
    }
  });
  
  // Show the selected tab content
  adminTabContents.forEach(content => {
    content.style.display = 'none';
    if (content.id === tabId) {
      content.style.display = 'block';
    }
  });
  
  // If switching to manage tab, refresh entries
  if (tabId === 'manage-wheel-tab') {
    loadWheelEntries(wheelSelector.value);
  }
  
  // Play click sound
  if (typeof playSound === 'function') {
    playSound(document.getElementById('click-sound'));
  }
}

// Set up admin-related event listeners
function setupAdminEventListeners() {
  // Admin login button
  adminLoginBtn.addEventListener('click', toggleAdminPanel);
  
  // Tab switching
  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => switchAdminTab(tab.dataset.target));
  });
  
  // Wheel selector change
  if (wheelSelector) {
    wheelSelector.addEventListener('change', () => {
      loadWheelEntries(wheelSelector.value);
    });
  }
  
  // Add entry form submission
  if (addEntryForm) {
    addEntryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      addEntry(wheelSelector.value, entryInput.value.trim());
      entryInput.value = ''; // Clear input
    });
  }
}

// Initialize admin panel on page load
document.addEventListener('DOMContentLoaded', initAdmin);