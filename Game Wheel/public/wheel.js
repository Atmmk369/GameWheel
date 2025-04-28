// Game lists for different wheels
let gameLists = {
  main: [],
  movies: [],
  tv: [],
  tabletop: []
};

// Bright colors for the wheel segments (Red, Green, Blue theme)
const colors = [
  "#e63946", // Red
  "#2a9d8f", // Green
  "#4361ee", // Blue
  "#e76f51", // Red-Orange
  "#2ec4b6", // Teal-Green
  "#3a86ff", // Light Blue
  "#f94144", // Bright Red
  "#43aa8b", // Dark Green
  "#277da1", // Dark Blue
  "#f8961e"  // Orange
];

// DOM elements
const wheel = document.getElementById('wheel');
const wheelLights = document.getElementById('wheel-lights');
const spinBtn = document.getElementById('spin-btn');
const resultElement = document.getElementById('result');
const confettiContainer = document.getElementById('confetti-container');
const wheelNavButtons = document.querySelectorAll('.wheel-nav-btn');
const showListBtn = document.getElementById('show-list-btn');
const listDropdown = document.getElementById('list-dropdown');
const closeListBtn = document.getElementById('close-list-btn');
const listContent = document.getElementById('list-content');
const listTitle = document.getElementById('list-title');

// Variables
let spinning = false;
let currentWheel = 'main';
let queuedGame = null;

// List of special items that trigger sub-wheels
const SUB_WHEEL_TRIGGERS = {
  'main': ['Movie Time', 'TV Time', 'Tabletop Time'],
  'movies': [],
  'tv': [],
  'tabletop': []
};

// Map the trigger names to their respective wheels
const TRIGGER_TO_WHEEL_MAP = {
  'Movie Time': 'movies',
  'TV Time': 'tv',
  'Tabletop Time': 'tabletop'
};

// Initialize the application
async function init() {
  try {
    // Fetch game lists from the server
    const response = await fetch('/api/games');
    const data = await response.json();
    gameLists = data;
    
    // Create the wheel with the loaded data
    createWheel(currentWheel);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load any queued game
    loadQueuedGame();
    
  } catch (error) {
    console.error('Error initializing wheel:', error);
    // Fallback to default wheel if unable to load from server
    createWheel(currentWheel);
    setupEventListeners();
    loadQueuedGame();
  }
}

// Create wheel segments based on the current wheel type
function createWheel(wheelType) {
  wheel.innerHTML = '';
  const games = gameLists[wheelType] || [];
  
  if (games.length === 0) {
    // Display a message if the wheel has no games
    wheel.innerHTML = '<div class="no-games">No games available</div>';
    return;
  }
  
  // Create the slot machine container
  const slotContainer = document.createElement('div');
  slotContainer.className = 'slot-container';
  
  // Create the items strip
  const itemsStrip = document.createElement('div');
  itemsStrip.className = 'items-strip';
  
  // Add each game to the strip
  games.forEach(game => {
    const item = document.createElement('div');
    item.className = 'slot-item';
    item.textContent = game;
    
    // Assign a random background color from our color array
    const randomColorIndex = Math.floor(Math.random() * colors.length);
    item.style.backgroundColor = colors[randomColorIndex];
    
    itemsStrip.appendChild(item);
  });
  
  slotContainer.appendChild(itemsStrip);
  wheel.appendChild(slotContainer);
  
  // Create display window with highlight section
  const displayWindow = document.createElement('div');
  displayWindow.className = 'slot-window';
  wheel.appendChild(displayWindow);
  
  // Add selection pointer
  const pointer = document.createElement('div');
  pointer.className = 'slot-pointer';
  wheel.appendChild(pointer);
  
  // Position the strip so a game is centered in the window
  centerStripPosition(itemsStrip);
  
  // Add lights around the slot machine
  createSlotLights();
}

// Center a game in the slot window
function centerStripPosition(strip) {
  if (!strip) return;
  
  const itemHeight = 60; // Height of each slot item
  // This centers a game in the middle by offsetting by half an item height
  strip.style.transform = `translateY(-${itemHeight / 2}px)`;
}

