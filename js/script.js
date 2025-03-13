// GAME STATE VARIABLES
let totalCharactersUsed = 0;            // Total characters used in the current attempt
let shortestWinningClueLength = null;   // Best (shortest) winning clue length
let dailyPuzzle = null;       
let particleCanvas = null;
let ctx = null;
let particles = [];
let animationFrameId = null;            // Store the animation frame ID
let inactivityTimer;                    // Timer to detect inactivity
let gameOver = false;                   // Game status flag
let currentGameMode = "daily";          // Game mode: "daily", "shuffle", or "custom"
let greetingHelp = null;                // Stores the word used in AI's greeting
let previousAIGuesses = [];             // AI's past guesses for this session
let previousClues = [];                 // Player's previous clues
let greetingRetryCount = 0;
let attemptsRemaining = localStorage.getItem("attemptsRemaining") 
    ? parseInt(localStorage.getItem("attemptsRemaining"), 10) 
    : 5;  // Default to 5 if not found in localStorage

const charLimit = 25;

// GREETINGS DATA
let victoryMessages = [];
let greetings = [];
let shuffleGreetings = [];
let customGreetings = [];
let archiveGreetings = [];
let loserGreetings = [];
let winnerGreetings = [];

async function loadGreetingsData() {
    try {
        // Load JSON from /greetings/greetings.json (root-level directory, as requested)
        const response = await fetch('/greetings/greetings.json');
        const data = await response.json();

        // Assign each array to the corresponding variable
        victoryMessages = data.victoryMessages || [];
        greetings = data.greetings || [];
        shuffleGreetings = data.shuffleGreetings || [];
        customGreetings = data.customGreetings || [];
        archiveGreetings = data.archiveGreetings || [];
        loserGreetings = data.loserGreetings || [];
        winnerGreetings = data.winnerGreetings || [];
    } catch (error) {
        console.error("Failed to load greetings data:", error);
    }
}

// UI ELEMENTS

// Primary Game Display Elements
const gameContainer = document.getElementById("game-container");
const gameCard = document.getElementById("game-card")
const gameCardInner = document.getElementById("game-card-inner");
const resultMessage = document.getElementById("result-message");
const dailyWordDisplay = document.getElementById("daily-word");
const avatarImage = document.querySelector('.avatar-image');

// Player Input and Clue Submission
const clueInput = document.getElementById('clue-input');
const submitClueButton = document.getElementById('submit-clue');
const remainingCharacters = document.getElementById('remaining-characters');
const userClueLog = document.getElementById("user-clue-log");

// AI and Clue Log
const ai = document.getElementById('ai');
const user = document.getElementById('user');
const clueLog = document.getElementById('clue-log');

// Sidebar and Header Elements
const header = document.querySelector(".game-header");
const leftSidebar = document.querySelector(".left-sidebar");
const rightSidebar = document.querySelector(".right-sidebar");

// Navigation Buttons
const home = document.getElementById("home-button");
const howToPlayButton = document.getElementById("how-to-play-button");
const backToGameButton = document.getElementById("back-to-game");
const backToMainButton = document.getElementById("back-to-main");
const backToModes = document.getElementById("back-to-modes");
const backToGameSettings = document.getElementById("back-to-game-settings");
const themesMenu = document.getElementById("themes-menu");
const themesButton = document.getElementById("themes-button");
const backToGameThemes = document.getElementById("back-to-game-themes");
const themeButtons = document.querySelectorAll(".theme-button");

// Game Mode Selection
const shuffleMode = document.getElementById("shuffle-mode");
const customMode = document.getElementById("custom-mode");
const archiveButton = document.getElementById("archive-button");
const startCustomGame = document.getElementById("start-custom-game");

// Custom Game Section
const customGameSection = document.getElementById("custom-game-section");

// How to Play Section
const howToPlaySection = document.getElementById("how-to-play");

// Settings and User Input
const settingsButton = document.getElementById("settings-button");
const settingsMenu = document.getElementById("settings-menu");
const saveSettingsButton = document.getElementById("save-settings");
const usernameInput = document.getElementById("username-input");

// Achievements
const achievementsMenu = document.getElementById("achievements-menu");
const achievementsButton = document.getElementById("achievements-button");
const backToGameAchievements = document.getElementById("back-to-game-achievements");

// Archive Mode
const archiveMenu = document.getElementById("archive-menu")
const archiveDayMenu = document.getElementById("archive-day-menu")

// Performance and Game Stats
const bestAttemptElement = document.getElementById("best-attempt");
const confidenceLevel = document.querySelector('.confidence-level');

// Social and Sharing
const shareButton = document.getElementById("share-button");

// TESTING
(function unlockForTesting() {
    if (window.location.origin === "http://localhost:8000") {
        console.log("Test mode: Unlocking all themes & achievements...");
        let achievements = JSON.parse(localStorage.getItem("achievements")) || [
            { id: "dreamer", name: "Deep Thinker", description: "Submit 100 clues in any game mode", progress: 0, goal: 100, unlocked: false },
            { id: "cupcake", name: "Baker’s Dozen", description: "Win 13 Daily Challenges", progress: 0, goal: 13, unlocked: false },
            { id: "verdant", name: "Trailblazer", description: "Win 7 Daily Challenges in a row", progress: 2, goal: 7, unlocked: false },
            { id: "notepad", name: "Blank Page", description: "Win in Custom Mode 10 times", progress: 0, goal: 10, unlocked: false },
            { id: "terminal", name: "C:\\", description: "Win a Daily Challenge with a 3-character clue", progress: 0, goal: 1, unlocked: false },
            { id: "fishbowl", name: "Crystal Clear", description: "Win the Daily Challenge with AI Confidence at 95% or higher", progress: 1, goal: 1, unlocked: true },
            { id: "blizzard", name: "Thin Ice", description: "Win the Daily Challenge with the AI confidence below 30%", progress: 0, goal: 1, unlocked: false },
            { id: "volcano", name: "Smoldering Precision", description: "Win a Daily Challenge with Search Space of 1", progress: 0, goal: 1, unlocked: false },
            { id: "sandbox", name: "Free Play", description: "Win in Shuffle Mode 10 times", progress: 0, goal: 10, unlocked: false },
            { id: "billiards", name: "Corner Pocket", description: "Win the Daily Challenge on your last attempt", progress: 0, goal: 1, unlocked: false },
            { id: "neowave", name: "Last Call", description: "Win a Daily Challenge within 5 minutes of midnight", progress: 0, goal: 1, unlocked: false },
            { id: "eclipse", name: "Totality", description: "Win the Daily Challenge with AI Confidence and Search Space at the same value", progress: 0, goal: 1, unlocked: false },
            { id: "library", name: "Archivist", description: "Complete 10 puzzles from the archive", progress: 0, goal: 10, unlocked: false },
            { id: "luxury", name: "Hundredfold Prestige", description: "Win 100 Daily Challenges", progress: 0, goal: 100, unlocked: false },
        ];
        achievements = achievements.map(ach => ({ ...ach, unlocked: true, progress: ach.goal }));
        localStorage.setItem("achievements", JSON.stringify(achievements));
    }
})();

// GAME STATE MANAGEMENT
// These functions handle game setup, resets, and overall game state.

async function loadPuzzle() {
    try {
        // Fetch puzzle data from JSON file
        const response = await fetch('./puzzles/puzzles.json');
        const puzzlesData = await response.json();
        const allPuzzles = puzzlesData.puzzles;

        // Get today's date in "Month DD, YYYY" format
        const today = new Date();
        const formattedDate = today.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "2-digit"
        });

        // Retrieve stored puzzle date from localStorage
        const storedDate = localStorage.getItem("puzzleDate");

        let storedUsername = localStorage.getItem("username") || document.getElementById("username-input")?.value;

        // Ensure the username is stored properly
        if (!storedUsername) {
            storedUsername = "guest" + Math.floor(10000 + Math.random() * 90000);
            localStorage.setItem("username", storedUsername);
        }

        // Reset attempts for the user, if necessary
        if (storedUsername === "testing123") {
            localStorage.removeItem("playerClues");
            document.getElementById("user-clue-log").innerHTML = ""; // Clear the displayed clue log
            console.log("User's clues have been cleared from local storage.");
            console.log("Resetting attempts for user...");
            localStorage.setItem("attemptsRemaining", 5);
            attemptsRemaining = 5;
            updateAttemptsGauge(); // Ensure UI updates
        }

        // If a new day is detected, reset relevant game data
        if (storedDate !== formattedDate) {
            resetDailyGameData(formattedDate);
        }

        // Find today's puzzle from the list
        const todayPuzzle = allPuzzles.find(puzzle => puzzle.date === formattedDate);
        if (!todayPuzzle) {
            console.error(`No puzzle found for today's date: ${formattedDate}`);
            displayResult("No puzzle available for today. Try again later.");
            return;
        }

        // Store the puzzle in localStorage
        localStorage.setItem("puzzleDate", formattedDate);
        localStorage.setItem("dailyPuzzle", JSON.stringify(todayPuzzle));
        localStorage.setItem(`archive_${formattedDate}`, JSON.stringify(todayPuzzle));
        
        // Update global variable and UI with today's puzzle
        dailyPuzzle = todayPuzzle;
        dailyWordDisplay.textContent = dailyPuzzle.word;
        greetingHelp = dailyPuzzle.word;

        // Load the best previous attempt if available
        loadBestAttempt();
    } catch (error) {
        console.error("Error loading puzzles:", error);
        displayResult("Failed to load today's puzzle. Please try again later.");
        endGame();
    }
}

function resetDailyGameData(formattedDate) {
    console.log("New day detected. Resetting game data.");

    // Clear stored puzzle-related data
    localStorage.removeItem("bestAttemptWord");
    localStorage.removeItem("bestCharacterScore");
    localStorage.removeItem("dailyPuzzle");
    localStorage.removeItem("puzzleDate");
    localStorage.removeItem("playerClues");
    localStorage.removeItem("lastPlayedDate");

    // Reset attempts remaining and update UI
    localStorage.setItem("attemptsRemaining", 5);
    attemptsRemaining = 5;
    updateAttemptsGauge();

    // Store the new puzzle date
    localStorage.setItem("puzzleDate", formattedDate);
}

async function loadRandomPuzzle() {
    try {
        console.log("Loading a random puzzle...");

        resetGameState();
        startNewAttempt();
        updateCluePlaceholder(1);

        // Hide Clue Log
        const response = await fetch('./puzzles/puzzles.json');
        const puzzlesData = await response.json();
        const allPuzzles = puzzlesData.puzzles;

        // Exclude today's puzzle to ensure randomness
        const today = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "2-digit"
        });

        const filteredPuzzles = allPuzzles.filter(puzzle => puzzle.date !== today);

        if (filteredPuzzles.length === 0) {
            console.error("No puzzles available for shuffle mode.");
            displayResult("Shuffle mode is unavailable. Try again later.");
            return;
        }

        if (currentGameMode === 'shuffle') {
            document.body.classList.add("altmode-active");
        }

        // Select a random puzzle
        dailyPuzzle = filteredPuzzles[Math.floor(Math.random() * filteredPuzzles.length)];
        greetingHelp = dailyPuzzle.word;
        dailyWordDisplay.textContent = dailyPuzzle.word;

        // Reset gauges to default values
        updateCharacterGauge(25);
        updateConfidenceBar(0);
        document.querySelector(".search-space-text").textContent = "100";
        document.querySelector(".search-space-fill").style.strokeDashoffset = "251.2";    

        // Continue with loading a new puzzle
        console.log("Random puzzle loaded!");
    } catch (error) {
        console.error("Error loading random puzzle:", error);
        displayResult("Failed to load a random puzzle. Please try again.");
    }
}

