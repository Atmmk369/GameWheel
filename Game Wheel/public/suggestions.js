// DOM Elements
const suggestionForm = document.getElementById('suggestion-form');
const suggestionTypeInput = document.getElementById('suggestion-type');
const suggestionNameInput = document.getElementById('suggestion-name');

// API Endpoint
const API_URL = '/api/suggestions';

// Initialize suggestions system
function initSuggestions() {
  setupSuggestionEventListeners();
}

// Submit a new game suggestion to the server
async function submitSuggestion(type, name) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: type,
        name: name
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit suggestion');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    throw error;
  }
}

// Fallback to localStorage if server is not available
function saveLocalSuggestion(type, name) {
  // Create a unique ID for the suggestion
  const suggestionId = 'suggestion-' + Date.now();
  
  // Format the suggestion object
  const suggestion = {
    id: suggestionId,
    type: type,
    name: name,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  
  // Get existing suggestions from localStorage
  const existingSuggestions = JSON.parse(localStorage.getItem('pendingSuggestions') || '[]');
  
  // Add the new suggestion
  existingSuggestions.push(suggestion);
  
  // Save back to localStorage
  localStorage.setItem('pendingSuggestions', JSON.stringify(existingSuggestions));
  
  return suggestion;
}

// Show a notification after suggestion is submitted
function showSuggestionNotification(success = true, message = '') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${success ? 'success' : 'error'}`;
  notification.textContent = message || (success ? 'Suggestion submitted!' : 'Error submitting suggestion');
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after a delay
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Handle suggestion form submission
async function handleSuggestionSubmit(event) {
  event.preventDefault();
  
  // Get form values
  const type = suggestionTypeInput.value;
  const name = suggestionNameInput.value.trim();
  
  // Validate input
  if (!name) {
    showSuggestionNotification(false, 'Please enter a name');
    return;
  }
  
  try {
    // Try to submit to server
    let suggestion;
    try {
      suggestion = await submitSuggestion(type, name);
    } catch (error) {
      // If server request fails, fall back to localStorage
      console.warn('Server submission failed, using localStorage fallback:', error);
      suggestion = saveLocalSuggestion(type, name);
    }
    
    // Show success notification
    showSuggestionNotification(true, `Your suggestion "${name}" has been submitted for review!`);
    
    // Reset form
    suggestionForm.reset();
    
    // Play click sound
    if (typeof playSound === 'function') {
      playSound(document.getElementById('click-sound'));
    }
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    showSuggestionNotification(false, 'There was an error submitting your suggestion');
  }
}

// Set up suggestion-related event listeners
function setupSuggestionEventListeners() {
  // Suggestion form submission
  suggestionForm.addEventListener('submit', handleSuggestionSubmit);
}

// Initialize suggestions on page load
document.addEventListener('DOMContentLoaded', initSuggestions);