// Create lights around the slot machine
function createSlotLights() {
  wheelLights.innerHTML = '';
  const numLights = 20;
  
  // Create a top row of lights
  const topRow = document.createElement('div');
  topRow.className = 'lights-row top';
  
  // Create a bottom row of lights
  const bottomRow = document.createElement('div');
  bottomRow.className = 'lights-row bottom';
  
  for (let i = 0; i < numLights; i++) {
    const topLight = document.createElement('div');
    topLight.className = 'light';
    topLight.style.animationDelay = `${i * 0.1}s`;
    topRow.appendChild(topLight);
    
    const bottomLight = document.createElement('div');
    bottomLight.className = 'light';
    bottomLight.style.animationDelay = `${i * 0.1}s`;
    bottomRow.appendChild(bottomLight);
  }
  
  wheelLights.appendChild(topRow);
  wheelLights.appendChild(bottomRow);
}

ip = document.querySelector('.items-strip');
  
  // Calculate a random position to stop
  const randomIndex = Math.floor(Math.random() * games.length);
  const itemHeight = 60; // Height of each slot item in pixels
  
  // Calculate total height of strip (for continuous loop effect)
  const totalHeight = itemHeight * games.length;
  
  // Calculate target position (negative value to move upward)
  // We add extra rotations to make the spin more dramatic
  const extraRotations = 10; // Number of full rotations before stopping
  const targetPosition = -(extraRotations * totalHeight + randomIndex * itemHeight);
  
  // Reset position first (for repeated spins)
  // This creates the illusion of continuous spinning
  itemsStrip.style.transition = 'none';
  itemsStrip.style.transform = 'translateY(0)';
  
  // Force a reflow to ensure the above style takes effect before we animate
  void itemsStrip.offsetHeight;
  
  // Start the animation
  itemsStrip.style.transition = `transform ${spinDuration / 1000}s cubic-bezier(.17,.67,.15,1)`;
  itemsStrip.style.transform = `translateY(${targetPosition}px)`;
  
  setTimeout(() => {
    spinning = false;
    spinBtn.disabled = false;
    spinBtn.textContent = 'Spin the Slot!';
    
    // Get the selected game
    const selectedGame = games[randomIndex];
    
    // Play win sound
    if (typeof playSound === 'function') {
      playSound(document.getElementById('win-sound'));
    }
    
    // Display result
    resultElement.textContent = `You got: ${selectedGame}!`;
    resultElement.classList.add('show');
    
    // Check if this is a trigger for a sub-wheel
    if (currentWheel === 'main' && SUB_WHEEL_TRIGGERS.main.includes(selectedGame)) {
      // Show notification about switching to sub-wheel
      const subWheelType = TRIGGER_TO_WHEEL_MAP[selectedGame];
      
      // Queue up a sub-wheel spin after a short delay
      setTimeout(() => {
        // First switch to the appropriate wheel
        switchWheel(subWheelType);
        
        // Then spin it automatically after a short pause
        setTimeout(() => {
          spinWheel();
        }, 500);
        
      }, 1500); // Give time to read the initial result
    } else {
      // Store in queue (only for non-trigger results)
      setQueuedGame(selectedGame);
    }
    
    // Show celebration effects
    createConfetti();
    createFireworks();
    
    // Reset strip for next spin by making it seamless
    setTimeout(() => {
      itemsStrip.style.transition = 'none';
      
      // This is the modulo operation to get the proper position
      // for continuous spinning next time
      const resetPosition = -(randomIndex * itemHeight);
      itemsStrip.style.transform = `translateY(${resetPosition}px)`;
    }, 100);
  }, spinDuration);
}

// Show a popup with the selected game
function showSelectionPopup(game) {
  // Create popup if it doesn't exist
  let popup = document.getElementById('selection-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'selection-popup';
    popup.className = 'selection-popup';
    
    // Create popup content
    popup.innerHTML = `
      <h2>Your Selection</h2>
      <div class="game-name"></div>
      <button class="close-btn">Great!</button>
    `;
    
    // Add to document
    document.body.appendChild(popup);
    
    // Add close event
    popup.querySelector('.close-btn').addEventListener('click', () => {
      popup.classList.remove('show');
    });
  }
  
  // Set game name
  popup.querySelector('.game-name').textContent = game;
  
  // Show popup
  popup.classList.add('show');
  
  // Save to localStorage
  queuedGame = game;
  localStorage.setItem('queuedGame', game);
  
  // Save to server
  try {
    fetch('/api/queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ game })
    });
  } catch (error) {
    console.error('Error saving to server:', error);
  }
}