function startNewAttempt() {
    clueInput.disabled = false;

    if (gameCard.classList.contains("flipped")) {
        gameCard.classList.remove("flipped");
    }

    // Clear the clue input field and disable the submit button
    clueInput.value = '';
    submitClueButton.disabled = true;

    // Clear the result display to remove any previous game messages
    displayResult("");
}

async function handleClueSubmission() {
    if (!dailyPuzzle || !dailyPuzzle.word) {
        console.error("Daily puzzle is not loaded correctly.");
        displayResult("Error: Puzzle not loaded.");
        return;
    }

    toggleSubmitButton();
    
    const clue = clueInput.value.trim();
    if (!clue) return; // Prevent empty submissions

    // Store the clue in localStorage
    addClueToLocalStorage(clue);

    // Increment Dreamer progress (clues submitted)
    incrementAchievementProgress("dreamer");

    // Disable submit button immediately to prevent multiple submissions
    submitClueButton.disabled = true;

    // Clear input field and keep submit button disabled until AI responds
    clueInput.value = "";
    toggleSubmitButton();

    // Clear AI message log and reset inactivity timer
    ai.innerHTML = "";
    clearTimeout(inactivityTimer);
    startInactivityTimer();

    // Add user clue to chat log
    addChatEntry("user", clue);
    previousClues.push(clue.toLowerCase());
    console.log(previousClues)

    // Create or update AI response entry
    let aiEntry = document.querySelector(".chat-entry.ai");
    if (!aiEntry) {
        aiEntry = document.createElement("div");
        aiEntry.classList.add("chat-entry", "ai");
        clueLog.appendChild(aiEntry);
    }
    
    // Show AI "thinking" message
    aiEntry.innerHTML = '<span class="loading-dots">Thinking</span>';
    aiEntry.classList.add("loading-bubble");

    // Reset character gauge
    updateCharacterGauge(25);

    // Fetch AI response
    const aiResponse = await getAIGuess(clue, previousAIGuesses, previousClues);

    // Extract AI response data
    const guess = aiResponse?.guess || "Huh";
    const reasoning = aiResponse?.reasoning || "I'm having trouble thinking straight right now... Please <span class='specialwords'>try again later</span>.";
    const confidence = aiResponse?.confidence || 25;
    const searchSpace = aiResponse?.searchSpace || 100; 

    // Update UI elements based on AI response
    updateSearchSpaceGauge(searchSpace);
    updateAvatar(confidence);
    updateConfidenceBar(confidence);

    // Apply typewriter effect instead of instantly displaying text
    aiEntry.classList.remove("loading-bubble");
    aiEntry.innerHTML = "";

    const aiText = document.createElement("p");
    aiEntry.appendChild(aiText);

    aiEntry.style.visibility = "hidden";
    aiEntry.style.opacity = "0";

    setTimeout(() => {
        aiEntry.style.visibility = "visible";
        aiEntry.style.opacity = "1";
        aiText.style.margin = "0"; 
        typeWriterEffect(`<strong>${guess}?</strong><br>${reasoning}`, aiText);
    }, 150);

    // Highlight AI's response if it matches the correct answer
    if (guess.toLowerCase() === dailyPuzzle.word.toLowerCase()) {
        aiEntry.classList.add("winning-message");
    }

    // Store AI's guess to prevent duplicate responses
    previousAIGuesses.push(guess.toLowerCase());

    toggleSubmitButton();

    // Track characters used in this attempt
    totalCharactersUsed = clue.length;

    // If AI correctly guesses the word, update leaderboard and handle win
    if (guess.toLowerCase() === dailyPuzzle.word.toLowerCase()) {
        const storedBest = parseInt(localStorage.getItem("bestCharacterScore"), 10) || Infinity;

        // Update best score only if in daily mode and score is better
        if (currentGameMode === "daily" && totalCharactersUsed < storedBest) {
            console.log("New Best Attempt! Updating LocalStorage...");
            shortestWinningClueLength = totalCharactersUsed;
            localStorage.setItem("bestCharacterScore", shortestWinningClueLength);
            localStorage.setItem("bestAttemptWord", dailyPuzzle.word);
            console.log("Updating Leaderboard...");

            // Get username input
            const usernameInput = document.getElementById("username-input");
            let username = usernameInput.value.trim();

            // Submit score to leaderboard
            try {
                console.log("Calling submitScore()...");
                await submitScore(username, totalCharactersUsed, clue);
                console.log("submitScore() executed successfully!");
            } catch (error) {
                console.error("Error in submitScore():", error);
            }
        } else {
            console.log("Skipping high score update (user not in daily mode OR new daily mode score was less than previous score).");
        }

        handleWin(0, totalCharactersUsed, searchSpace, confidence);
    } else if (guess.toLowerCase() !== dailyPuzzle.word.toLowerCase() && currentGameMode === 'daily') {
        // Decrement attempts and check if the user has any left
        if (guess !== "Unsure... Try again") {
            decrementAttempts();
        }
        if (attemptsRemaining <= 0) {
            handleLoss(); // Only trigger loss when attempts actually reach 0
        }
    }    
}

async function handleWin(situation, totalCharactersUsed, searchSpace, confidence) {
    gameOver = true;

    if (situation === 0) {  // Ensure this only runs when a NEW win happens

        if (currentGameMode === "shuffle") {
            incrementAchievementProgress("sandbox"); // Free Play (10 Shuffle Mode wins)
            loadAchievements();
        }

        if (currentGameMode === "custom") {
            incrementAchievementProgress("notepad"); // Blank Page (10 Custom Mode wins)
            loadAchievements();
        }

        if (currentGameMode === "archive") {
            let bestScoreKey = `archive_bestScore_${selectedArchiveDate}`;
            let previousBest = localStorage.getItem(bestScoreKey) || Infinity;
            if (totalCharactersUsed < previousBest) {
                localStorage.setItem(bestScoreKey, totalCharactersUsed);
            }
            localStorage.setItem(`archive_completed_${selectedArchiveDate}`, true);

            updateArchivistAchievementProgress();
        }        

        if (currentGameMode === "daily") {
            // Retrieve the raw puzzle date from localStorage
            const puzzleDateRaw = localStorage.getItem("puzzleDate");
            // Convert it to ISO format (YYYY-MM-DD) using your formatDateString helper
            const puzzleDate = formatDateString(puzzleDateRaw);
            
            // Build the archive keys with the ISO formatted date
            const archiveScoreKey = `archive_bestScore_${puzzleDate}`;
            const previousBest = Number(localStorage.getItem(archiveScoreKey)) || Infinity;
            if (totalCharactersUsed < previousBest) {
              localStorage.setItem(archiveScoreKey, totalCharactersUsed);
            }
            localStorage.setItem(`archive_completed_${puzzleDate}`, true);

            let storedClues = JSON.parse(localStorage.getItem("playerClues")) || { clues: [] };
            let totalCluesUsed = storedClues.clues.length;
          
            incrementAchievementProgress("cupcake"); // Baker’s Dozen (13 wins)
            incrementAchievementProgress("luxury");  // Hundredfold Prestige (100 wins)

            if (totalCharactersUsed <= 3) {
                incrementAchievementProgress("terminal"); // C:\\ (Win with a 3-character clue)
            }

            if (totalCluesUsed === 5) {
                incrementAchievementProgress("billiards"); // Corner Pocket (Win with 5th clue)
            }

            if (confidence >= 95) {
                incrementAchievementProgress("fishbowl"); // Crystal Clear (95%+ AI confidence)
            }

            if (confidence < 30) {
                incrementAchievementProgress("blizzard"); // Thin Ice (below 30% AI confidence)
            }

            if (searchSpace === 1) {
                incrementAchievementProgress("volcano"); // Smoldering Precision (Search Space = 1)
            }

            if (searchSpace === confidence) {
                incrementAchievementProgress("eclipse"); // Totality (Confidence and Search Space are equal)
            }

            const now = new Date();
            if (now.getHours() === 23 && now.getMinutes() >= 55) {
                incrementAchievementProgress("neowave"); // Last Call (Win within 5 minutes of midnight)
            }

            // Track Consecutive Wins
            trackConsecutiveWins();
        }
    }

    document.getElementById("game-card").classList.add("flipped");
    avatarImage.src = "emotions/victory.png";

    const messageIndex = Math.min(Math.floor(totalCharactersUsed / 5), victoryMessages.length - 1);
    const attemptMessage = victoryMessages[messageIndex] || "Well done!";
    const funFact = dailyPuzzle.funFact || "No fun fact available.";

    const victoryHTML = `
        <p class="specialwords" style="font-size: 1.25rem; font-weight: bold; color: var(--text-color); margin: 0;">
            ${attemptMessage}
        </p>
        <p style="font-size: .9rem; margin: 5px 0; color: var(--text-color); width: 85%;">
            ${funFact}
        </p>`;

    displayResult(victoryHTML);
    endGame();

    if (currentGameMode === "daily") {
        shareButton.classList.remove("hidden");
        shareButton.onclick = () => shareResult(dailyPuzzle.word, totalCharactersUsed);
        updateCluePlaceholder(2);
    } else {
        shareButton.classList.add("hidden");
        updateCluePlaceholder(4);
    }

    loadBestAttempt();
    loadLeaderboard();
}

function handleLoss() {
    // Flip game card to show loss message
    document.getElementById("game-card").classList.add("flipped");

    // Update avatar to sad expression
    avatarImage.src = "emotions/sad.png";

    const lossMessage = `
        <p class="specialwords" style="font-size: 1.5rem; font-weight: bold; color: var(--text-color); margin: 0;">
            Game Over.
        </p>
        <p style="font-size: 1rem; margin: 10px 0; color: var(--text-color); width: 75%;">
            Thank you for playing. Try again tomorrow!
        </p>
    `;

    updateCluePlaceholder(3);

    displayResult(lossMessage);

    if (currentGameMode === 'daily') {
        // Reset Streak Data
        localStorage.removeItem("winStreak");
        localStorage.removeItem("lastWinDate");

        console.log("Streak Reset: User lost in Daily Mode.");

        // Update Streak Display
        updateStreakDisplay();
    }

    // Update Achievements UI immediately
    loadAchievements();

    // End the game session
    endGame();
}

