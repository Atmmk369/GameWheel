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
  } catch (error) {
    console.warn('Error loading from server, falling back to localStorage:', error);
    
    // Fallback to localStorage
    const savedLists = localStorage.getItem('gameLists');
    if (savedLists) {
      try {
        gameLists = JSON.parse(savedLists);
      } catch (e) {
        console.error('Error parsing saved game lists:', e);
      }
    }
    
    // If still empty, use default lists
    if (!gameLists.main || gameLists.main.length === 0) {
      gameLists = {
        main: ["Terraria", "The Finals", "Garrys Mod", "Sea of Thieves", "Starbound",
          "Elden Ring", "Tabletop Simulator", "Killing Floor 2", "Dead by Daylight", "Barony",
          "Satisfactory", "Dont Starve Together", "Payday 2", "Outlast Trials",
          "Hunt Showdown", "Core Keeper", "Gang Beasts", "Rainbow Six Siege",
          "Project Zomboid", "Lethal Company", "Deep Rock Galactic", "Golf With Your Friends",
          "Labyrithine", "Human Fall Flat", "Phasmophobia", "Viscera Clean Up Detail",
          "Mount Your Friends", "Fistful of Frags", "Speed Runners", "Unturned",
          "Hearts of Iron 4", "Barotrauma", "Factorio", "Worms WMD", "Stick Fight The Game",
          "Ready or Not", "Dark and Darker", "Arma 3", "Town of Salem", "Devour",
          "In Silence", "Helldivers 2", "Elder Scrolls Online", "Baldur's Gate 3",
          "Inside The Backrooms", "OpenTTD", "The Escapists 2", "Rust",
          "Dale and Dawson Stationary", "DayZ", "Marvel Rivals", "SCP Containment Breach",
          "Tricky Towers", "Left 4 Dead 2", "Hell Let Loose", "7 Days to Die",
          "Holdfast Nations At War", "SCP Secret Lab", "Counter Strike", "Minecraft",
          "Movie Time", "TV Time", "Tabletop Time"],
        movies: ["The Shawshank Redemption", "The Godfather", "The Dark Knight", "Pulp Fiction",
          "Fight Club", "Inception", "The Matrix", "Goodfellas", "Interstellar", 
          "The Lord of the Rings", "Star Wars", "The Avengers", "Jurassic Park",
          "The Lion King", "Titanic", "Avatar", "Forrest Gump", "The Silence of the Lambs",
          "Gladiator", "Saving Private Ryan"],
        tv: ["Breaking Bad", "Game of Thrones", "The Sopranos", "The Wire", "Friends",
          "The Office", "Stranger Things", "The Mandalorian", "Chernobyl", "Band of Brothers",
          "The Crown", "True Detective", "Black Mirror", "Fargo", "Sherlock",
          "Westworld", "Narcos", "Mindhunter", "Dark", "The Queen's Gambit"],
        tabletop: ["Catan", "Ticket to Ride", "Pandemic", "Carcassonne", "Scythe",
          "Gloomhaven", "Terraforming Mars", "7 Wonders", "Dominion", "Wingspan",
          "Root", "Arkham Horror", "Spirit Island", "Brass Birmingham",
          "Twilight Imperium", "Azul", "Everdell", "Blood Rage", "Viticulture",
          "Agricola"]
      };
      localStorage.setItem('gameLists', JSON.stringify(gameLists));
    }
  }
  
  // Create the wheel with the loaded data
  createWheel(currentWheel);
  
  // Set up event listeners
  setupEventListeners();
  
  // Load last selection
  loadLastSelection();
}

// Create wheel with static items (no animations during creation)
function createWheel(wheelType) {
  wheel.innerHTML = '';
  const games = gameLists[wheelType] || [];
  
  if (games.length === 0) {
    // Display a message if the wheel has no games
    wheel.innerHTML = '<div class="no-games">No games available</div>';
    return;
  }
  
  // Create a simple 3-item display
  const slotContainer = document.createElement('div');
  slotContainer.className = 'slot-container';
  
  // Add at most 3 items (or fewer if games list is smaller)
  const displayCount = 3;
  const displayItems = Math.min(displayCount, games.length);
  
  // Create a div for each visible position
  for (let i = 0; i < displayItems; i++) {
    const itemWrapper = document.createElement('div');
    itemWrapper.className = 'slot-position';
    itemWrapper.id = `slot-position-${i}`;
    
    // Middle position (index 1) is the selected one
    if (i === 1) {
      itemWrapper.classList.add('selected-position');
    }
    
    // Add the game item
    const gameIndex = i % games.length;
    const item = document.createElement('div');
    item.className = 'slot-item';
    item.textContent = games[gameIndex];
    
    // Assign color
    const randomColorIndex = Math.floor(Math.random() * colors.length);
    item.style.backgroundColor = colors[randomColorIndex];
    
    itemWrapper.appendChild(item);
    slotContainer.appendChild(itemWrapper);
  }
  
  wheel.appendChild(slotContainer);
  
  // Add selection pointer
  const pointer = document.createElement('div');
  pointer.className = 'slot-pointer';
  wheel.appendChild(pointer);
  
  // Add lights around the slot machine
  createSlotLights();
  
  // Store the current games array and position
  wheel.dataset.games = JSON.stringify(games);
  wheel.dataset.position = 0;
}

