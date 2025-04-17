// DOM Elements
const adminLoginBtn = document.getElementById('admin-login');
const adminPanel = document.getElementById('admin-panel');
const suggestionsList = document.getElementById('suggestions-list');

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
    
    // If panel is being shown, load suggestions
    if (adminPanel.style.display === 'block') {
      loadPendingSuggestions();
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
    suggestionsList.innerHTML = '<li>No pending suggestions</li>';
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

// Approve a suggestion
async function approveSuggestion(suggestionId) {
  try {
    // Try to approve on server
    await fetch(`/api/suggestions/${suggestionId}/approve`, {
      method: 'POST'
    });
    
    // Refresh suggestions list
    loadPendingSuggestions();
    
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
  
  // Play sound
  if (typeof playSound === 'function') {
    playSound(document.getElementById('win-sound'));
  }
  
  // Show notification
  if (typeof showSuggestionNotification === 'function') {
    showSuggestionNotification(true, 'Suggestion approved!');
  }
  
  // Refresh the wheel if it's the current type
  if (typeof createWheel === 'function' && typeof currentWheel !== 'undefined' && currentWheel === suggestion.type) {
    createWheel(currentWheel);
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

// Set up admin-related event listeners
function setupAdminEventListeners() {
  // Admin login button
  adminLoginBtn.addEventListener('click', toggleAdminPanel);
}

// Initialize admin panel on page load
document.addEventListener('DOMContentLoaded', initAdmin);