function trackConsecutiveWins() {
    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];

    const lastWinDate = localStorage.getItem("lastWinDate") || null;
    let winStreak = parseInt(localStorage.getItem("winStreak"), 10) || 0;

    if (lastWinDate) {
        const lastDate = new Date(lastWinDate);
        const differenceInDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        if (differenceInDays === 1) {
            winStreak++; // Consecutive win
        } else if (differenceInDays > 1) {
            winStreak = 1; // Streak reset
        }
    } else {
        winStreak = 1; // First win
    }

    localStorage.setItem("winStreak", winStreak);
    localStorage.setItem("lastWinDate", todayDate);

    console.log(`Consecutive Win Streak: ${winStreak} days`);

    // Update Streak Display
    updateStreakDisplay();

    if (winStreak <= 7) {
        incrementAchievementProgress("verdant");
    }
}

function resetGameState() {
    console.log("Resetting game state...");

    // Clear previous clues and AI messages
    previousClues = [];
    previousAIGuesses = [];

    let clueLog = document.getElementById("clue-log");
    let userClueLog = document.getElementById("user-clue-log");

    if (clueLog) clueLog.innerHTML = "";
    if (userClueLog) userClueLog.innerHTML = "";

    // Reset attempts UI if not in shuffle mode
    if (currentGameMode === "daily") {
        document.querySelector(".attempts-gauge").style.display = "flex";
        document.getElementById("clue-log").style.display = "flex";
        document.getElementById("user-clue-log").style.display = "flex";
        document.body.classList.remove("shuffle-active");
    } else {
        document.body.classList.add("shuffle-active");
    }

    if (currentGameMode === "shuffle" || currentGameMode === "custom" || currentGameMode === "archive") {
        document.body.classList.add("altmode-active");
        
        attemptsRemaining = 9999; // Large enough to feel unlimited
        updateAttemptsGauge();
        localStorage.setItem("attemptsRemaining", attemptsRemaining);

        avatarImage.src = "emotions/happy.png";
        
        // Update UI to display the infinity symbol
        document.querySelector(".attempts-text").textContent = "∞";
    }
    
    // Ensure AI greeting element exists
    let aiEntry = document.querySelector(".clue-log .chat-entry.ai");
    if (!aiEntry) {
        aiEntry = document.createElement('div');
        aiEntry.classList.add('chat-entry', 'ai');

        const aiMessage = document.createElement('p');
        aiMessage.classList.add('prompt');
        aiEntry.appendChild(aiMessage);
        clueLog.appendChild(aiEntry);
    }

    console.log("Calling setGreeting...");
    setGreeting();

}

function endGame() {
    // Disable user input and submission to prevent further interaction
    clueInput.disabled = true;
    submitClueButton.disabled = true;

    // Reset gauges to default values
    updateCharacterGauge(0);
}

// ALTERNATIVE GAME MODE HANDLING
// Shuffle, Custom, Archive, etc.

function handleCustomGameStart() {

    document.body.classList.add("altmode-active");
    currentGameMode = "custom"

    startNewAttempt();

    const customWordInput = document.getElementById("custom-word");
    const customFactInput = document.getElementById("custom-funfact");

    // Hide Clue Log and Attempts Gauge
    document.getElementById("past-clues").style.display = "none";

    let customWord = customWordInput.value.trim();
    const customFact = customFactInput.value.trim();

    if (!validateCustomWord(customWord)) return;

    customWord = formatCustomWord(customWord);

    dailyPuzzle = {
        word: customWord,
        funFact: customFact || "Congratulations!"
    };

    greetingHelp = customWord;
    dailyWordDisplay.textContent = customWord;

    // Hide custom game section with transition effects
    customGameSection.classList.remove("animation-visible");
    customGameSection.classList.add("animation-hidden");

    // Wait a moment before hiding the custom game section
    setTimeout(() => {
        customGameSection.classList.add("hidden");

        // Reset gauges to default values
        updateCharacterGauge(25);
        updateConfidenceBar(0);
        document.querySelector(".search-space-text").textContent = "100";
        document.querySelector(".search-space-fill").style.strokeDashoffset = "251.2"; // Full empty circle   
    }, 400);

    // Restore the main game UI
    showGameContainer();

    resetGameState();
}

function validateCustomWord(word) {
    if (!word) {
        alert("Please enter a word.");
        return false;
    }
    if (word.includes(" ")) {
        alert("Your entry cannot contain spaces. Please enter a single word.");
        return false;
    }
    return true;
}

function formatCustomWord(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

async function loadArchivePuzzle(date) {
    console.log("Attempting to load archive puzzle for:", date);

    archiveDayMenu.classList.remove("hidden", "animation-visible");
    archiveDayMenu.classList.add("animation-hidden");
    setTimeout(() => {
        archiveDayMenu.classList.add("hidden");
        showGameContainer();
    }, 400);

    currentGameMode = "archive";
    selectedArchiveDate = date;

    startNewAttempt();
    updateCluePlaceholder(1);
    updateCharacterGauge(25);
    updateConfidenceBar(0);
    document.querySelector(".search-space-text").textContent = "100";
    document.querySelector(".search-space-fill").style.strokeDashoffset = "251.2";

    let storedPuzzle = localStorage.getItem(`archive_${date}`);

    if (!storedPuzzle) {
        console.warn("Puzzle not found in localStorage. Attempting to fetch...");
        
        // Fetch from JSON as a fallback
        const allPuzzles = await fetchPastPuzzles();
        console.log("Retrieved puzzles:", allPuzzles);

        storedPuzzle = allPuzzles.find(puzzle => {
            const formattedPuzzleDate = formatDateString(puzzle.date);
            console.log(`Checking puzzle: ${puzzle.date} → Formatted: ${formattedPuzzleDate}`);
            return formattedPuzzleDate === date;
        });

        if (!storedPuzzle) {
            console.error("Puzzle not found for this date:", date);
            alert("Puzzle not available for this date.");
            return;
        }

        // Store the puzzle in LocalStorage for future access
        localStorage.setItem(`archive_${date}`, JSON.stringify(storedPuzzle));
    } else {
        storedPuzzle = JSON.parse(storedPuzzle);
    }

    console.log("Puzzle successfully loaded:", storedPuzzle);

    dailyPuzzle = storedPuzzle;
    dailyWordDisplay.textContent = dailyPuzzle.word;
    greetingHelp = dailyPuzzle.word;
    resetGameState();

    document.body.classList.add("altmode-active");
    showGameContainer();
}

async function populateArchiveMenu() {
    const monthList = document.getElementById("month-list");
    monthList.innerHTML = "";

    const allPuzzles = await fetchPastPuzzles();
    const months = new Set();

    allPuzzles.forEach(puzzle => {
        if (!puzzle.date) return;

        const formattedDate = formatDateString(puzzle.date);
        if (!formattedDate) return;

        const dateParts = formattedDate.split("-");
        if (dateParts.length === 3) {
            const year = dateParts[0];
            const month = dateParts[1];

            if (!isNaN(year) && !isNaN(month)) {
                months.add(`${year}-${month}`);
            }
        }
    });

    const sortedMonths = [...months].sort((a, b) => new Date(`${a}-01`) - new Date(`${b}-01`));

    sortedMonths.forEach(month => {
        const button = document.createElement("button");
        button.classList.add("nav-button");

        const monthIndex = parseInt(month.split("-")[1], 10) - 1;
        const monthName = new Date(new Date().getFullYear(), monthIndex).toLocaleDateString("en-US", { month: "long", year: "numeric" });

        button.textContent = monthName;
        button.onclick = () => populateDayMenu(month, allPuzzles);
        monthList.appendChild(button);
    });
}

function populateDayMenu(month, allPuzzles) {
    console.log("populateDayMenu called for:", month);

    const dayList = document.getElementById("day-list");
    dayList.innerHTML = "";
    document.getElementById("selected-month-title").textContent = new Date(`${month}-02`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const uniquePuzzles = new Map();

    allPuzzles.forEach(puzzle => {
        const formattedDate = formatDateString(puzzle.date);
        if (!formattedDate) return;

        if (formattedDate.startsWith(month) && !uniquePuzzles.has(formattedDate)) {
            uniquePuzzles.set(formattedDate, puzzle);
        }
    });

    const sortedPuzzles = Array.from(uniquePuzzles.values()).sort((a, b) => {
        return new Date(a.formattedDate) - new Date(b.formattedDate);
    });

    console.log("Filtered & Unique month puzzles:", sortedPuzzles);

    if (sortedPuzzles.length === 0) {
        console.warn("No puzzles found for month:", month);
    }

    sortedPuzzles.forEach(puzzle => {
        const date = puzzle.formattedDate;
        if (!date) {
            console.warn("Skipping puzzle with missing formattedDate:", puzzle);
            return;
        }

        const word = puzzle.word || "Unknown";  
        let bestScore = localStorage.getItem(`archive_bestScore_${date}`) || ""; 

        const button = document.createElement("button");
        button.classList.add("nav-button");

        let completed = localStorage.getItem(`archive_completed_${date}`);

        button.innerHTML = 
            `<strong style="font-weight: 100;">${date.split("-")[2]}</strong>
            <br>
            <span style="font-size: .75rem">${word}<br><span style="font-weight: 100;">
            ${completed ? bestScore + " characters" : "<br>"}</span></span>`;

        button.style.background = completed ? "var(--winningBubble)" : ""; 
        button.style.color = completed ? "var(--winningTextColor)" : ""; 

        button.onclick = () => loadArchivePuzzle(date);
        dayList.appendChild(button);
    });

    console.log("Total buttons created:", dayList.children.length);

    archiveMenu.classList.add("hidden");
    archiveDayMenu.classList.remove("hidden", "animation-hidden");
    archiveDayMenu.classList.add("animation-visible");

    setTimeout(() => {
        archiveMenu.classList.add("hidden");
    }, 400);
}

async function fetchPastPuzzles() {
    try {
        const response = await fetch('./puzzles/puzzles.json');
        const puzzlesData = await response.json();
        const allPuzzles = puzzlesData.puzzles;

        // Normalize today's date
        const today = new Date();
        today.setDate(today.getDate() - 1);
        today.setHours(0, 0, 0, 0);
        const todayFormatted = formatDateString(today.toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "long", 
            day: "2-digit" 
        }));

        const uniquePuzzles = new Map();

        // Process puzzles from JSON
        allPuzzles.forEach(puzzle => {
            const formattedDate = formatDateString(puzzle.date);
            if (!formattedDate) return;

            const puzzleDate = new Date(formattedDate);
            puzzleDate.setHours(0, 0, 0, 0);

            // Ensure only past puzzles are included
            if (puzzleDate >= today) return;

            uniquePuzzles.set(formattedDate, { ...puzzle, formattedDate });
        });

        // Process puzzles stored in localStorage
        Object.keys(localStorage).forEach(key => {
            if (!key.startsWith("archive_")) return;
            
            const storedPuzzle = JSON.parse(localStorage.getItem(key));
            const formattedDate = formatDateString(storedPuzzle.date);
            if (!formattedDate) return;

            const puzzleDate = new Date(formattedDate);
            puzzleDate.setHours(0, 0, 0, 0);

            // Ensure only past puzzles are included
            if (puzzleDate >= today) return;

            uniquePuzzles.set(formattedDate, { ...storedPuzzle, formattedDate });
        });

        return Array.from(uniquePuzzles.values()); // Convert back to array
    } catch (error) {
        console.error("Error loading past puzzles:", error);
        return [];
    }
}

