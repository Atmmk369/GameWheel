const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Data storage location
const DATA_DIR = path.join(__dirname, 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const SUGGESTIONS_FILE = path.join(DATA_DIR, 'suggestions.json');
const QUEUE_FILE = path.join(DATA_DIR, 'queue.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Check if games file exists
    try {
      await fs.access(GAMES_FILE);
    } catch (err) {
      // Create default games file
      const defaultGames = {
        main: [
          "Terraria", "The Finals", "Garrys Mod", "Sea of Thieves", "Starbound",
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
          "Slappyball", "Multiverses", "First Class Trouble", "Civilization VII",
          "Repo", "Schedule 1", "Cards Against Humanity", "Foxhole", "Rain World",
          "Crusader Kings 2", "Castle Crashers", "Battle Block Theater", "Hand Simulator",
          "The Wild Eight", "COD 1", "Warhammer Vermintide 2", "Aneurism IV",
          "Project Winter", "Forewarned", "The Forest", "GTA V", "Unrailed!",
          "Hot Wheels Unleashed", "Marbles On Stream", "Movie Time", "TV Time"
        ],
        movies: [
          "The Shawshank Redemption", "The Godfather", "The Dark Knight", "Pulp Fiction",
          "Fight Club", "Inception", "The Matrix", "Goodfellas", "Interstellar", 
          "The Lord of the Rings", "Star Wars", "The Avengers", "Jurassic Park",
          "The Lion King", "Titanic", "Avatar", "Forrest Gump", "The Silence of the Lambs",
          "Gladiator", "Saving Private Ryan"
        ],
        tv: [
          "Breaking Bad", "Game of Thrones", "The Sopranos", "The Wire", "Friends",
          "The Office", "Stranger Things", "The Mandalorian", "Chernobyl", "Band of Brothers",
          "The Crown", "True Detective", "Black Mirror", "Fargo", "Sherlock",
          "Westworld", "Narcos", "Mindhunter", "Dark", "The Queen's Gambit"
        ],
        tabletop: [
          "Catan", "Ticket to Ride", "Pandemic", "Carcassonne", "Scythe",
          "Gloomhaven", "Terraforming Mars", "7 Wonders", "Dominion", "Wingspan",
          "Root", "Arkham Horror", "Spirit Island", "Brass Birmingham",
          "Twilight Imperium", "Azul", "Everdell", "Blood Rage", "Viticulture",
          "Agricola"
        ]
      };
      await fs.writeFile(GAMES_FILE, JSON.stringify(defaultGames, null, 2));
    }
    
    // Check if suggestions file exists
    try {
      await fs.access(SUGGESTIONS_FILE);
    } catch (err) {
      // Create empty suggestions file
      await fs.writeFile(SUGGESTIONS_FILE, JSON.stringify([], null, 2));
    }
    
    // Check if queue file exists
    try {
      await fs.access(QUEUE_FILE);
    } catch (err) {
      // Create empty queue file
      await fs.writeFile(QUEUE_FILE, JSON.stringify({ current: null }, null, 2));
    }
  } catch (err) {
    console.error('Error initializing data files:', err);
  }
}

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get all games lists
app.get('/api/games', async (req, res) => {
  try {
    const data = await fs.readFile(GAMES_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error getting games:', err);
    res.status(500).json({ error: 'Failed to get games' });
  }
});

// Get a specific games list
app.get('/api/games/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const data = await fs.readFile(GAMES_FILE, 'utf8');
    const games = JSON.parse(data);
    
    if (games[type]) {
      res.json(games[type]);
    } else {
      res.status(404).json({ error: 'Game list not found' });
    }
  } catch (err) {
    console.error('Error getting games list:', err);
    res.status(500).json({ error: 'Failed to get games list' });
  }
});

