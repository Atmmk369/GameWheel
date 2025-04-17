// Game lists for different wheels
let gameLists = {
  main: [],
  movies: [],
  tv: [],
  tabletop: []
};

// Bright colors for the wheel segments
const colors = [
  "#FF5252", // Red
  "#FF7B25", // Orange
  "#FFC107", // Yellow
  "#4CAF50", // Green
  "#8E44AD", // Purple
  "#E91E63", // Pink
  "#00BCD4", // Cyan
  "#3F51B5", // Indigo
  "#FF4081", // Pink-Red
  "#009688"  // Teal
];

// DOM elements
const wheel = document.getElementById('wheel');
const wheelLights = document.getElementById('wheel-lights');
const spinBtn = document.getElementById('spin-btn');
const spinWheelBtn = document.getElementById('spin-wheel');
const resultElement = document.getElementById('result');
const confettiContainer = document.getElementById('confetti-container');
const queuedGameElement = document.getElementById('queued-game');
const clearQueueBtn = document.getElementById('clear-queue');
const wheelNavButtons = document.querySelectorAll('.wheel-nav-btn');

// Variables
let spinning = false;
let currentRotation = 0;
let currentWheel = 'main';
let queuedGame = null;

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
  
  const segmentAngle = 360 / games.length;
  
  // Determine how many colors to use based on the number of games
  const numColors = colors.length;
  
  games.forEach((game, index) => {
    const segment = document.createElement('div');
    segment.className = 'segment';
    
    // Calculate rotation for this segment
    const rotation = index * segmentAngle;
    segment.style.transform = `rotate(${rotation}deg)`;
    
    // Assign color from our color array (repeating as needed)
    segment.style.backgroundColor = colors[index % numColors];
    
    // Create a container for content to position text properly
    const contentDiv = document.createElement('div');
    contentDiv.className = 'segment-content';
    contentDiv.style.transform = `rotate(${segmentAngle / 2}deg)`;
    
    // Add text label
    const textElement = document.createElement('div');
    textElement.className = 'segment-text';
    textElement.textContent = game;
    
    contentDiv.appendChild(textElement);
    segment.appendChild(contentDiv);
    wheel.appendChild(segment);
  });
  
  // Create lights around the wheel
  createWheelLights();
}

// Create lights around the wheel
function createWheelLights() {
  wheelLights.innerHTML = '';
  const numLights = 20;
  const radius = wheel.offsetWidth / 2;
  
  for (let i = 0; i < numLights; i++) {
    const light = document.createElement('div');
    light.className = 'light';
    
    // Calculate position around the circle
    const angle = (i / numLights) * 2 * Math.PI;
    const x = radius + Math.cos(angle) * radius - 5; // -5 to adjust for light size
    const y = radius + Math.sin(angle) * radius - 5;
    
    light.style.left = `${x}px`;
    light.style.top = `${y}px`;
    
    // Staggered animation delay
    light.style.animationDelay = `${i * 0.1}s`;
    
    wheelLights.appendChild(light);
  }
}