function formatDateString(dateString) {
    if (!dateString || typeof dateString !== "string") {
        if (!formatDateString.loggedError) { // Log only once per session
            console.error(`Warning: Some puzzles are missing a valid date. Example bad value:`, dateString);
            formatDateString.loggedError = true; // Prevent further logs
        }
        return null;
    }

    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }

    // Handle "Month DD, YYYY" format (e.g., "February 2, 2025")
    const months = {
        "January": "01", "February": "02", "March": "03",
        "April": "04", "May": "05", "June": "06",
        "July": "07", "August": "08", "September": "09",
        "October": "10", "November": "11", "December": "12"
    };

    const dateParts = dateString.split(" ");
    if (dateParts.length !== 3) {
        if (!formatDateString.loggedError) {
            console.error(`Unexpected date format detected:`, dateString);
            formatDateString.loggedError = true;
        }
        return null;
    }

    const month = months[dateParts[0]];
    const day = dateParts[1].replace(",", "").padStart(2, "0");
    const year = dateParts[2];

    if (!month || isNaN(day) || isNaN(year)) {
        if (!formatDateString.loggedError) {
            console.error(`Invalid date components detected:`, dateString);
            formatDateString.loggedError = true;
        }
        return null;
    }

    return `${year}-${month}-${day}`; // Returns "YYYY-MM-DD"
}

formatDateString.loggedError = false;

// UI VISIBILITY AND NAVIGATION
// These functions show/hide different UI components.

function hideGameContainer() {
    // Hide the main game container and related UI sections
    gameContainer.classList.add("hidden");
    header.classList.add("hidden");
    leftSidebar.classList.add("hidden");
    rightSidebar.classList.add("hidden");
}

function showGameContainer() {
    // Reveal the main game container and related UI sections
    setTimeout(() => {
        header.classList.remove("hidden");
        gameContainer.classList.remove("hidden");
        leftSidebar.classList.remove("hidden");
        rightSidebar.classList.remove("hidden");
    }, 400);
}

function toggleSubmitButton() {
    // Trim input value and check if it's empty or contains invalid substrings
    const clueText = clueInput.value.trim();
    const isEmpty = clueText.length === 0;

    // Ensure character limit is applied
    clueInput.maxLength = charLimit;

    // Disable submit button if input is empty
    submitClueButton.disabled = isEmpty;
}

function displayResult(message) {
    // Update result message display
    resultMessage.innerHTML = message;
}

function setGreeting() {
    const greetingElement = document.querySelector(".clue-log .chat-entry.ai:first-child");
    const promptElement = greetingElement?.querySelector(".prompt");

    if (!greetingElement || !promptElement) {
        console.warn("Greeting element or prompt element not found.");
        return;
    }

    let greetingPool;
    const bestAttemptWord = localStorage.getItem("bestAttemptWord");
    const currentWord = localStorage.getItem("dailyPuzzle") 
        ? JSON.parse(localStorage.getItem("dailyPuzzle")).word 
        : null;

    if (bestAttemptWord && bestAttemptWord.toLowerCase() === currentWord.toLowerCase() && currentGameMode === 'daily') {
        // If the user has already won, use winnerGreetings
        greetingPool = winnerGreetings;
    } else if (currentGameMode === "daily" && attemptsRemaining <= 0) {
        // If out of attempts, use outOfAttemptsDailyGreetings
        greetingPool = loserGreetings;
    } else {
        // Otherwise, use the normal greeting pools
        switch (currentGameMode) {
            case "shuffle":
                greetingPool = shuffleGreetings;
                break;
            case "custom":
                greetingPool = customGreetings;
                break;
            case "archive":
                greetingPool = archiveGreetings;
                break;
            default:
                greetingPool = greetings;
        }
    }

    // Ensure there's at least one greeting to choose from
    if (!greetingPool || greetingPool.length === 0) {
        console.warn("Greeting pool is empty. Falling back to default greetings.");
        greetingPool = greetings;
    }

    // Pick a random greeting
    let randomGreeting = greetingPool[Math.floor(Math.random() * greetingPool.length)];

    if (randomGreeting.includes("{word}")) {
        randomGreeting = randomGreeting.replace("{word}", greetingHelp);
    }

    // Fade in the greeting smoothly
    greetingElement.style.visibility = "hidden";
    greetingElement.style.opacity = "0";

    setTimeout(() => {
        greetingElement.style.visibility = "visible";
        greetingElement.style.opacity = "1";
        typeWriterEffect(randomGreeting, promptElement);
    }, 50);
}

function startInactivityTimer() {
    if (gameOver) return;

    // Reset existing inactivity timer
    clearTimeout(inactivityTimer);

    // Set timer to change avatar to "sleepy" after 30 seconds of inactivity
    inactivityTimer = setTimeout(() => {
        if (!gameOver) {
            avatarImage.src = "emotions/sleepy.png";
        }
    }, 30000);
}

// GAME MECHANICS & PLAYER PROGRESS TRACKING
// Functions that manage clues, attempts, and player progress.

function updateCluePlaceholder(situation) {
    if (clueInput) {
        if (situation === 1) {
            clueInput.setAttribute("placeholder", "Enter your clue...");
        } else if (situation === 2) {
            clueInput.setAttribute("placeholder", "Play again tomorrow!");
        } else if (situation === 3) {
            clueInput.setAttribute("placeholder", "Try again tomorrow!");
        } else if (situation === 4) {
            clueInput.setAttribute("placeholder", "Nicely done! Play another?");
        } else {
            clueInput.setAttribute("placeholder", "Enter your clue...");
        }
    }
}

function updateClueLogMessage() {
    if (!userClueLog) return;

    // Retrieve stored clues from localStorage
    const storedData = JSON.parse(localStorage.getItem("playerClues"));
    console.log("Checking stored clues:", storedData);

    if (!storedData || !storedData.clues || storedData.clues.length === 0) {
        userClueLog.innerHTML = "<p class='clue-log-message'>Submit your first clue!</p>";
    } else {
        // Remove any existing placeholder message if clues exist
        const messageElement = document.querySelector(".clue-log-message");
        if (messageElement) messageElement.remove();
    }
}