// Get all pending suggestions
app.get('/api/suggestions', async (req, res) => {
  try {
    const data = await fs.readFile(SUGGESTIONS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error getting suggestions:', err);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Submit a new suggestion
app.post('/api/suggestions', async (req, res) => {
  try {
    const { type, name } = req.body;
    
    // Validate inputs
    if (!type || !name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Invalid suggestion data' });
    }
    
    // Read existing game lists to check for duplicates
    const gamesData = await fs.readFile(GAMES_FILE, 'utf8');
    const games = JSON.parse(gamesData);
    
    // Check if game list type exists
    if (!games[type]) {
      return res.status(400).json({ error: 'Invalid game type' });
    }
    
    // Check for duplicates
    if (games[type].includes(name.trim())) {
      return res.status(400).json({ error: 'This item already exists in the list' });
    }
    
    // Read existing suggestions
    const suggestionsData = await fs.readFile(SUGGESTIONS_FILE, 'utf8');
    const suggestions = JSON.parse(suggestionsData);
    
    // Create new suggestion
    const newSuggestion = {
      id: Date.now().toString(),
      type,
      name: name.trim(),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    // Add to suggestions list
    suggestions.push(newSuggestion);
    
    // Save updated suggestions
    await fs.writeFile(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
    
    res.status(201).json(newSuggestion);
  } catch (err) {
    console.error('Error submitting suggestion:', err);
    res.status(500).json({ error: 'Failed to submit suggestion' });
  }
});

// Approve a suggestion
app.post('/api/suggestions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Read suggestions
    const suggestionsData = await fs.readFile(SUGGESTIONS_FILE, 'utf8');
    const suggestions = JSON.parse(suggestionsData);
    
    // Find the suggestion
    const suggestionIndex = suggestions.findIndex(s => s.id === id);
    if (suggestionIndex === -1) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    
    const suggestion = suggestions[suggestionIndex];
    
    // Read games
    const gamesData = await fs.readFile(GAMES_FILE, 'utf8');
    const games = JSON.parse(gamesData);
    
    // Add to appropriate game list
    if (games[suggestion.type]) {
      games[suggestion.type].push(suggestion.name);
      
      // Save updated games
      await fs.writeFile(GAMES_FILE, JSON.stringify(games, null, 2));
      
      // Update suggestion status
      suggestion.status = 'approved';
      
      // Remove from pending list
      suggestions.splice(suggestionIndex, 1);
      await fs.writeFile(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
      
      res.json({ success: true, suggestion });
    } else {
      res.status(400).json({ error: 'Invalid game type' });
    }
  } catch (err) {
    console.error('Error approving suggestion:', err);
    res.status(500).json({ error: 'Failed to approve suggestion' });
  }
});

// Reject a suggestion
app.post('/api/suggestions/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Read suggestions
    const suggestionsData = await fs.readFile(SUGGESTIONS_FILE, 'utf8');
    const suggestions = JSON.parse(suggestionsData);
    
    // Find the suggestion
    const suggestionIndex = suggestions.findIndex(s => s.id === id);
    if (suggestionIndex === -1) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }
    
    const suggestion = suggestions[suggestionIndex];
    
    // Update suggestion status
    suggestion.status = 'rejected';
    
    // Remove from pending list
    suggestions.splice(suggestionIndex, 1);
    await fs.writeFile(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
    
    res.json({ success: true, suggestion });
  } catch (err) {
    console.error('Error rejecting suggestion:', err);
    res.status(500).json({ error: 'Failed to reject suggestion' });
  }
});

// Get current queued game
app.get('/api/queue', async (req, res) => {
  try {
    const data = await fs.readFile(QUEUE_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error getting queue:', err);
    res.status(500).json({ error: 'Failed to get queue' });
  }
});

// Set current queued game
app.post('/api/queue', async (req, res) => {
  try {
    const { game } = req.body;
    
    if (!game || typeof game !== 'string') {
      return res.status(400).json({ error: 'Invalid game data' });
    }
    
    const queue = { current: game };
    await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2));
    
    res.json(queue);
  } catch (err) {
    console.error('Error setting queue:', err);
    res.status(500).json({ error: 'Failed to set queue' });
  }
});

// Clear current queued game
app.delete('/api/queue', async (req, res) => {
  try {
    const queue = { current: null };
    await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2));
    
    res.json(queue);
  } catch (err) {
    console.error('Error clearing queue:', err);
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

// Serve the main app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start the server
async function startServer() {
  await ensureDataDir();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