// Spin the wheel
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
  
  // Calculate a random spin (5-10 full rotations plus a random segment)
  const spinDuration = 5000; // 5 seconds
  const extraRotations = Math.floor(Math.random() * 5) + 5; // 5-10 rotations
  const games = gameLists[currentWheel] || [];
  
  if (games.length === 0) {
    // Handle case when there are no games
    spinning = false;
    spinBtn.disabled = false;
    spinBtn.textContent = 'Spin the Wheel!';
    resultElement.textContent = 'No games available to spin!';
    resultElement.classList.add('show');
    return;
  }
  
  const segmentAngle = 360 / games.length;
  const randomSegment = Math.floor(Math.random() * games.length);
  const finalAngle = extraRotations * 360 + randomSegment * segmentAngle;
  
  // Add a small random offset within the segment
  const randomOffset = Math.random() * (segmentAngle * 0.8);
  const totalRotation = finalAngle + randomOffset;
  
  // Apply rotation
  currentRotation += totalRotation;
  wheel.style.transform = `rotate(${currentRotation}deg)`;
  
  // After spinning animation completes
  setTimeout(() => {
    spinning = false;
    spinBtn.disabled = false;
    spinBtn.textContent = 'Spin the Wheel!';
    
    // Calculate which game was selected
    const normalizedRotation = currentRotation % 360;
    const selectedIndex = games.length - 1 - Math.floor((normalizedRotation / 360) * games.length);
    const selectedGame = games[selectedIndex % games.length];
    
    // Play win sound
    if (typeof playSound === 'function') {
      playSound(document.getElementById('win-sound'));
    }
    
    // Display result
    resultElement.textContent = `You got: ${selectedGame}!`;
    resultElement.classList.add('show');
    
    // Store in queue
    setQueuedGame(selectedGame);
    
    // Show celebration effects
    createConfetti();
    createFireworks();
  }, spinDuration);
}

// Store the selected game in the queue
async function setQueuedGame(game) {
  queuedGame = game;
  
  // Update UI
  queuedGameElement.innerHTML = `<p>${game}</p>`;
  clearQueueBtn.disabled = false;
  
  // Save to localStorage for persistence
  localStorage.setItem('queuedGame', game);
  
  // Send to server if available
  try {
    await fetch('/api/queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ game })
    });
  } catch (error) {
    console.error('Error saving queue to server:', error);
    // Continue anyway, as we've saved to localStorage
  }
}

// Clear the queued game
async function clearQueue() {
  queuedGame = null;
  
  // Update UI
  queuedGameElement.innerHTML = `<p>No game in queue</p>`;
  clearQueueBtn.disabled = true;
  
  // Play click sound
  if (typeof playSound === 'function') {
    playSound(document.getElementById('click-sound'));
  }
  
  // Remove from localStorage
  localStorage.removeItem('queuedGame');
  
  // Clear from server if available
  try {
    await fetch('/api/queue', {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error clearing queue from server:', error);
    // Continue anyway, as we've cleared localStorage
  }
}

// Load queued game from localStorage or server on startup
async function loadQueuedGame() {
  // Try to load from server first
  try {
    const response = await fetch('/api/queue');
    const data = await response.json();
    
    if (data.current) {
      setQueuedGame(data.current);
      return;
    }
  } catch (error) {
    console.error('Error loading queue from server:', error);
  }
  
  // Fall back to localStorage if server fails
  const savedGame = localStorage.getItem('queuedGame');
  if (savedGame) {
    setQueuedGame(savedGame);
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

// Create confetti effect
function createConfetti() {
  clearConfetti();
  
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 
                 '#ffa500', '#8a2be2', '#32cd32', '#1e90ff', '#ff1493', '#00ced1'];
  
  // Create more confetti for a bigger celebration
  for (let i = 0; i < 250; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Random color
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Random position - spread across the entire width
    const left = Math.random() * 100;
    const top = -30 - Math.random() * 100; // Start above the viewport
    confetti.style.left = `${left}%`;
    confetti.style.top = `${top}px`;
    
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
      const startTop = 50 + Math.sin(angle) * distance;
      
      confetti.style.left = `${startLeft}%`;
      confetti.style.top = `${startTop}%`;
      
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
  
  // Wheel center click to spin
  spinWheelBtn.addEventListener('click', spinWheel);
  
  // Clear queue button
  clearQueueBtn.addEventListener('click', clearQueue);
  
  // Wheel navigation buttons
  wheelNavButtons.forEach(button => {
    button.addEventListener('click', () => {
      switchWheel(button.dataset.wheel);
    });
  });
  
  // Resize event to recalculate wheel lights
  window.addEventListener('resize', () => {
    if (!spinning) {
      createWheelLights();
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