function addClueToLocalStorage(clue) {

    if (currentGameMode !== 'daily') {
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const storedData = JSON.parse(localStorage.getItem("playerClues")) || {};

    // Reset stored clues if the date has changed
    if (storedData.date !== today) {
        storedData.date = today;
        storedData.clues = [];
    }

    // Add the new clue and update localStorage
    storedData.clues.push(clue);
    localStorage.setItem("playerClues", JSON.stringify(storedData));
    console.log("Clue added to storage:", storedData);

    // Update the UI to reflect the new clue
    updateClueLogMessage();
}

function loadStoredClues() {
    if (!userClueLog) return;

    // Retrieve stored clues from localStorage
    const storedData = JSON.parse(localStorage.getItem("playerClues"));
    console.log("Loading stored clues:", storedData);

    // Clear existing clue log
    userClueLog.innerHTML = "";

    if (storedData && storedData.clues.length > 0) {
        // Populate the clue log with stored clues
        storedData.clues.forEach(clue => {
            const clueLogEntry = document.createElement('p');
            clueLogEntry.classList.add("chat-entry", "user");
            clueLogEntry.textContent = clue;
            clueLogEntry.style.opacity = "0";

            userClueLog.appendChild(clueLogEntry);

            setTimeout(() => {
                clueLogEntry.style.visibility = "visible";
                clueLogEntry.style.opacity = "1";
                clueLogEntry.style.transition = "opacity 0.4s ease-in-out";
            }, 150);
        });
    }
}

function updateBestAttemptUI(word, characters) {
    // Update the UI with the best attempt details
    bestAttemptElement.innerHTML = `Today's Score (<span class="specialwords">${word.toUpperCase()}</span>):&nbsp;<strong> ${characters} characters</strong>`;
    bestAttemptElement.style.display = "flex";
}

function loadBestAttempt() {
    const bestAttemptKey = "bestCharacterScore";
    const storedBest = parseInt(localStorage.getItem(bestAttemptKey), 10);
    const storedWord = localStorage.getItem("bestAttemptWord");

    // Display the best attempt if valid data exists
    if (!isNaN(storedBest) && storedBest > 0 && storedWord) {
        updateBestAttemptUI(storedWord, storedBest);
    } else {
        // Hide the section if no valid best attempt is found
        bestAttemptElement.style.display = "none";
    }
}

function decrementAttempts() {
    if (attemptsRemaining > 0) {
        // Reduce attempt count and store updated value
        attemptsRemaining--;
        localStorage.setItem("attemptsRemaining", attemptsRemaining);
        updateAttemptsGauge();
    }

    // End the game if attempts reach zero
    if (attemptsRemaining <= 0) {
        if (currentGameMode === 'daily') {
            endGame();
        }
    }
}

// USER MANAGEMENT
// Handles player identity management. 

function handleUsernameSetup() {
    const storedUsername = localStorage.getItem("username");

    if (storedUsername) {
        usernameInput.value = storedUsername;
    } else {
        usernameInput.value = "guest" + Math.floor(10000 + Math.random() * 90000);
    }
}

// ACHIEVEMENTS
// Handles player Achievements

const achievements = [
        // Unlocks Dreamer
    { 
        id: "dreamer", 
        name: "Deep Thinker", 
        description: "Submit 100 clues in any game mode", 
        progress: 0, 
        goal: 100, 
        unlocked: false 
    },
        // Unlocks Cupcake
    { 
        id: "cupcake", 
        name: "Baker’s Dozen", 
        description: "Win 13 Daily Challenges", 
        progress: 0, 
        goal: 13, 
        unlocked: false 
    },
        // Unlocks Verdant
    { 
        id: "verdant", 
        name: "Trailblazer", 
        description: "Win 7 Daily Challenges in a row", 
        progress: 0, 
        goal: 7, 
        unlocked: false 
    },
        // Unlocks Sandbox
    { 
        id: "sandbox", 
        name: "Free Play", 
        description: "Win in Shuffle Mode 10 times", 
        progress: 0, 
        goal: 10, 
        unlocked: false 
    },
        // Unlocks Terminal
    { 
        id: "terminal", 
        name: "C:\\", 
        description: "Win a Daily Challenge with a 3-character clue", 
        progress: 0, 
        goal: 1, 
        unlocked: false 
    },
        // Unlocks Fishbowl
    { 
        id: "fishbowl", 
        name: "Crystal Clear", 
        description: "Win the Daily Challenge with AI Confidence at 95% or higher", 
        progress: 0, 
        goal: 1, 
        unlocked: false 
    },
        // Unlocks Blizzard
    { 
        id: "blizzard", 
        name: "Thin Ice", 
        description: "Win the Daily Challenge with the AI confidence below 30%", 
        progress: 0, 
        goal: 1, 
        unlocked: false 
    },
        // Unlocks Notepad
    { 
        id: "notepad", 
        name: "Blank Page", 
        description: "Win in Custom Mode 10 times", 
        progress: 0, 
        goal: 10, 
        unlocked: false 
    },
        // Unlocks Volcano
    { 
        id: "volcano", 
        name: "Smoldering Precision", 
        description: "Win a Daily Challenge with Search Space of 1", 
        progress: 0, 
        goal: 1, 
        unlocked: false 
    },
        // Unlocks Corner Pocket
    { 
        id: "billiards", 
        name: "Corner Pocket", 
        description: "Win a Daily Challenge on your last attempt", 
        progress: 0, 
        goal: 1, 
        unlocked: false 
    },
        // Unlocks Neowave
    { 
        id: "neowave", 
        name: "Last Call", 
        description: "Win a Daily Challenge within 5 minutes of midnight", 
        progress: 0, 
        goal: 1, 
        unlocked: false 
    },
        // Unlocks Eclipse
    { 
        id: "eclipse", 
        name: "Totality", 
        description: "Win the Daily Challenge with AI Confidence and Search Space at the same value", 
        progress: 0, 
        goal: 1, 
        unlocked: false 
    },
        // Unlocks Library
    {
        id: "library",
        name: "Archivist",
        description: "Complete 10 puzzles from the archive",
        progress: 0,
        goal: 10,
        unlocked: false
    },
        // Unlocks Luxury
    { 
        id: "luxury", 
        name: "Hundredfold Prestige", 
        description: "Win 100 Daily Challenges", 
        progress: 0, 
        goal: 100, 
        unlocked: false 
    },
];

function calculateArchivistProgress() {
    const storedKeys = Object.keys(localStorage);
    const archiveCompletionKeys = storedKeys.filter(key => key.startsWith('archive_completed_'));
    return archiveCompletionKeys.length;
}

function updateArchivistAchievementProgress() {
    const archivistAchievement = achievements.find(a => a.id === "library");
    if (!archivistAchievement || archivistAchievement.unlocked) return;

    archivistAchievement.progress = calculateArchivistProgress();

    if (archivistAchievement.progress >= archivistAchievement.goal && !archivistAchievement.unlocked) {
        unlockAchievement("library");
    }
    
    saveAchievements();
    updateAchievementsUI();
}

function loadAchievements() {
    let storedAchievements = JSON.parse(localStorage.getItem("achievements")) || [];
    let winStreak = parseInt(localStorage.getItem("winStreak"), 10) || 0;

    const archivistAchievement = achievements.find(ach => ach.id === "library");

    achievements.forEach((achievement) => {
        let storedAchievement = storedAchievements.find(a => a.id === achievement.id);
        if (storedAchievement) {
            achievement.progress = storedAchievement.progress;
            achievement.unlocked = storedAchievement.unlocked;
        }

        if (achievement.id === "verdant") {
            achievement.progress = winStreak;
        }

        if (archivistAchievement && !archivistAchievement.unlocked) {
            archivistAchievement.progress = calculateArchivistProgress();
            if (archivistAchievement.progress >= archivistAchievement.goal) {
                archivistAchievement.unlocked = true;
                unlockAchievement("library");
            }
        }
    });

    localStorage.setItem("achievements", JSON.stringify(achievements));
    updateAchievementsUI();
}

function updateStreakDisplay() {
    const streakDisplay = document.getElementById("streak-display");
    const winStreak = parseInt(localStorage.getItem("winStreak"), 10) || 0;

    if (winStreak >= 2) { 
        streakDisplay.textContent = `Current Streak: ${winStreak} days 🔥`;
        streakDisplay.classList.remove("hidden");
    } else {
        streakDisplay.classList.add("hidden"); // Hide if no streak
    }
}

function saveAchievements() {
    localStorage.setItem("achievements", JSON.stringify(achievements));
}

function incrementAchievementProgress(id, amount = 1) {
    let storedAchievements = JSON.parse(localStorage.getItem("achievements")) || achievements;

    const achievement = storedAchievements.find(ach => ach.id === id);
    if (!achievement || achievement.unlocked) return;

    achievement.progress += amount;

    // If the progress meets or exceeds the goal, unlock it
    if (achievement.progress >= achievement.goal) {
        achievement.unlocked = true;
        unlockAchievement(id);
    }

    // Save updated achievements
    localStorage.setItem("achievements", JSON.stringify(storedAchievements));
}

function updateAchievementsUI() {
    const grid = document.querySelector(".achievements-grid");

    achievements.forEach(ach => {
        let existingDiv = document.querySelector(`.achievement[data-id="${ach.id}"]`);

        if (!existingDiv) {
            existingDiv = document.createElement("div");
            existingDiv.classList.add("achievement");
            existingDiv.setAttribute("data-id", ach.id);
            grid.appendChild(existingDiv);
        }

        if (ach.unlocked) {
            // Mark this achievement as unlocked
            existingDiv.classList.add("unlocked");
            existingDiv.classList.remove("locked");
          
            // Also add a unique class based on its ID
            existingDiv.classList.add(`unlocked-${ach.id}`);
        } else {
            // Mark it as locked
            existingDiv.classList.add("locked");
            existingDiv.classList.remove("unlocked");
          
            // Remove any leftover “unlocked-{id}” class
            existingDiv.classList.remove(`unlocked-${ach.id}`);
        }          

        // Calculate progress percentage
        const progressPercentage = Math.min((ach.progress / ach.goal) * 100, 100);

        // Only show progress bar if the achievement is NOT unlocked
        const progressHTML = !ach.unlocked
            ? `<div class="achievement-progress-bar">
                   <div class="progress-fill" style="width: ${progressPercentage}%"></div>
               </div>
               <p class="progress-text">${ach.progress}/${ach.goal}</p>`
            : ""; // If unlocked, leave this empty (no progress bar)

        // Update UI
        existingDiv.innerHTML = `
            <h4>${ach.name}</h4>
            <small>${ach.description}</small>
            ${progressHTML}
        `;
    });
}

function unlockAchievement(id) {
    let storedAchievements = JSON.parse(localStorage.getItem("achievements")) || [];
    
    let achievement = storedAchievements.find(ach => ach.id === id);
    let memoryAchievement = achievements.find(ach => ach.id === id);

    if (!achievement || achievement.unlocked) return;

    // Mark as unlocked in BOTH storedAchievements and achievements
    achievement.unlocked = true;
    memoryAchievement.unlocked = true;

    console.log(`Achievement Unlocked: ${achievement.name}!`);

    // Save updated achievements back to localStorage
    localStorage.setItem("achievements", JSON.stringify(storedAchievements));

    // Ensure UI updates correctly
    updateAchievementsUI();

    // Immediately unlock the related theme
    checkThemeUnlocks();
    checkAndDisableLockedThemes();

    alert(`Achievement Unlocked: ${achievement.name}!`);
}

function updateAchievementProgress(id, amount = 1) {
    const achievement = achievements.find(ach => ach.id === id);
    if (achievement && !achievement.unlocked) {
        achievement.progress += amount;
        if (achievement.progress >= achievement.goal) {
            unlockAchievement(id);
        }
        saveAchievements();
    }
}

function checkThemeUnlocks() {
    const themeDescriptions = {
        dreamer: "A surreal, dreamy space. Allow your thoughts to flow freely.",
        cupcake: "Sweet, pastel, filled with sprinkles, and topped with chocolate ganache.",
        verdant: "Deep opulent greens with gold accents. Simple and clean.",
        sandbox: "Beachy vibes. Guide the AI with your toes in the sand.",
        terminal: "A vintage computer terminal. The AI will feel right at home.",
        fishbowl: "A sea of soft blues and playful orange hues.",
        blizzard: "Light snowfall is in the forecast. I hope you're wearing layers.",
        notepad: "A blank slate for your most creative clues.",
        volcano: "Erupting with fiery intensity — every clue matters.",
        billiards: "Rack 'em up, aim smart, and pocket the win!",
        neowave: "?!?!?!",
        eclipse: "Brilliant revelations around every corner.",
        library: "A sophisticated, vintage library theme. Elegant, dark academia vibes.",
        luxury: "Gilded in elegance. Refine your clues to perfection."
    };

    document.querySelectorAll(".theme-box").forEach(themeBox => {
        const button = themeBox.querySelector(".theme-button");
        const description = themeBox.querySelector(".theme-desc");
        const theme = button.dataset.theme;
        
        if (checkIfThemeUnlocked(theme)) {
            button.disabled = false;
            if (themeDescriptions[theme]) {
                description.textContent = themeDescriptions[theme]; // Update text when unlocked
            }
        }
    });
}

// AI GUESS HANDLING
// Handles AI processing, animations, and responses.

function addChatEntry(sender, message) {
    const aiEntry = document.getElementById('ai');
    const userClueLog = document.getElementById('user-clue-log');

    const messageElement = document.createElement('p');
    messageElement.style.margin = "0";

    if (sender === "user") {
        // Log the user's clue in the separate clue history section
        if (userClueLog) {
            const clueLogEntry = document.createElement('p');
            clueLogEntry.classList.add("chat-entry", "user");
            clueLogEntry.textContent = message;
            clueLogEntry.style.opacity = "0";

            userClueLog.appendChild(clueLogEntry);

            setTimeout(() => {
                clueLogEntry.style.visibility = "visible";
                clueLogEntry.style.opacity = "1";
                clueLogEntry.style.transition = "opacity 0.4s ease-in-out";
            }, 150);
        }
    } else if (sender === "ai") {
        if (aiEntry) {
            // Clear previous AI response and insert new message
            aiEntry.innerHTML = "";
            aiEntry.appendChild(messageElement);

            // Temporarily hide the AI entry before revealing it
            aiEntry.style.visibility = "hidden";
            aiEntry.style.opacity = "0";

            typeWriterEffect(message, messageElement, () => {
                aiEntry.style.transition = "opacity 0.4s ease-in-out";
                aiEntry.style.visibility = "visible";
                aiEntry.style.opacity = "1";
            });
        }
    }
}

async function getAIGuess(clue, previousAIGuesses, previousClues) {
    try {
        // Send user clue and game history to AI API
        const response = await fetch('https://ewrn400smd.execute-api.us-east-1.amazonaws.com/guess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clue, previousAIGuesses, previousClues }),
        });

        // Handle unsuccessful API responses
        if (!response.ok) {
            console.error("API returned an error:", response.status, response.statusText);
            return null;
        }

        // Parse and return AI's response
        const text = await response.text();
        return JSON.parse(text);

    } catch (error) {
        console.error("Error with AI guess:", error);
        return null;
    }
}