// Create lights around the slot machine
function createSlotLights() {
  wheelLights.innerHTML = '';
  const numLights = 20;
  
  // Create top row of lights
  const topRow = document.createElement('div');
  topRow.className = 'lights-row top';
  
  // Create bottom row of lights
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

// Spin the wheel - simplified version
function spinWheel() {
  if (spinning) return;
  
  // Play spin sound
  if (typeof playSound === 'function') {
    playSound(document.getElementById('spin-sound'));
  }
  
  spinning = true;
  spinBtn.disabled = true;
  spinBtn.textContent = 'Spinning...';
  resultElement.classList.remove('show');
  resultElement.textContent = '';
  clearConfetti();
  
  const games = gameLists[currentWheel] || [];
  
  if (games.length === 0) {
    // Handle case when there are no games
    spinning = false;
    spinBtn.disabled = false;
    spinBtn.textContent = 'Spin the Slot!';
    resultElement.textContent = 'No games available to spin!';
    resultElement.classList.add('show');
    return;
  }
  
  // Get the slot positions
  const positions = document.querySelectorAll('.slot-position');
  
  // Start visual spinning effect - rapidly change the games
  let spinCounter = 0;
  const spinSpeed = 60; // milliseconds between updates
  const spinDuration = 5000; // total spin time in milliseconds
  const maxSpins = Math.floor(spinDuration / spinSpeed);
  
  // Pick a random result now
  const randomIndex = Math.floor(Math.random() * games.length);
  const selectedGame = games[randomIndex];
  
  // Start the spinning animation
  const spinInterval = setInterval(() => {
    spinCounter++;
    
    // Update each position with a new game
    positions.forEach((position, posIndex) => {
      // Calculate game index (each position shows a different game)
      // This creates the illusion of scrolling
      const offset = spinCounter + posIndex;
      const gameIndex = offset % games.length;
      
      // As we approach the end, slow down and converge on the chosen game
      if (spinCounter > maxSpins * 0.7) {
        // For the middle (selected) position, make sure it ends on our selected game
        if (posIndex === 1) {
          // Calculate how close we are to the end (0 to 1)
          const progress = (spinCounter - maxSpins * 0.7) / (maxSpins * 0.3);
          
          // As progress approaches 1, increase chance of showing the final game
          if (Math.random() < progress * 0.8) {
            // Show the final selection
            updateSlotPosition(position, selectedGame);
            return;
          }
        }
      }
      
      // Normal spinning updates
      updateSlotPosition(position, games[gameIndex]);
    });
    
    // End spinning after the specified duration
    if (spinCounter >= maxSpins) {
      clearInterval(spinInterval);
      
      // Make sure the middle position shows the selected game
      const middlePosition = positions[1];
      updateSlotPosition(middlePosition, selectedGame);
      
      // Update positions above and below to be consistent
      if (positions[0]) {
        const prevIndex = (randomIndex - 1 + games.length) % games.length;
        updateSlotPosition(positions[0], games[prevIndex]);
      }
      
      if (positions[2]) {
        const nextIndex = (randomIndex + 1) % games.length;
        updateSlotPosition(positions[2], games[nextIndex]);
      }
      
      // End the spin
      spinning = false;
      spinBtn.disabled = false;
      spinBtn.textContent = 'Spin the Slot!';
      
      // Display result
      resultElement.textContent = `You got: ${selectedGame}!`;
      resultElement.classList.add('show');
      
      // Play win sound
      if (typeof playSound === 'function') {
        playSound(document.getElementById('win-sound'));
      }
      
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
        // Show selection popup
        showSelectionPopup(selectedGame);
      }
      
      // Show celebration effects
      createConfetti();
      createFireworks();
    }
  }, spinSpeed);
}

// Update a slot position with a new game
function updateSlotPosition(position, game) {
  // Get the slot item
  const slotItem = position.querySelector('.slot-item');
  
  // If the game already matches, don't update
  if (slotItem.textContent === game) {
    return;
  }
  
  // Update the text
  slotItem.textContent = game;
  
  // Assign a random color
  const randomColorIndex = Math.floor(Math.random() * colors.length);
  slotItem.style.backgroundColor = colors[randomColorIndex];
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
    }).catch(err => console.warn('Error saving to server:', err));
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
    
    if (data && data.current) {
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
    // Start at bottom of the screen
    const bottom = -10;
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
      const startBottom = 40 + Math.sin(angle) * distance;
      
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
  if (spinBtn) {
    spinBtn.addEventListener('click', spinWheel);
  }
  
  // Wheel navigation buttons
  wheelNavButtons.forEach(button => {
    button.addEventListener('click', () => {
      switchWheel(button.dataset.wheel);
    });
  });
  
  // List dropdown button
  if (showListBtn) {
    showListBtn.addEventListener('click', showGamesList);
  }
  
  // Close list button
  if (closeListBtn) {
    closeListBtn.addEventListener('click', hideGamesList);
  }
  
  // Close list when clicking outside
  document.addEventListener('click', function(event) {
    if (listDropdown && listDropdown.classList.contains('show') && 
        !listDropdown.contains(event.target) && 
        event.target !== showListBtn) {
      hideGamesList();
    }
  });
  
  // Update list when switching wheels
  wheelNavButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (listDropdown && listDropdown.classList.contains('show')) {
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
window.spinWheel = spinWheel; // Export for direct access

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);