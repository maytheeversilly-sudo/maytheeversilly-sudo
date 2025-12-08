/* =========================================
   CONSTANTS & CONFIGURATION
   ========================================= */
const symbols = ['👑', '💰', '💎', '👁️', '🍷'];
const spinCost = 50;
const smallWinReward = 75; 
const jackpotReward = 500; 
const soulRegainBonus = 1000; // New bonus upon regaining the soul
const PITY_THRESHOLD = 50; // Total spins required for guaranteed win

const lossMessages = [
    // Encouraging the player to continue:
    "You were so close! The next spin holds true potential.", 
    "A minor cost. Your investment is nearly ready to pay off.",
    "Look at the near match! Maintain your focus, you've earned the next victory.", 
    "The ultimate prize rewards persistence. Continue your pursuit.", 
    "Everything is within reach. You just need one more decisive move.",
    
    // Acknowledging the loss, but shifting focus immediately:
    "The odds held, but only just. The pattern is shifting in your favor.",
    "Such a sharp near-miss. Your craving builds momentum—use it.",
    "The greatest rewards are never cheap. Let the loss fuel your next win.",
    "The machine noted your play. It expects your return. **Spin again.**",
    "You touched the threshold of fortune. Step over it this time.",
    "A valuable lesson. The symbols are aligning for a significant payout.",
    
    // Subtle pressure and expectation:
    "We know you desire this. Show the machine the depth of your ambition.",
    "The price of satisfaction is substantial, but you are well within reach.",
    "Don't lose momentum. Every spin increases your chance at The Craving.",
    "Your ambition is clear. Proceed with certainty."
];

const flickerMessages = [
    "Keep going.", 
    "Never stop.", 
    "You're so close.", 
    "The house always wins.", 
    "Just one more spin...", 
    "Your desire is absolute.",
    "Do you feel the pull?",
    "Empty handed, again."
];

/* =========================================
   DOM ELEMENTS
   ========================================= */
// Array of all 9 reel elements
const reels = [];
for (let i = 1; i <= 9; i++) {
    reels.push(document.getElementById(`reel${i}`));
}

const scoreDisplay = document.getElementById('score');
const statusDisplay = document.getElementById('status');
const spinBtn = document.getElementById('spin-btn');
const soulBtn = document.getElementById('soul-btn'); 
const flickerDisplay = document.getElementById('flicker-display'); 
const pityFill = document.getElementById('pity-fill');
const pityText = document.getElementById('pity-text');

/* =========================================
   STATE MANAGEMENT
   ========================================= */
let score = 1000;
let soulSold = false; 
let flickerTimeoutId = null; 
let pityCounter = 0;
let lastLossMessageIndex = -1; // <-- NEW: Track the index of the last displayed loss message

// 1. Load Data from LocalStorage
if (localStorage.getItem('lust3x3Score')) {
    score = parseInt(localStorage.getItem('lust3x3Score'));
}
if (localStorage.getItem('lust3x3SoulSold') === 'true') {
    soulSold = true;
    soulBtn.innerText = "SOUL CLAIMED: THE DEBT IS PAID";
    soulBtn.disabled = true;
}
if (localStorage.getItem('lust3x3Pity')) {
    pityCounter = parseInt(localStorage.getItem('lust3x3Pity'));
}


/* =========================================
   FLICKER SYSTEM
   ========================================= */

function getFlickerSpeed() {
    if (score > 1000) return 0;
    if (score > 500) return 5000;
    if (score > 100) return 3000;
    return 1000; 
}

function startFlickerLoop() {
    clearTimeout(flickerTimeoutId); 

    const speed = getFlickerSpeed();

    if (speed === 0) {
        flickerDisplay.style.opacity = 0;
        flickerTimeoutId = setTimeout(startFlickerLoop, 1000); 
        return;
    }

    if (score < 100) {
        flickerDisplay.innerText = flickerMessages[Math.floor(Math.random() * flickerMessages.length)];
        flickerTimeoutId = setTimeout(startFlickerLoop, 2000);
        return;
    }

    flickerTimeoutId = setTimeout(() => {
        performFlash();
        startFlickerLoop();
    }, speed);
}

function performFlash() {
    if (spinBtn.disabled && score >= spinCost) return;

    const message = flickerMessages[Math.floor(Math.random() * flickerMessages.length)];
    flickerDisplay.innerText = message;

    flickerDisplay.style.opacity = "1";

    const visibleDuration = Math.max(800, getFlickerSpeed() / 4);

    setTimeout(() => {
        flickerDisplay.style.opacity = "0";
    }, visibleDuration);
}