function typeWriterEffect(text, element, callback = null, speed = 30, breakPause = 500) {
    // Create a temporary container to hold the text with any HTML formatting
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = text;
    
    // Convert the container’s child nodes into an array for sequential processing
    const nodes = [...tempContainer.childNodes];

    function typeNode(node, parent) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Handle plain text characters one by one
            let textContent = node.textContent;
            let j = 0;

            function typeChar() {
                if (j < textContent.length) {
                    parent.innerHTML += textContent.charAt(j); // Append character
                    j++;
                    setTimeout(typeChar, speed); // Delay for typing effect
                } else {
                    typeNextNode(); // Move to the next node after completing the text
                }
            }

            typeChar();
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "BR") {
                // If the element is a line break, insert it and add a brief pause
                parent.appendChild(document.createElement("br"));
                setTimeout(typeNextNode, breakPause);
            } else {
                // Preserve element formatting (e.g., <strong>, <span>, etc.)
                let newElement = document.createElement(node.tagName);
                
                // Copy attributes (e.g., class names, styles)
                for (let attr of node.attributes) {
                    newElement.setAttribute(attr.name, attr.value);
                }
                
                parent.appendChild(newElement);
                
                // Process the element's child nodes
                typeNode(node.firstChild, newElement);
            }
        }
    }

    function typeNextNode() {
        if (nodes.length > 0) {
            // Process the next node in sequence
            typeNode(nodes.shift(), element);
        } else if (callback) {
            // Execute callback function once the effect is completed
            callback();
        }
    }

    // Start the typing effect
    typeNextNode();
}

// SCORE AND LEADERBOARD MANAGEMENT
// Functions that track and update player scores.

async function submitScore(username, score, clue) {
    // Validate username
    if (!username || typeof username !== "string") {
        console.error("Invalid username provided:", username);
        alert("Invalid username. Please enter a valid name.");
        return;
    }

    // Ensure score is a valid number
    if (isNaN(score) || score < 0) {
        console.error("Invalid score provided:", score);
        alert("Invalid score. Please try again.");
        return;
    }

    console.log("Submitting score:", { player_id: username, username, score });

    try {
        const response = await fetch("https://xrwraeaoa5.execute-api.us-east-1.amazonaws.com/submit-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                player_id: username.toString(),
                username: username.toString(),
                clue: clue || "Unknown",
                score: Number(score)
            }),
        });

        // Parse API response
        const result = await response.json();
        console.log("API Response:", result);

        if (!response.ok) {
            console.error("Score submission failed:", result);
            return;
        }

        // Refresh leaderboard after successful submission
        loadLeaderboard();

    } catch (error) {
        console.error("Error submitting score:", error);
        alert("An error occurred while submitting your score. Please try again.");
    }
}

async function loadLeaderboard() {
    try {
        const username = localStorage.getItem("username") || "guest";
        const response = await fetch(`https://xrwraeaoa5.execute-api.us-east-1.amazonaws.com/leaderboard?player_id=${username}`);
        const data = await response.json();
        const leaderboardElement = document.getElementById("leaderboard");

        // Clear existing leaderboard content
        leaderboardElement.innerHTML = "";

        // Display a message if no scores are available
        if (!data.length) {
            leaderboardElement.innerHTML = "<h2>Be the first to play!</h2>";
            return;
        }

        // Sort scores from lowest to highest
        data.sort((a, b) => a.score - b.score);

        // Limit displayed entries to the top 100
        const topEntries = data.slice(0, 100);
        const topScore = topEntries[0].score;
        let currentRank = 1;

        const currentUser = localStorage.getItem("username");

        // Loop through the sorted entries
        topEntries.forEach((entry, i) => {
            if (i === 0) {
                currentRank = 1;
            } else {
                // If the score is the same as the previous, keep the same rank
                // Otherwise, set the rank to (current index + 1)
                if (entry.score !== topEntries[i - 1].score) {
                    currentRank = i + 1;
                }
            }

            const row = document.createElement("div");
            row.classList.add("leaderboard-entry");

            // Apply top-scorer class to all entries with the top score
            if (entry.score === topScore) {
                row.classList.add("top-scorer");
            }

            const scoreText = entry.score === 1 ? "char" : "chars";
            row.innerHTML = `
                <span class="rank">#${currentRank}</span>
                <span class="score">${entry.score} ${scoreText}</span>
                <span class="name">${entry.username}</span>
                <span class="clue">${entry.clue.toLowerCase()}</span> 
            `;


            if (currentUser && entry.username.toLowerCase() === currentUser.toLowerCase()) {
                const nameElement = row.querySelector(".name");
                nameElement.classList.add("specialwords", "you");
                nameElement.textContent += " (you)"; // Append "(you)" to the user's name
            }

            leaderboardElement.appendChild(row);
        });
    } catch (error) {
        console.error("Failed to load leaderboard:", error);
        document.getElementById("leaderboard").innerHTML = "<p>Error loading leaderboard.</p>";
    }
}

function shareResult(word, characters) {
    // Construct the share message
    let characterLength = characters

    if (!characterLength) {
        characterLength = localStorage.getItem("bestCharacterScore")
    }

    const shareText = 
    
    `I just solved today's EXPLAIN challenge using only ${characterLength} characters! Today's Daily Challenge is ${word.toUpperCase()} - can you beat my score?`;

    if (navigator.share) {
        // Use the Web Share API if supported
        navigator.share({
            title: "EXPLAIN - Daily AI Word Game",
            text: shareText,
            url: "https://expl41n.s3.us-east-1.amazonaws.com/index.html"
        }).catch(error => console.error("Error sharing:", error));
    } else {
        // Fallback: Copy to clipboard if Web Share API is unavailable
        navigator.clipboard.writeText(shareText)
            .then(() => alert("Your score has been copied to the clipboard! Share it with friends."))
            .catch(error => console.error("Error copying text:", error));
    }
}

// GAME METRICS & VISUAL FEEDBACK
// Functions that update visual indicators like confidence, attempts, and character limits.

function updateAvatar(confidence) {
    let avatar;

    if (confidence <= 10) {
        avatar = "angry";
    } else if (confidence <= 30) {
        avatar = "confused";
    } else if (confidence <= 50) {
        avatar = "suspicious";
    } else if (confidence <= 60) {
        avatar = "side-eye";
    } else if (confidence <= 80) {
        avatar = "happy";
    } else if (confidence <= 100) {
        avatar = "surprised";
    } else {
        avatar = "happy"; // Default fallback
    }

    avatarImage.src = `emotions/${avatar}.png`;
}

function getThemeGaugeColors() {
    return {
        low: getComputedStyle(document.body).getPropertyValue("--gauge-low").trim(),
        mid: getComputedStyle(document.body).getPropertyValue("--gauge-mid").trim(),
        high: getComputedStyle(document.body).getPropertyValue("--gauge-high").trim()
    };
}

function updateAttemptsGauge() {
    let attemptsFill = document.querySelector(".attempts-fill");
    let attemptsText = document.querySelector(".attempts-text");

    if (currentGameMode !== 'daily') {
        attemptsRemaining = "∞";
        attemptsText.textContent = "∞";
        attemptsFill.style.strokeDashoffset = 0;
        attemptsFill.style.stroke = getThemeGaugeColors().high; // Always full color in non-daily mode
        return;
    }

    const bestAttemptWord = localStorage.getItem("bestAttemptWord");
    const currentWord = localStorage.getItem("dailyPuzzle") 
        ? JSON.parse(localStorage.getItem("dailyPuzzle")).word 
        : null;

    // Prevent recalculating attempts if the user has already won
    if (bestAttemptWord && bestAttemptWord.toLowerCase() === currentWord.toLowerCase()) {
        attemptsRemaining = 0;
        attemptsText.textContent = "0";
        attemptsFill.style.strokeDashoffset = "251.2";
        return;
    }

    // Normal attempts calculation if the user hasn't won
    let attemptsStored = localStorage.getItem("attemptsRemaining");
    let playerCluesStored = localStorage.getItem("playerClues");

    // Ensure attemptsStored is a number
    attemptsRemaining = Number(attemptsStored);

    // Default to 5 if NaN, null, or greater than 5
    if (isNaN(attemptsRemaining) || attemptsRemaining > 5) {
        attemptsRemaining = 5;
    }

    // Parse stored player clues and count today's clues
    let cluesUsed = 0;
    if (playerCluesStored) {
        try {
            let parsedData = JSON.parse(playerCluesStored);
            let today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

            // Check if stored date matches today and count clues
            if (parsedData.date === today && Array.isArray(parsedData.clues)) {
                cluesUsed = parsedData.clues.length;
            }
        } catch (error) {
            console.error("Error parsing playerClues:", error);
        }
    }

    attemptsRemaining = Math.max(5 - cluesUsed, 0);
    localStorage.setItem("attemptsRemaining", attemptsRemaining);

    console.log("Updating Attempts Gauge... Current Attempts:", attemptsRemaining);

    const maxAttempts = 5;
    const fullCircle = 251.2;
    const newOffset = fullCircle - (attemptsRemaining / maxAttempts) * fullCircle;

    // Fetch theme-specific colors
    const { low, mid, high } = getThemeGaugeColors();

    // Assign color dynamically based on remaining attempts
    const color = attemptsRemaining > 3 ? high : 
                  attemptsRemaining > 1 ? mid : low;

    // Apply color and stroke offset
    attemptsFill.style.strokeDashoffset = newOffset;
    attemptsFill.style.stroke = color;
    attemptsText.textContent = attemptsRemaining;
}

function updateConfidenceBar(confidence) {
    const confidenceFill = document.querySelector(".confidence-fill");
    const confidenceText = document.querySelector(".confidence-text");

    const clampedConfidence = Math.max(0, Math.min(confidence, 100));
    const fullCircle = 251.2;
    const newOffset = fullCircle * (1 - clampedConfidence / 100);

    // Fetch theme-specific colors
    const { low, mid, high } = getThemeGaugeColors();

    // Assign color dynamically
    const color = clampedConfidence < 34 ? low : clampedConfidence < 67 ? mid : high;

    // Apply color and stroke offset
    confidenceFill.style.strokeDashoffset = newOffset;
    confidenceFill.style.stroke = color;
    confidenceText.textContent = `${clampedConfidence}%`;
}

function updateCharacterGauge(remaining) {
    const characterFill = document.querySelector(".character-fill");
    const characterText = document.querySelector(".character-text");

    const totalCharacters = 25;
    const used = totalCharacters - remaining;  // Calculate characters used
    const clampedRemaining = Math.max(remaining, 0);
    const fullCircle = 251.2;
    const newOffset = fullCircle * (1 - clampedRemaining / totalCharacters);

    // Fetch theme-specific colors
    const { low, mid, high } = getThemeGaugeColors();

    // Assign color dynamically
    const color = clampedRemaining > 10 ? high : clampedRemaining > 5 ? mid : low;

    // Apply color and stroke offset
    characterFill.style.strokeDashoffset = newOffset;
    characterFill.style.stroke = color;

    // Change display format to "used/25"
    characterText.textContent = `${used}/25`;
}