// Load last selected game from localStorage or server
async function loadLastSelection() {
  let lastGame = null;
  
  // Try to load from server first
  try {
    const response = await fetch('/api/queue');
    const data = await response.json();
    
    if (data.current) {
      lastGame = data.current;
    }
  } catch (error) {
    console.error('Error loading from server:', error);
  }
  
  // Fall back to localStorage if server fails or has no data
  if (!lastGame) {
    lastGame = localStorage.getItem('queuedGame');
  }
  
  // Store for reference
  if (lastGame) {
    queuedGame = lastGame;
  }
}

// Switch between different wheels (main, movies, tv, tabletop)
function switchWheel(wheelType) {
  if (spinning) return;
  
  // Play click sound
  if (typeof playSound === 'function') {
    playSound(document.getElementById('click-sound'));
  }
  
  currentWheel = wheelType;
  createWheel(wheelType);
  
  // Update active button
  wheelNavButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.wheel === wheelType) {
      btn.classList.add('active');
    }
  });
}

// Show the games list dropdown
function showGamesList() {
  // Update title based on current wheel
  let listTitleText = 'Games List';
  switch(currentWheel) {
    case 'main': listTitleText = 'Games List'; break;
    case 'movies': listTitleText = 'Movies List'; break;
    case 'tv': listTitleText = 'TV Shows List'; break;
    case 'tabletop': listTitleText = 'Tabletop Games List'; break;
  }
  listTitle.textContent = listTitleText;
  
  // Clear previous list
  listContent.innerHTML = '';
  
  // Get current list
  const games = gameLists[currentWheel] || [];
  
  if (games.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'list-item';
    emptyItem.textContent = 'No items available';
    listContent.appendChild(emptyItem);
  } else {
    // Sort alphabetically for easier browsing
    const sortedGames = [...games].sort();
    
    // Create list items
    sortedGames.forEach(game => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.textContent = game;
      listContent.appendChild(item);
    });
  }
  
  // Show dropdown
  listDropdown.classList.add('show');
  
  // Play click sound
  if (typeof playSound === 'function') {
    playSound(document.getElementById('click-sound'));
  }
}

// Hide the games list dropdown
function hideGamesList() {
  listDropdown.classList.remove('show');
  
  // Play click sound
  if (typeof playSound === 'function') {
    playSound(document.getElementById('click-sound'));
  }
}

