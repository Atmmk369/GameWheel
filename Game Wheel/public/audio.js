// Audio elements
const backgroundMusic = document.getElementById('background-music');
const spinSound = document.getElementById('spin-sound');
const winSound = document.getElementById('win-sound');
const clickSound = document.getElementById('click-sound');
const toggleMusicBtn = document.getElementById('toggle-music');
const toggleSoundBtn = document.getElementById('toggle-sound');

// State
let musicEnabled = false;
let soundsEnabled = true;

// Initialize audio settings
function initAudio() {
  // Load settings from localStorage
  const savedMusicSetting = localStorage.getItem('musicEnabled');
  const savedSoundSetting = localStorage.getItem('soundsEnabled');
  
  // Apply saved settings or use defaults
  musicEnabled = savedMusicSetting ? savedMusicSetting === 'true' : false;
  soundsEnabled = savedSoundSetting ? savedSoundSetting === 'true' : true;
  
  // Update UI to match settings
  updateAudioUI();
  
  // Set up event listeners
  setupAudioEventListeners();
}

// Play a sound if sounds are enabled
function playSound(soundElement) {
  if (soundsEnabled && soundElement) {
    // Reset sound to beginning (in case it's already playing)
    soundElement.currentTime = 0;
    
    // Play the sound
    soundElement.play().catch(error => {
      console.error('Error playing sound:', error);
    });
  }
}

// Toggle background music
function toggleMusic() {
  musicEnabled = !musicEnabled;
  
  if (musicEnabled) {
    backgroundMusic.play().catch(error => {
      console.error('Error playing background music:', error);
      musicEnabled = false; // Revert state if play fails
    });
  } else {
    backgroundMusic.pause();
  }
  
  // Save setting to localStorage
  localStorage.setItem('musicEnabled', musicEnabled);
  
  // Update UI
  updateAudioUI();
}

// Toggle sound effects
function toggleSounds() {
  soundsEnabled = !soundsEnabled;
  
  // Save setting to localStorage
  localStorage.setItem('soundsEnabled', soundsEnabled);
  
  // Update UI
  updateAudioUI();
}

// Update UI to match current audio settings
function updateAudioUI() {
  // Music button
  if (musicEnabled) {
    toggleMusicBtn.innerHTML = '<i class="fas fa-music"></i>';
    toggleMusicBtn.classList.remove('muted');
  } else {
    toggleMusicBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    toggleMusicBtn.classList.add('muted');
  }
  
  // Sound effects button
  if (soundsEnabled) {
    toggleSoundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    toggleSoundBtn.classList.remove('muted');
  } else {
    toggleSoundBtn.innerHTML = '<i class="fas fa-volume-off"></i>';
    toggleSoundBtn.classList.add('muted');
  }
}

// Set up audio-related event listeners
function setupAudioEventListeners() {
  // Music toggle button
  toggleMusicBtn.addEventListener('click', () => {
    toggleMusic();
    playSound(clickSound); // Play click sound if enabled
  });
  
  // Sound effects toggle button
  toggleSoundBtn.addEventListener('click', () => {
    // We need to toggle sound first, then play click sound
    // so we can hear the click even when enabling sound
    const prevSoundState = soundsEnabled;
    toggleSounds();
    if (prevSoundState || soundsEnabled) {
      playSound(clickSound);
    }
  });
  
  // Loop background music when it ends
  backgroundMusic.addEventListener('ended', () => {
    if (musicEnabled) {
      backgroundMusic.play().catch(error => {
        console.error('Error restarting background music:', error);
      });
    }
  });
}

// Initialize audio on page load
document.addEventListener('DOMContentLoaded', initAudio);