function updateSearchSpaceGauge(searchSpace) {
    const searchSpaceFill = document.querySelector(".search-space-fill");
    const searchSpaceText = document.querySelector(".search-space-text");

    const clampedSpace = Math.max(0, Math.min(searchSpace, 100));
    const fullCircle = 251.2;
    const newOffset = fullCircle * (clampedSpace / 100);

    // Fetch theme-specific colors
    const { low, mid, high } = getThemeGaugeColors();

    // Assign color dynamically
    const color = clampedSpace <= 20 ? high : 
                  clampedSpace <= 60 ? mid : low;

    // Apply color and stroke offset
    searchSpaceFill.style.strokeDashoffset = newOffset;
    searchSpaceFill.style.stroke = color;
    searchSpaceText.textContent = clampedSpace.toString();
}

function highlightSelectedTheme(selectedTheme) {
    themeButtons.forEach(button => {
        if (button.dataset.theme === selectedTheme) {
            button.classList.add("selected-theme");
        } else {
            button.classList.remove("selected-theme");
        }
    });
}

function checkIfThemeUnlocked(theme) {
    const storedAchievements = JSON.parse(localStorage.getItem("achievements")) || [];

    // Define which achievement unlocks each theme
    const themeUnlocks = {
        dreamer: "Deep Thinker",
        cupcake: "Baker’s Dozen",
        verdant: "Trailblazer",
        sandbox: "Free Play",
        terminal: "C:\\",
        fishbowl: "Crystal Clear",
        blizzard: "Thin Ice",
        notepad: "Blank Page",
        volcano: "Smoldering Precision",
        billiards: "Corner Pocket",
        neowave: "Last Call",
        eclipse: "Totality",
        library: "Archivist",
        luxury: "Hundredfold Prestige",
    };

    // Always unlocked theme (default)
    const alwaysAvailableThemes = ["galaxy"];

    // If the theme is always available, return true
    if (alwaysAvailableThemes.includes(theme)) {
        return true;
    }

    // Find the achievement that unlocks this theme
    const requiredAchievement = themeUnlocks[theme];

    // If no achievement is associated, return false
    if (!requiredAchievement) {
        return false;
    }

    // Check if the achievement is unlocked
    const achievement = storedAchievements.find(ach => ach.name === requiredAchievement);
    return achievement ? achievement.unlocked : false;
}

function checkAndDisableLockedThemes() {
    document.querySelectorAll(".theme-button").forEach(button => {
        const theme = button.dataset.theme;
        const isUnlocked = checkIfThemeUnlocked(theme);
        button.disabled = !isUnlocked; // Disable if not unlocked
    });
}

// AESTHETIC
// Handles the visual appearance of the game.

const particleColors = {
    galaxy: ["rgba(255, 255, 255, 0.8)"],
    terminal: ["rgba(51, 255, 51, 0.8)"],
    notepad: ["rgba(238, 138, 138, 0.4)"],
    fishbowl: [
        "rgba(173, 216, 230, 0.8)", 
        "rgba(135, 206, 250, 0.8)", 
        "rgba(0, 191, 255, 0.8)",   
        "rgba(255, 255, 255, 0.6)"  
    ],
    blizzard: [
        "rgba(240, 240, 240, 0.8)", 
        "rgba(220, 220, 220, 0.8)", 
        "rgba(176, 224, 230, 0.8)", 
        "rgba(255, 255, 255, 0.6)"  
    ],
    cupcake: [ 
        "rgba(255, 99, 71, 0.9)",   
        "rgba(255, 165, 0, 0.9)",   
        "rgba(255, 215, 0, 0.9)",   
        "rgba(144, 238, 144, 0.9)", 
        "rgba(173, 216, 230, 0.9)", 
        "rgba(238, 130, 238, 0.9)"  
    ],
    verdant: [
        "rgba(34, 139, 34, 0.8)",
        "rgba(154, 205, 50, 0.8)",
        "rgba(85, 107, 47, 0.8)" 
    ],
    luxury: [
        "rgba(255, 215, 0, 0.8)",
        "rgba(184, 134, 11, 0.8)",
        "rgba(139, 69, 19, 0.8)" 
    ],
    volcano: [
        "rgba(255, 69, 0, 0.8)", 
        "rgba(255, 140, 0, 0.8)",
        "rgba(139, 69, 19, 0.8)" 
    ],
    sandbox: [
        "rgba(255, 223, 128, 0.8)",
        "rgba(255, 99, 71, 0.8)", 
        "rgba(30, 144, 255, 0.8)" 
    ],
    neowave: [
        "rgba(255, 0, 255, 0.8)",
        "rgba(0, 255, 255, 0.8)",
        "rgba(255, 165, 0, 0.8)"
    ],
    eclipse: [
        "rgba(0, 0, 0, 0.8)",
    ],
    dreamer: [
        "rgba(255, 182, 193, 0.8)",
        "rgba(173, 216, 230, 0.8)",
        "rgba(238, 130, 238, 0.8)" 
    ],
    library: [
        "rgba(85, 60, 40, 1)",
    ]
};    

function initializeParticleEffect() {
    // Ensure any previous animation is canceled
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Remove any existing particle canvas
    if (particleCanvas) {
        particleCanvas.remove();
        particleCanvas = null;
    }

    // Clear existing particles array
    particles = [];

    // Create a new canvas for particles
    particleCanvas = document.createElement("canvas");
    particleCanvas.id = "particle-background";
    document.body.insertBefore(particleCanvas, document.body.firstChild);
    ctx = particleCanvas.getContext("2d");

    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;

    // Get the current theme
    const theme = localStorage.getItem("selectedTheme") || "galaxy";

    // Reinitialize the correct particle effect
    if (theme === "billiards") {
        console.log("Initializing Billiards Particles...");
        initializeBilliardsParticles();
    } else {
        console.log(`Initializing Standard Particles for Theme: ${theme}`);
        initializeStandardParticles(theme);
    }
}

function initializeBilliardsParticles() {
    const billiardBalls = [
        { color: "#FFFFFF", shadow: "#CCCCCC" },  // Cue Ball (White)
        { color: "#000000", shadow: "#222222" },  // Eight Ball (Black)
        { color: "#FFD700", shadow: "#B8860B" },  // Yellow
        { color: "#0000FF", shadow: "#00008B" },  // Blue
        { color: "#FF0000", shadow: "#8B0000" },  // Red
        { color: "#800080", shadow: "#4B0082" },  // Purple
        { color: "#FF8C00", shadow: "#8B4500" },  // Orange
        { color: "#008000", shadow: "#006400" },  // Green
        { color: "#8B0000", shadow: "#5C0000" }   // Maroon
    ];

    function createParticles() {
        particles = [];
        billiardBalls.forEach((ball, i) => {
            particles.push({
                x: (i % 3) * (particleCanvas.width / 3) + Math.random() * 50,
                y: Math.floor(i / 3) * (particleCanvas.height / 3) + Math.random() * 50,
                size: 15,
                speedX: ((Math.random() - 0.5) * 1.5),
                speedY: ((Math.random() - 0.5) * 1.5),
                color: ball.color,
                shadow: ball.shadow,
                angle: 0,
                prevX: 0,
                prevY: 0
            });
        });
    }

    function detectCollisions() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let p1 = particles[i];
                let p2 = particles[j];

                let dx = p2.x - p1.x;
                let dy = p2.y - p1.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let minDist = p1.size + p2.size;

                if (distance < minDist) {
                    let angle = Math.atan2(dy, dx);
                    let sin = Math.sin(angle);
                    let cos = Math.cos(angle);

                    let v1x = p1.speedX * cos + p1.speedY * sin;
                    let v1y = p1.speedY * cos - p1.speedX * sin;
                    let v2x = p2.speedX * cos + p2.speedY * sin;
                    let v2y = p2.speedY * cos - p2.speedX * sin;

                    let temp = v1x;
                    v1x = v2x;
                    v2x = temp;

                    p1.speedX = v1x * cos - v1y * sin;
                    p1.speedY = v1y * cos + v1x * sin;
                    p2.speedX = v2x * cos - v2y * sin;
                    p2.speedY = v2y * cos + v2x * sin;

                    let overlap = minDist - distance;
                    let adjustmentX = (overlap / 2) * Math.cos(angle);
                    let adjustmentY = (overlap / 2) * Math.sin(angle);
                    p1.x -= adjustmentX;
                    p1.y -= adjustmentY;
                    p2.x += adjustmentX;
                    p2.y += adjustmentY;
                }
            }
        }
    }

    function handleWallCollisions(p) {
        let boundaryPadding = 0; // Buffer zone to trigger bounce

        // Bounce off the **left & right** walls if within 10px
        if (p.x > particleCanvas.width - p.size - boundaryPadding) {
            p.x = particleCanvas.width - p.size - boundaryPadding;
            p.speedX *= -1; // Reverse direction
        } else if (p.x < p.size + boundaryPadding) {
            p.x = p.size + boundaryPadding;
            p.speedX *= -1;
        }

        // Bounce off the **top & bottom** walls if within 10px
        if (p.y > particleCanvas.height - p.size - boundaryPadding) {
            p.y = particleCanvas.height - p.size - boundaryPadding;
            p.speedY *= -1;
        } else if (p.y < p.size + boundaryPadding) {
            p.y = p.size + boundaryPadding;
            p.speedY *= -1;
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        detectCollisions();

        particles.forEach(p => {
            let dx = p.x - p.prevX;
            let dy = p.y - p.prevY;
            let distance = Math.sqrt(dx ** 2 + dy ** 2);
            let circumference = 2 * Math.PI * p.size;
            let rotationAmount = (distance / circumference) * 2 * Math.PI;
            p.angle -= rotationAmount;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            let gradient = ctx.createRadialGradient(-3, -3, 5, 0, 0, p.size);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, p.shadow);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            p.prevX = p.x;
            p.prevY = p.y;
            p.x += p.speedX;
            p.y += p.speedY;

            // Check if the ball is near the wall and bounce it back
            handleWallCollisions(p);
        });

        animationFrameId = requestAnimationFrame(drawParticles);
    }

    createParticles();
    drawParticles();
}

function initializeStandardParticles(theme) {
    const colors = particleColors[theme] || ["rgba(255, 255, 255, 0.8)"];

    function createParticles() {
        particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * particleCanvas.width,
                y: Math.random() * particleCanvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x > particleCanvas.width || p.x < 0) p.speedX *= -1;
            if (p.y > particleCanvas.height || p.y < 0) p.speedY *= -1;

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        animationFrameId = requestAnimationFrame(drawParticles);
    }

    createParticles();
    drawParticles();
}

// Ensure particles update when switching themes
function updateParticles() {
    // Stop current animation loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Remove the existing particle canvas from the DOM
    if (particleCanvas) {
        particleCanvas.remove();
        particleCanvas = null;
    }

    // Clear existing particles array
    particles = [];

    // Force reinitialize based on new theme
    setTimeout(() => {
        initializeParticleEffect();
    }, 10);
}

function updateParticleColors(theme) {
    if (!particleColors[theme]) return;

    // Clear existing particles
    particles = [];

    // Create new particles with the correct colors and speed
    for (let i = 0; i < 50; i++) {
        particles.push({
            size: Math.random() * 3 + 1,
            speedX: ((Math.random() - 0.5) * 0.5),
            speedY: ((Math.random() - 0.5) * 0.5),
            opacity: Math.random() * 0.5 + 0.2,
            color: particleColors[theme][Math.floor(Math.random() * particleColors[theme].length)]
        });
    }
}