// Create confetti effect
function createConfetti() {
  clearConfetti();
  
  const colors = [
    '#e63946', // Red
    '#2a9d8f', // Green
    '#4361ee', // Blue
    '#f94144', // Bright Red
    '#43aa8b', // Dark Green
    '#277da1'  // Dark Blue
  ];
  
  // Create more confetti for a bigger celebration
  for (let i = 0; i < 250; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Random color
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Random position - spread across the entire width
    const left = Math.random() * 100;
    // Start at bottom of the screen instead of top
    const bottom = Math.random() * 20;
    confetti.style.left = `${left}%`;
    confetti.style.bottom = `${bottom}%`;
    
    // Random size - mix of small and large pieces
    const size = Math.random() * 10 + 5;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    
    // Random animation duration and delay for a more natural effect
    const duration = Math.random() * 3 + 2; // 2-5 seconds
    const delay = Math.random() * 0.5; // 0-0.5 second delay
    confetti.style.animation = `fall ${duration}s linear ${delay}s forwards`;
    
    // Random rotation
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    // Give some confetti different shapes
    if (i % 5 === 0) {
      confetti.style.borderRadius = '0'; // Square confetti
    } else if (i % 7 === 0) {
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size * 3}px`; // Rectangle confetti
      confetti.style.borderRadius = '0';
    }
    
    confettiContainer.appendChild(confetti);
    
    // Remove confetti after animation completes
    setTimeout(() => {
      if (confetti.parentNode === confettiContainer) {
        confettiContainer.removeChild(confetti);
      }
    }, (duration + delay) * 1000);
  }
  
  // Add a burst effect
  setTimeout(() => {
    // Create a second wave of confetti after a short delay
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      
      // Random color
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Center position with outward burst
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 30 + 20;
      const startLeft = 50 + Math.cos(angle) * distance;
      const startBottom = 50 + Math.sin(angle) * distance;
      
      confetti.style.left = `${startLeft}%`;
      confetti.style.bottom = `${startBottom}%`;
      
      // Random size
      const size = Math.random() * 8 + 4;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      
      // Random animation
      const duration = Math.random() * 2 + 1;
      confetti.style.animation = `fall ${duration}s linear forwards`;
      
      confettiContainer.appendChild(confetti);
      
      // Remove confetti after animation completes
      setTimeout(() => {
        if (confetti.parentNode === confettiContainer) {
          confettiContainer.removeChild(confetti);
        }
      }, duration * 1000);
    }
  }, 300);
}

// Create fireworks effect
function createFireworks() {
  // Create multiple fireworks with different timings
  for (let j = 0; j < 8; j++) {
    setTimeout(() => {
      // Random position for the firework origin
      const originX = 20 + Math.random() * 60; // Between 20-80% of the screen width
      const originY = 30 + Math.random() * 40; // Between 30-70% of the screen height
      
      // Firework color
      const hue = Math.floor(Math.random() * 360);
      const baseColor = `hsl(${hue}, 100%, 50%)`;
      
      // Create particles for each firework
      const numParticles = 20 + Math.floor(Math.random() * 30); // 20-50 particles
      
      for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti'; // Reuse the confetti class
        
        // Set starting position
        particle.style.left = `${originX}%`;
        particle.style.top = `${originY}%`;
        
        // Set color with slight variations
        const lightness = 40 + Math.floor(Math.random() * 60); // 40-100% lightness
        particle.style.backgroundColor = `hsl(${hue}, 100%, ${lightness}%)`;
        particle.style.boxShadow = `0 0 6px 2px ${baseColor}`;
        
        // Set particle size
        const size = Math.random() * 4 + 2; // 2-6px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Calculate random end position for the particle
        const angle = Math.random() * Math.PI * 2; // 0-360 degrees in radians
        const distance = Math.random() * 100 + 50; // 50-150 pixels
        const xEnd = Math.cos(angle) * distance;
        const yEnd = Math.sin(angle) * distance;
        
        // Set CSS variables for the animation
        particle.style.setProperty('--x-end', `${xEnd}px`);
        particle.style.setProperty('--y-end', `${yEnd}px`);
        
        // Set animation
        const duration = Math.random() * 0.6 + 0.4; // 0.4-1 second
        particle.style.animation = `firework ${duration}s forwards`;
        
        confettiContainer.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode === confettiContainer) {
            confettiContainer.removeChild(particle);
          }
        }, duration * 1000);
      }
    }, j * 300); // Stagger fireworks launch timing
  }
}

// Clear all confetti
function clearConfetti() {
  confettiContainer.innerHTML = '';
}

// Set up event listeners
function setupEventListeners() {
  // Spin button
  spinBtn.addEventListener('click', spinWheel);
  
  // Clear queue button (for legacy code compatibility)
  const clearQueueBtn = document.getElementById('clear-queue');
  if (clearQueueBtn) {
    clearQueueBtn.addEventListener('click', () => {
      // Clear queued game
      queuedGame = null;
      localStorage.removeItem('queuedGame');
      
      // Try to clear on server
      try {
        fetch('/api/queue', { method: 'DELETE' });
      } catch (error) {
        console.error('Error clearing queue from server:', error);
      }
    });
  }
  
  // Wheel navigation buttons
  wheelNavButtons.forEach(button => {
    button.addEventListener('click', () => {
      switchWheel(button.dataset.wheel);
    });
  });
  
  // List dropdown button
  showListBtn.addEventListener('click', showGamesList);
  
  // Close list button
  closeListBtn.addEventListener('click', hideGamesList);
  
  // Close list when clicking outside
  document.addEventListener('click', function(event) {
    if (listDropdown.classList.contains('show') && 
        !listDropdown.contains(event.target) && 
        event.target !== showListBtn) {
      hideGamesList();
    }
  });
  
  // Update list when switching wheels
  wheelNavButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (listDropdown.classList.contains('show')) {
        showGamesList(); // Refresh list with new wheel contents
      }
    });
  });
  
  // Resize event to recalculate wheel lights
  window.addEventListener('resize', () => {
    if (!spinning) {
      createSlotLights();
    }
  });
  
  // Close popup when clicking outside
  document.addEventListener('click', function(event) {
    const popup = document.getElementById('selection-popup');
    if (popup && popup.classList.contains('show') && 
        !popup.contains(event.target) && 
        !event.target.closest('#confetti-container')) {
      popup.classList.remove('show');
    }
  });
}

// Make certain functions available globally
window.createWheel = createWheel;
window.currentWheel = currentWheel;
window.showGamesList = showGamesList;

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