/* =========================================
   CORE GAMEPLAY LOGIC
   ========================================= */

function updatePityUI() {
    const percentage = (pityCounter / PITY_THRESHOLD) * 100;
    
    pityFill.style.width = `${percentage}%`;
    pityText.innerText = `${pityCounter} / ${PITY_THRESHOLD}`;
    
    localStorage.setItem('lust3x3Pity', pityCounter);

    if (percentage > 80) {
        document.querySelector('.pity-wrapper').classList.add('desperate-pulse');
    } else {
        document.querySelector('.pity-wrapper').classList.remove('desperate-pulse');
    }
}

function updateScore() {
    scoreDisplay.innerText = score;
    localStorage.setItem('lust3x3Score', score);
    
    // --- INTENSE MODE HANDLER ---
    if (score < 100) {
        flickerDisplay.classList.add('intense-flicker');
        if(flickerDisplay.innerText === "") {
             flickerDisplay.innerText = flickerMessages[Math.floor(Math.random() * flickerMessages.length)];
        }
    } else {
        flickerDisplay.classList.remove('intense-flicker');
        if(flickerDisplay.classList.contains('intense-flicker') === false) {
             flickerDisplay.style.opacity = 0;
        }
    }

    // Update soul button state
    if (soulSold) {
        soulBtn.disabled = true;
        soulBtn.innerText = "SOUL CLAIMED: THE DEBT IS PAID";
    } else {
        soulBtn.disabled = false;
        soulBtn.innerText = "SELL YOUR SOUL";
    }


    // Determine spin button state and status message
    if (score < spinCost) {
        statusDisplay.innerText = "Insufficient power. Find a way to continue.";
        statusDisplay.style.color = "#4a0404"; 
        spinBtn.disabled = true;
    } else if (statusDisplay.innerText.includes("Insufficient") || statusDisplay.innerText === "The ultimate prize awaits.") {
        statusDisplay.innerText = "The ultimate prize awaits.";
        statusDisplay.style.color = "#e0e0e0";
        spinBtn.disabled = false;
    }
}

function spin() {
    if (score < spinCost) return;

    score -= spinCost;
    
    // Increment Pity
    if (pityCounter < PITY_THRESHOLD) {
        pityCounter++;
    }
    updatePityUI();
    updateScore();
    
    statusDisplay.innerText = "Rolling...";
    statusDisplay.style.color = "#e0e0e0";
    spinBtn.disabled = true; 

    // Visual rolling effect
    let iterations = 0;
    const maxIterations = 20; 
    
    const interval = setInterval(() => {
        reels.forEach(reel => {
            reel.innerText = getRandomSymbol();
        });
        
        iterations++;
        if (iterations >= maxIterations) {
            clearInterval(interval);
            finalizeSpinRigged();
        }
    }, 80); 
}

function finalizeSpinRigged() {
    let finalSymbols = new Array(9);
    let outcomeType = "";
    
    // CHECK PITY GUARANTEE FIRST
    const forceWin = (pityCounter >= PITY_THRESHOLD);

    const chance = Math.random(); 

    if (forceWin || chance > 0.98) {
        // JACKPOT (Either forced by Pity or lucky 2%)
        const symbol = getRandomSymbol();
        finalSymbols.fill(symbol); 
        outcomeType = "jackpot";
        score += jackpotReward;
        
        // --- SOUL REGAIN LOGIC ---
        if (forceWin && soulSold) {
            soulSold = false; 
            score += soulRegainBonus; 
            outcomeType = "regained_jackpot"; 
        }
        // --- END SOUL REGAIN LOGIC ---
        
        // Reset Pity on Jackpot
        pityCounter = 0;
        updatePityUI();
    } 
    else if (chance > 0.95) {
        // SMALL WIN
        const symbol = getRandomSymbol();
        finalSymbols[0] = symbol;
        finalSymbols[1] = symbol;
        finalSymbols[2] = symbol;
        for (let i = 3; i < 9; i++) {
             finalSymbols[i] = getRandomSymbol();
        }
        outcomeType = "small";
        score += smallWinReward;
    } 
    else {
        // LOSS
        outcomeType = "loss";
        
        // Psychological Near Miss
        const symbolA = getRandomSymbol();
        finalSymbols[0] = symbolA;
        finalSymbols[1] = symbolA;

        let symbolB;
        do { symbolB = getRandomSymbol(); } while (symbolB === symbolA);
        finalSymbols[2] = symbolB;
        
        for (let i = 3; i < 9; i++) {
             finalSymbols[i] = getRandomSymbol();
        }
    }

    // Soul Debt Consequence (Only applies if the soul is currently sold AND the outcome isn't the final jackpot)
    if (soulSold && outcomeType !== "regained_jackpot" && outcomeType !== "jackpot") {
        score = Math.max(0, score - 0); 
        statusDisplay.innerText += " (Your soul demands a price.)";
    }

    // Update Visuals
    reels.forEach((reel, index) => {
        reel.innerText = finalSymbols[index];
    });
    
    updateScore(); 
    displayMessage(outcomeType);
    
    if (score >= spinCost) {
        spinBtn.disabled = false;
    } else {
        if (pityCounter > 35) {
            statusDisplay.innerText = "You are so close to the guarantee. Do not stop now.";
            statusDisplay.style.color = "#ff0000";
        }
    }
}