function flipRandomText() {
    const textElements = document.querySelectorAll(
        "h2, h3, p, span, button, .leaderboard, input, .avatar-image, chat-entry, character-text, confidence-text, search-space-text, attempts-text",
    );

    // Reset previous flips
    textElements.forEach(element => element.classList.remove("flip-effect"));

    // Pick 3-5 random elements to flip
    let elementsToFlip = [];
    while (elementsToFlip.length < 5 && elementsToFlip.length < textElements.length) {
        let randomElement = textElements[Math.floor(Math.random() * textElements.length)];
        if (!elementsToFlip.includes(randomElement)) {
            elementsToFlip.push(randomElement);
        }
    }

    // Apply the flip effect
    elementsToFlip.forEach(element => {
        element.classList.add("flip-effect");
    });

    // Remove the class after the animation ends
    setTimeout(() => {
        elementsToFlip.forEach(element => {
            element.classList.remove("flip-effect");
        });
    }, 1500);
}

setInterval(flipRandomText, 3000);

// Event Listeners
// Handlers for UI buttons and input fields.

// CLUE INPUT

clueInput.addEventListener('input', () => {
    updateCharacterGauge(charLimit - clueInput.value.length);
    toggleSubmitButton();
});

clueInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        if (!submitClueButton.disabled) {
            handleClueSubmission();
        }
    }
});

submitClueButton.addEventListener('click', () => {
    handleClueSubmission();
});

// NAVIGATION

home.addEventListener("click", () => {
    location.reload();
});

shuffleMode.addEventListener("click", () => {
    currentGameMode = "shuffle";
    loadRandomPuzzle();
});

customMode.addEventListener("click", () => {
    hideGameContainer();
    customGameSection.classList.add("animation-visible");
    customGameSection.classList.remove("hidden", "animation-hidden");
});

startCustomGame.addEventListener("click", () => {
    handleCustomGameStart();
});

howToPlayButton.addEventListener("click", () => {
    hideGameContainer();
    howToPlaySection.classList.add("animation-visible");
    howToPlaySection.classList.remove("hidden", "animation-hidden");
});

backToGameButton.addEventListener("click", () => {
    // Hide how-to-play section with transition effects
    howToPlaySection.classList.remove("animation-visible");
    howToPlaySection.classList.add("animation-hidden");

    // Wait a moment before hiding the how-to-play section
    setTimeout(() => {
        howToPlaySection.classList.add("hidden");
    }, 400);

    // Restore the main game UI
    showGameContainer();
});

backToModes.addEventListener("click", () => {
    // Hide custom game section with transition effects
    customGameSection.classList.remove("animation-visible");
    customGameSection.classList.add("animation-hidden");

    // Wait a moment before hiding the custom game section
    setTimeout(() => {
        customGameSection.classList.add("hidden");
    }, 400);

    // Restore the main game UI
    showGameContainer();
});

settingsButton.addEventListener("click", () => {
    hideGameContainer();
    settingsMenu.classList.add("animation-visible");
    settingsMenu.classList.remove("hidden", "animation-hidden");
});

backToGameSettings.addEventListener("click", () => {
    // Hide custom game section with transition effects
    settingsMenu.classList.remove("animation-visible");
    settingsMenu.classList.add("animation-hidden");

    // Wait a moment before hiding the custom game section
    setTimeout(() => {
        settingsMenu.classList.add("hidden");
    }, 400);

    // Restore the main game UI
    showGameContainer();
});

saveSettingsButton.addEventListener("click", () => {
    const username = usernameInput.value.trim();

    if (username.length > 0) {
        localStorage.setItem("username", username);
        alert(`Thanks for settings your username, ${username}.`);
    } else {
        alert("Please enter a valid username.");
    }
});

themesButton.addEventListener("click", () => {
    hideGameContainer();
    themesMenu.classList.add("animation-visible");
    themesMenu.classList.remove("hidden", "animation-hidden");
});

backToGameThemes.addEventListener("click", () => {
    themesMenu.classList.remove("animation-visible");
    themesMenu.classList.add("animation-hidden");
    setTimeout(() => {
        themesMenu.classList.add("hidden");
    }, 400);
    showGameContainer();
});

themeButtons.forEach(button => {
    button.addEventListener("click", () => {
        if (button.disabled) {
            alert("You haven't unlocked this theme yet!");
            return;
        }

        const selectedTheme = `theme-${button.dataset.theme}`;

        // Remove any existing theme classes before applying the new one
        document.body.classList.forEach(cls => {
            if (cls.startsWith("theme-")) {
                document.body.classList.remove(cls);
            }
        });

        // Apply the new theme while preserving other existing classes
        document.body.classList.add(selectedTheme);

        // Store selected theme in LocalStorage
        localStorage.setItem("selectedTheme", button.dataset.theme);

        // Store current metric values in LocalStorage before changing theme
        const currentCharacters = parseInt(document.querySelector(".character-text").textContent, 10);
        const currentSearchSpace = parseInt(document.querySelector(".search-space-text").textContent, 10);
        const currentConfidence = parseInt(document.querySelector(".confidence-text").textContent, 10);
        const currentAttempts = document.querySelector(".attempts-text").textContent;

        localStorage.setItem("currentCharacters", currentCharacters);
        localStorage.setItem("currentSearchSpace", currentSearchSpace);
        localStorage.setItem("currentConfidence", currentConfidence);
        localStorage.setItem("currentAttempts", currentAttempts);

        // Force a full particle refresh when switching themes
        updateParticles();

        // Restore stored values after theme change
        setTimeout(() => {
            const storedCharacters = localStorage.getItem("currentCharacters") || 25;
            const storedSearchSpace = localStorage.getItem("currentSearchSpace") || 100;
            const storedConfidence = localStorage.getItem("currentConfidence") || 0;
            const storedAttempts = localStorage.getItem("currentAttempts") || "∞";

            updateCharacterGauge(parseInt(storedCharacters, 10));
            updateSearchSpaceGauge(parseInt(storedSearchSpace, 10));
            updateConfidenceBar(parseInt(storedConfidence, 10));
            document.querySelector(".attempts-text").textContent = storedAttempts;
            updateAttemptsGauge();
        }, 100);

        // Update particle colors when switching themes
        updateParticleColors(button.dataset.theme);

        // Highlight the selected theme button
        highlightSelectedTheme(button.dataset.theme);
    });
});

achievementsButton.addEventListener("click", () => {
    achievementsMenu.classList.add("animation-visible");
    achievementsMenu.classList.remove("hidden", "animation-hidden");
    updateAchievementsUI();
    hideGameContainer();
});

backToGameAchievements.addEventListener("click", () => {
    achievementsMenu.classList.remove("animation-visible");
    achievementsMenu.classList.add("animation-hidden");
    setTimeout(() => {
        achievementsMenu.classList.add("hidden");
    }, 400);
    showGameContainer();
});

archiveButton.addEventListener("click", () => {
    archiveMenu.classList.add("animation-visible");
    archiveMenu.classList.remove("hidden", "animation-hidden");
    hideGameContainer();
    populateArchiveMenu();
});

document.getElementById("back-to-game-archive").addEventListener("click", () => {
    archiveMenu.classList.remove("animation-visible");
    archiveMenu.classList.add("animation-hidden");
    setTimeout(() => {
        archiveMenu.classList.add("hidden")
    }, 400);
    showGameContainer();
});

document.getElementById("back-to-archive-menu").addEventListener("click", () => {
    document.getElementById("archive-menu").classList.remove("hidden");
    archiveDayMenu.classList.add("hidden");
    setTimeout(() => {
    }, 400);
});

// DOM Content Loaded:

document.addEventListener('DOMContentLoaded', async () => {
    currentGameMode = "daily";

    await loadGreetingsData();

    loadLeaderboard();
    checkThemeUnlocks();
    checkAndDisableLockedThemes();

    const attemptsLeft = parseInt(localStorage.getItem("attemptsRemaining"), 10) || 0;
    let lastWinDate = localStorage.getItem("lastWinDate");
    const bestAttemptWord = localStorage.getItem("bestAttemptWord"); // Check if they won today
    const currentPuzzle = localStorage.getItem("dailyPuzzle") ? JSON.parse(localStorage.getItem("dailyPuzzle")).word : null;
    const todayDate = new Date().toISOString().split("T")[0];

    const playerWonToday = bestAttemptWord && currentPuzzle && bestAttemptWord.toLowerCase() === currentPuzzle.toLowerCase();

    if (!lastWinDate && playerWonToday) {
        console.log("First-time win! Setting lastWinDate.");
        localStorage.setItem("lastWinDate", todayDate);
        localStorage.setItem("winStreak", 1);
        lastWinDate = todayDate;
    }

    if (!playerWonToday) {
        if (attemptsLeft <= 0) {
            const lastWinDate = localStorage.getItem("lastWinDate");
    
            if (!lastWinDate || lastWinDate !== todayDate) {  
                console.log("Streak wiped due to today's loss.");
                localStorage.removeItem("winStreak");
                localStorage.removeItem("lastWinDate");
            }
        } else if (lastWinDate) {
            const lastWin = new Date(lastWinDate);
            lastWin.setDate(lastWin.getDate() + 1);
    
            const expectedDate = lastWin.toISOString().split("T")[0];
    
            if (expectedDate !== todayDate) {
                console.log("Streak wiped due to missed day.");
                localStorage.removeItem("winStreak");
                localStorage.removeItem("lastWinDate");
            }
        }
    }    

    updateStreakDisplay();

    loadAchievements();

    const savedTheme = localStorage.getItem("selectedTheme") || "galaxy";
    document.body.className = `theme-${savedTheme}`;
    highlightSelectedTheme(savedTheme);

    const themeButtons = document.querySelectorAll(".theme-button");

    themeButtons.forEach(button => {
        button.addEventListener("click", () => {
            const newTheme = button.dataset.theme;
            updateParticleColors(newTheme);
        });
    });

    initializeParticleEffect();
    updateParticleColors();

    setTimeout(() => {
        loadStoredClues();
        updateClueLogMessage();
        updateAttemptsGauge();

        const bestAttemptWord = localStorage.getItem("bestAttemptWord");
        const currentWord = localStorage.getItem("dailyPuzzle") 
            ? JSON.parse(localStorage.getItem("dailyPuzzle")).word 
            : null;

        if (bestAttemptWord && bestAttemptWord.toLowerCase() === currentWord.toLowerCase()) {
            // User has already won; end game and show win state
            endGame();
            handleWin(1);

        } else if (attemptsRemaining <= 0) {
            // User is out of attempts and did not win; show loss state
            endGame();
            handleLoss();
        }
    }, 300);

    startInactivityTimer();
    toggleSubmitButton();
    await loadPuzzle();

    updateCluePlaceholder(1);

    setTimeout(() => {
        setGreeting();
        handleUsernameSetup();
    }, 500);

    initializeParticleEffect();
});