function displayMessage(type) {
    if (type === "regained_jackpot") {
        statusDisplay.innerText = `THE DEBT IS PAID. Your Soul is free! (+${jackpotReward + soulRegainBonus} Influence)`;
        statusDisplay.style.color = "#00FF00"; 
        triggerFlash();
        lastLossMessageIndex = -1; // Reset tracker on a win
    } else if (type === "jackpot") {
        statusDisplay.innerText = "ABSOLUTE EXCESS! (Jackpot)";
        statusDisplay.style.color = "#c5a059"; 
        triggerFlash();
        lastLossMessageIndex = -1; // Reset tracker on a win
    } else if (type === "small") {
        statusDisplay.innerText = "A small victory! Keep going, you will hit it big!";
        statusDisplay.style.color = "#c5a059";
        lastLossMessageIndex = -1; // Reset tracker on a win
    } else {
        // --- NON-REPEATING LOSS LOGIC ---
        let newIndex;
        // Loop until a non-repeating index is found
        do {
            newIndex = Math.floor(Math.random() * lossMessages.length);
        } while (newIndex === lastLossMessageIndex);
        
        statusDisplay.innerText = lossMessages[newIndex];
        statusDisplay.style.color = "#FFA500"; 
        
        // Update the tracker for the next spin
        lastLossMessageIndex = newIndex;
        // --- END NON-REPEATING LOSS LOGIC ---
    }
}

function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

function triggerFlash() {
    const container = document.querySelector('.game-wrapper');
    container.style.boxShadow = "0 0 50px #c5a059";
    setTimeout(() => {
        container.style.boxShadow = ""; 
    }, 500);
}

function sellSoul() {
    if (soulSold) return;

    const confirmed = confirm("Are you sure you wish to sell your soul for a grand sum of Influence? The cost is eternal.");

    if (confirmed) {
        const bonus = 1500;
        score += bonus;
        soulSold = true;
        localStorage.setItem('lust3x3SoulSold', 'true');
        
        statusDisplay.innerText = `The bargain is struck. Gain ${bonus} Influence. Your debt is endless.`;
        statusDisplay.style.color = "#4a0404"; 
        updateScore();
        triggerFlash();
    }
}

/* =========================================
   DEBUG TOOLS
   ========================================= */

function debugSetInfluence() {
    const currentScore = score;
    const input = prompt(`[DEBUG] Enter new Influence amount (Current: ${currentScore}):`, currentScore);
    
    if (input !== null) {
        const newScore = parseInt(input);
        if (!isNaN(newScore) && newScore >= 0) {
            score = newScore;
            updateScore();
            updatePityUI();
            
            statusDisplay.innerText = `[DEBUG] Influence set to ${score}.`;
            statusDisplay.style.color = "#00FF00";
        } else {
            alert("Invalid input. Please enter a non-negative number.");
        }
    }
}

function debugTriggerFlicker() {
    const message = flickerMessages[Math.floor(Math.random() * flickerMessages.length)];
    flickerDisplay.innerText = message;
    
    flickerDisplay.classList.remove('intense-flicker'); 

    flickerDisplay.style.opacity = "1";

    setTimeout(() => {
        flickerDisplay.style.opacity = "0";
    }, 1000); 

    statusDisplay.innerText = `[DEBUG] Flicker triggered: "${message}"`;
    statusDisplay.style.color = "#FF4500";
}

/* =========================================
   INITIALIZATION
   ========================================= */
// Initialize UI state
updateScore();
updatePityUI();

// Start the persistent background loop
startFlickerLoop();