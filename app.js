// ProtoReader - Original Quiz Bowl Practice Platform
// Created by Lawrence Tong

// ==================== Configuration ====================
const CONFIG = {
    API_BASE: 'https://www.qbreader.org/api',
    DEFAULT_READING_SPEED: 250, // Words per minute
    TIMER_DURATION: 5, // Seconds for answering
    CATEGORIES: [
        'Literature', 'History', 'Science', 'Fine Arts',
        'Religion', 'Mythology', 'Philosophy', 'Social Science',
        'Current Events', 'Geography', 'Other Academic', 'Trash'
    ],
    SUBCATEGORIES: {
        'Literature': ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature'],
        'History': ['American History', 'Ancient History', 'European History', 'World History', 'Other History'],
        'Science': ['Biology', 'Chemistry', 'Physics', 'Math', 'Other Science'],
        'Fine Arts': ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts'],
        'Religion': ['Religion'],
        'Mythology': ['Mythology'],
        'Philosophy': ['Philosophy'],
        'Social Science': ['Social Science'],
        'Current Events': ['Current Events'],
        'Geography': ['Geography'],
        'Other Academic': ['Other Academic'],
        'Trash': ['Trash']
    },
    DIFFICULTIES: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
};

// ==================== State Management ====================
const state = {
    currentScreen: 'home',
    currentMode: null,
    currentQuestion: null,
    questionIndex: 0,
    readingPosition: 0,
    readingInterval: null,
    timerInterval: null,
    timeRemaining: CONFIG.TIMER_DURATION,
    buzzed: false,
    answered: false,
    filters: {
        categories: [],
        subcategories: [],
        difficulties: [],
        yearStart: null,
        yearEnd: null
    },
    settings: {
        readingSpeed: CONFIG.DEFAULT_READING_SPEED,
        autoReveal: true,
        showMetadata: true,
        standardOnly: false
    },
    stats: {
        tossups: { correct: 0, incorrect: 0, played: 0 },
        bonuses: { points: 0, partsCorrect: 0, partsPlayed: 0, played: 0 },
        categories: {}
    },
    multiplayer: {
        socket: null,
        roomCode: null,
        playerName: null,
        isHost: false,
        players: []
    }
};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeModeCards();
    initializeFilters();
    initializeSettings();
    initializeKeyboardControls();
    loadSettings();
    loadStatistics();
    showScreen('home');
});

// ==================== Navigation ====================
function initializeNavigation() {
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const screen = link.getAttribute('data-screen');
            if (screen === 'home') {
                resetToHome();
            } else {
                showScreen(screen);
            }
        });
    });
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenName);
    if (targetScreen) {
        targetScreen.classList.add('active');
        state.currentScreen = screenName;
    } else {
        console.error(`Screen not found: ${screenName}`);
    }
}

function resetToHome() {
    stopReading();
    stopTimer();
    state.currentMode = null;
    state.currentQuestion = null;
    state.questionIndex = 0;
    state.buzzed = false;
    state.answered = false;
    showScreen('home');
}

// ==================== Mode Selection ====================
function initializeModeCards() {
    document.getElementById('tossup-mode-card').addEventListener('click', () => {
        state.currentMode = 'tossup';
        showScreen('tossup-setup');
    });

    document.getElementById('bonus-mode-card').addEventListener('click', () => {
        state.currentMode = 'bonus';
        showScreen('bonus-setup');
    });

    document.getElementById('multiplayer-mode-card').addEventListener('click', () => {
        state.currentMode = 'multiplayer';
        showScreen('multiplayer-setup');
    });
}

// ==================== Filter Management ====================
function initializeFilters() {
    // Category pills
    const categoryPills = document.getElementById('category-pills');
    CONFIG.CATEGORIES.forEach(category => {
        const pill = document.createElement('div');
        pill.className = 'pill';
        pill.textContent = category;
        pill.addEventListener('click', () => togglePill(pill, category, 'categories'));
        categoryPills.appendChild(pill);
    });

    // Difficulty pills
    const difficultyPills = document.getElementById('difficulty-pills');
    CONFIG.DIFFICULTIES.forEach(diff => {
        const pill = document.createElement('div');
        pill.className = 'pill';
        pill.textContent = diff;
        pill.addEventListener('click', () => togglePill(pill, diff, 'difficulties'));
        difficultyPills.appendChild(pill);
    });

    // Bonus setup filters (copy from tossup)
    const bonusCategoryPills = document.getElementById('bonus-category-pills');
    CONFIG.CATEGORIES.forEach(category => {
        const pill = document.createElement('div');
        pill.className = 'pill';
        pill.textContent = category;
        pill.addEventListener('click', () => togglePill(pill, category, 'categories'));
        bonusCategoryPills.appendChild(pill);
    });

    const bonusDifficultyPills = document.getElementById('bonus-difficulty-pills');
    CONFIG.DIFFICULTIES.forEach(diff => {
        const pill = document.createElement('div');
        pill.className = 'pill';
        pill.textContent = diff;
        pill.addEventListener('click', () => togglePill(pill, diff, 'difficulties'));
        bonusDifficultyPills.appendChild(pill);
    });

    // Start buttons
    document.getElementById('start-tossup-btn').addEventListener('click', startTossupPractice);
    document.getElementById('start-bonus-btn').addEventListener('click', startBonusPractice);
    document.getElementById('back-to-home-tossup').addEventListener('click', resetToHome);
    document.getElementById('back-to-home-bonus').addEventListener('click', resetToHome);
}

function togglePill(pill, value, filterType) {
    pill.classList.toggle('active');
    const index = state.filters[filterType].indexOf(value);
    if (index > -1) {
        state.filters[filterType].splice(index, 1);
    } else {
        state.filters[filterType].push(value);
    }
}

// ==================== Utility Functions ====================
function stripHtmlTags(text) {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '');
}

function startTossupPractice() {
    state.questionIndex = 0;
    state.filters.yearStart = parseInt(document.getElementById('year-start').value) || 2010;
    state.filters.yearEnd = parseInt(document.getElementById('year-end').value) || 2024;
    
    showScreen('tossup-game');
    loadNextTossup();
}

async function loadNextTossup() {
    try {
        resetQuestionState();
        const question = await fetchTossup();
        state.currentQuestion = question;
        state.questionIndex++;
        
        displayTossupQuestion();
        updateGameStats();
        startReading();
    } catch (error) {
        console.error('Error loading tossup:', error);
        alert('Failed to load question. Please try again.');
    }
}

async function fetchTossup() {
    const params = new URLSearchParams();
    params.append('number', '1');
    
    if (state.filters.difficulties.length > 0) {
        state.filters.difficulties.forEach(d => params.append('difficulties', d));
    }
    if (state.filters.categories.length > 0) {
        state.filters.categories.forEach(c => params.append('categories', c));
    }
    if (state.filters.yearStart) {
        params.append('min_year', state.filters.yearStart);
    }
    if (state.filters.yearEnd) {
        params.append('max_year', state.filters.yearEnd);
    }

    const url = `${CONFIG.API_BASE}/random-tossup?${params.toString()}`;
    console.log('Fetching tossup from:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Received data:', data);
    
    if (!data.tossups || data.tossups.length === 0) {
        throw new Error('No tossups found with the selected filters. Try selecting different categories or removing filters.');
    }
    
    return data.tossups[0];
}

function displayTossupQuestion() {
    const question = state.currentQuestion;
    const metadataEl = document.getElementById('question-metadata');
    const textEl = document.getElementById('question-text');
    
    if (state.settings.showMetadata) {
        metadataEl.textContent = `${question.category} | ${question.subcategory} | Difficulty ${question.difficulty} | ${question.tournament} ${question.year}`;
        metadataEl.style.display = 'block';
    } else {
        metadataEl.style.display = 'none';
    }
    
    textEl.textContent = '';
    document.getElementById('progress-fill').style.width = '0%';
}

function startReading() {
    const question = state.currentQuestion;
    const cleanText = stripHtmlTags(question.question);
    const words = cleanText.split(' ');
    const wordsPerSecond = state.settings.readingSpeed / 60;
    const intervalMs = 1000 / wordsPerSecond;
    
    state.readingPosition = 0;
    state.readingInterval = setInterval(() => {
        if (state.buzzed) {
            stopReading();
            return;
        }
        
        if (state.readingPosition < words.length) {
            const textEl = document.getElementById('question-text');
            textEl.textContent = words.slice(0, state.readingPosition + 1).join(' ');
            state.readingPosition++;
            
            const progress = (state.readingPosition / words.length) * 100;
            document.getElementById('progress-fill').style.width = `${progress}%`;
        } else {
            stopReading();
            if (state.settings.autoReveal) {
                revealAnswer();
            }
        }
    }, intervalMs);
}

function stopReading() {
    if (state.readingInterval) {
        clearInterval(state.readingInterval);
        state.readingInterval = null;
    }
}

function buzz() {
    if (state.buzzed || state.answered) return;
    
    state.buzzed = true;
    stopReading();
    
    document.getElementById('buzz-status').textContent = 'Buzzed! Enter your answer:';
    document.getElementById('buzz-status').style.color = 'var(--warning)';
    document.getElementById('buzz-status').style.fontWeight = '700';
    
    const answerInput = document.getElementById('answer-input');
    answerInput.disabled = false;
    answerInput.placeholder = 'Type your answer...';
    answerInput.focus();
    
    startTimer();
}

function startTimer() {
    state.timeRemaining = CONFIG.TIMER_DURATION;
    updateTimerDisplay();
    
    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateTimerDisplay();
        
        if (state.timeRemaining <= 0) {
            stopTimer();
            submitAnswer();
        }
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    timerEl.textContent = state.timeRemaining.toFixed(1);
    
    timerEl.classList.remove('warning', 'danger');
    if (state.timeRemaining <= 2) {
        timerEl.classList.add('danger');
    } else if (state.timeRemaining <= 3) {
        timerEl.classList.add('warning');
    }
}

async function submitAnswer() {
    if (state.answered) return;
    
    const userAnswer = document.getElementById('answer-input').value.trim();
    if (!userAnswer) {
        document.getElementById('answer-feedback').textContent = 'No answer provided - Incorrect';
        document.getElementById('answer-feedback').className = 'answer-feedback incorrect';
        state.answered = true;
        stopTimer();
        updateStats(false);
        revealAnswer();
        return;
    }
    
    try {
        const result = await checkAnswer(userAnswer);
        displayAnswerFeedback(result);
        updateStats(result.directive?.toLowerCase() === 'accept');
    } catch (error) {
        console.error('Error checking answer:', error);
        // Fallback to simple matching - case insensitive
        const cleanAnswer = stripHtmlTags(state.currentQuestion.answer).toLowerCase();
        const correct = userAnswer.toLowerCase().includes(cleanAnswer.slice(0, 5));
        displayAnswerFeedback({ correct, directive: correct ? 'accept' : 'reject' });
        updateStats(correct);
    }
    
    state.answered = true;
    stopTimer();
    revealAnswer();
}

async function checkAnswer(userAnswer) {
    const cleanAnswer = stripHtmlTags(state.currentQuestion.answer);
    const response = await fetch(`${CONFIG.API_BASE}/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            answerline: cleanAnswer,
            givenAnswer: userAnswer
        })
    });
    
    if (!response.ok) throw new Error('Failed to check answer');
    return await response.json();
}

function displayAnswerFeedback(result) {
    const feedbackEl = document.getElementById('answer-feedback');
    const directive = result.directive.toLowerCase();
    
    if (directive === 'accept') {
        feedbackEl.textContent = '✓ Correct!';
        feedbackEl.className = 'answer-feedback correct';
    } else {
        feedbackEl.textContent = '✗ Incorrect';
        feedbackEl.className = 'answer-feedback incorrect';
    }
}

function revealAnswer() {
    const textEl = document.getElementById('question-text');
    const cleanQuestion = stripHtmlTags(state.currentQuestion.question);
    textEl.textContent = cleanQuestion;
    
    const cleanAnswer = stripHtmlTags(state.currentQuestion.answer);
    const answerDiv = document.createElement('div');
    answerDiv.style.marginTop = '2rem';
    answerDiv.style.padding = '1rem';
    answerDiv.style.background = '#f3f4f6';
    answerDiv.style.borderRadius = '8px';
    answerDiv.innerHTML = `<strong>ANSWER:</strong> ${cleanAnswer}`;
    
    const questionDisplay = document.querySelector('.question-display');
    const existingAnswer = questionDisplay.querySelector('div[style*="margin-top: 2rem"]');
    if (!existingAnswer) {
        questionDisplay.appendChild(answerDiv);
    }
}

function updateStats(correct) {
    state.stats.tossups.played++;
    if (correct) {
        state.stats.tossups.correct++;
    } else {
        state.stats.tossups.incorrect++;
    }
    
    const category = state.currentQuestion.category;
    if (!state.stats.categories[category]) {
        state.stats.categories[category] = { correct: 0, incorrect: 0 };
    }
    if (correct) {
        state.stats.categories[category].correct++;
    } else {
        state.stats.categories[category].incorrect++;
    }
    
    saveStatistics();
    updateGameStats();
}

function updateGameStats() {
    document.getElementById('question-count').textContent = state.questionIndex;
    document.getElementById('correct-count').textContent = state.stats.tossups.correct;
    const accuracy = state.stats.tossups.played > 0 
        ? Math.round((state.stats.tossups.correct / state.stats.tossups.played) * 100)
        : 0;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
}

function resetQuestionState() {
    state.readingPosition = 0;
    state.buzzed = false;
    state.answered = false;
    state.timeRemaining = CONFIG.TIMER_DURATION;
    
    document.getElementById('buzz-status').textContent = '';
    document.getElementById('buzz-status').style.color = '';
    document.getElementById('buzz-status').style.fontWeight = '';
    const answerInput = document.getElementById('answer-input');
    answerInput.value = '';
    answerInput.disabled = true;
    answerInput.placeholder = 'Buzz first to answer...';
    document.getElementById('answer-feedback').textContent = '';
    document.getElementById('answer-feedback').className = 'answer-feedback';
    document.getElementById('timer').textContent = CONFIG.TIMER_DURATION.toFixed(1);
    document.getElementById('timer').classList.remove('warning', 'danger');
    
    // Remove any previously revealed answer divs
    const questionDisplay = document.querySelector('.question-display');
    const existingAnswer = questionDisplay.querySelector('div[style*="margin-top: 2rem"]');
    if (existingAnswer) {
        existingAnswer.remove();
    }
}

// ==================== Bonus Practice ====================
async function startBonusPractice() {
    state.questionIndex = 0;
    state.filters.yearStart = parseInt(document.getElementById('bonus-year-start').value) || 2010;
    state.filters.yearEnd = parseInt(document.getElementById('bonus-year-end').value) || 2024;
    
    showScreen('bonus-game');
    await loadNextBonus();
}

async function loadNextBonus() {
    try {
        const bonus = await fetchBonus();
        state.currentQuestion = bonus;
        state.questionIndex++;
        
        displayBonus();
        updateBonusStats();
    } catch (error) {
        console.error('Error loading bonus:', error);
        alert('Failed to load bonus. Please try again.');
    }
}

async function fetchBonus() {
    const params = new URLSearchParams();
    params.append('number', '1');
    
    if (state.filters.difficulties.length > 0) {
        state.filters.difficulties.forEach(d => params.append('difficulties', d));
    }
    if (state.filters.categories.length > 0) {
        state.filters.categories.forEach(c => params.append('categories', c));
    }
    if (state.filters.yearStart) {
        params.append('min_year', state.filters.yearStart);
    }
    if (state.filters.yearEnd) {
        params.append('max_year', state.filters.yearEnd);
    }

    const url = `${CONFIG.API_BASE}/random-bonus?${params.toString()}`;
    console.log('Fetching bonus from:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Received data:', data);
    
    if (!data.bonuses || data.bonuses.length === 0) {
        throw new Error('No bonuses found with the selected filters. Try selecting different categories or removing filters.');
    }
    
    return data.bonuses[0];
}

function displayBonus() {
    const bonus = state.currentQuestion;
    
    document.getElementById('bonus-metadata').textContent = 
        `${bonus.category} | ${bonus.subcategory} | Difficulty ${bonus.difficulty} | ${bonus.tournament} ${bonus.year}`;
    
    document.getElementById('bonus-leadin').textContent = stripHtmlTags(bonus.leadin);
    
    // Setup parts
    for (let i = 0; i < 3; i++) {
        const partDiv = document.getElementById(`part-${i}`);
        partDiv.querySelector('.part-question').textContent = stripHtmlTags(bonus.parts[i]);
        partDiv.querySelector('.part-answer').value = '';
        partDiv.querySelector('.part-feedback').textContent = '';
        partDiv.classList.remove('active');
        
        const submitBtn = partDiv.querySelector('.part-submit');
        submitBtn.onclick = () => submitBonusPart(i);
    }
    
    document.getElementById('part-0').classList.add('active');
}

async function submitBonusPart(partIndex) {
    const partDiv = document.getElementById(`part-${partIndex}`);
    const answerInput = partDiv.querySelector('.part-answer');
    const feedbackEl = partDiv.querySelector('.part-feedback');
    const userAnswer = answerInput.value.trim();
    
    const correctAnswer = stripHtmlTags(state.currentQuestion.answers[partIndex]);
    
    if (!userAnswer) {
        feedbackEl.textContent = `✗ No answer - Answer: ${correctAnswer}`;
        feedbackEl.style.color = '#ef4444';
        state.stats.bonuses.partsPlayed++;
        saveStatistics();
        nextBonusPart(partIndex);
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_BASE}/check-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answerline: correctAnswer,
                givenAnswer: userAnswer
            })
        });
        
        if (!response.ok) throw new Error('API error');
        
        const result = await response.json();
        const correct = result.directive.toLowerCase() === 'accept';
        
        if (correct) {
            feedbackEl.textContent = `✓ Correct! Answer: ${correctAnswer}`;
            feedbackEl.style.color = '#10b981';
            state.stats.bonuses.points += 10;
            state.stats.bonuses.partsCorrect++;
        } else {
            feedbackEl.textContent = `✗ Incorrect. Answer: ${correctAnswer}`;
            feedbackEl.style.color = '#ef4444';
        }
        
        state.stats.bonuses.partsPlayed++;
        saveStatistics();
        updateBonusStats();
        nextBonusPart(partIndex);
    } catch (error) {
        console.error('Error checking bonus answer:', error);
        feedbackEl.textContent = `Answer: ${correctAnswer}`;
        feedbackEl.style.color = '#6b7280';
        state.stats.bonuses.partsPlayed++;
        saveStatistics();
        nextBonusPart(partIndex);
    }
}

function nextBonusPart(currentPart) {
    const currentDiv = document.getElementById(`part-${currentPart}`);
    currentDiv.classList.remove('active');
    currentDiv.querySelector('.part-submit').disabled = true;
    
    if (currentPart < 2) {
        const nextDiv = document.getElementById(`part-${currentPart + 1}`);
        nextDiv.classList.add('active');
    } else {
        state.stats.bonuses.played++;
        saveStatistics();
    }
}

function updateBonusStats() {
    document.getElementById('bonus-count').textContent = state.questionIndex;
    document.getElementById('bonus-points').textContent = state.stats.bonuses.points;
    const ppb = state.stats.bonuses.played > 0
        ? (state.stats.bonuses.points / state.stats.bonuses.played).toFixed(1)
        : '0.0';
    document.getElementById('bonus-ppb').textContent = `${ppb} PPB`;
}

// ==================== Settings ====================
function initializeSettings() {
    const speedSlider = document.getElementById('reading-speed');
    const speedValue = document.getElementById('speed-value');
    
    speedSlider.addEventListener('input', (e) => {
        state.settings.readingSpeed = parseInt(e.target.value);
        speedValue.textContent = `${state.settings.readingSpeed} WPM`;
    });
    
    // Game screen speed slider
    const gameSpeedSlider = document.getElementById('game-speed');
    if (gameSpeedSlider) {
        gameSpeedSlider.addEventListener('input', (e) => {
            state.settings.readingSpeed = parseInt(e.target.value);
            document.getElementById('game-speed-value').textContent = e.target.value;
        });
    }
    
    document.getElementById('auto-reveal').addEventListener('change', (e) => {
        state.settings.autoReveal = e.target.checked;
    });
    
    document.getElementById('show-metadata').addEventListener('change', (e) => {
        state.settings.showMetadata = e.target.checked;
    });
    
    document.getElementById('standard-only').addEventListener('change', (e) => {
        state.settings.standardOnly = e.target.checked;
    });
    
    document.getElementById('save-settings-btn').addEventListener('click', () => {
        saveSettings();
        alert('Settings saved!');
    });
}

function loadSettings() {
    const saved = localStorage.getItem('protoreader-settings');
    if (saved) {
        state.settings = JSON.parse(saved);
        document.getElementById('reading-speed').value = state.settings.readingSpeed;
        document.getElementById('speed-value').textContent = `${state.settings.readingSpeed} WPM`;
        const gameSpeed = document.getElementById('game-speed');
        if (gameSpeed) {
            gameSpeed.value = state.settings.readingSpeed;
            document.getElementById('game-speed-value').textContent = state.settings.readingSpeed;
        }
        document.getElementById('auto-reveal').checked = state.settings.autoReveal;
        document.getElementById('show-metadata').checked = state.settings.showMetadata;
        document.getElementById('standard-only').checked = state.settings.standardOnly;
    }
}

function saveSettings() {
    localStorage.setItem('protoreader-settings', JSON.stringify(state.settings));
}

// ==================== Statistics ====================
function loadStatistics() {
    const saved = localStorage.getItem('protoreader-stats');
    if (saved) {
        state.stats = JSON.parse(saved);
    }
    displayStatistics();
}

function saveStatistics() {
    localStorage.setItem('protoreader-stats', JSON.stringify(state.stats));
}

function displayStatistics() {
    // Tossup stats
    document.getElementById('tossups-played').textContent = state.stats.tossups.played;
    document.getElementById('tossups-correct').textContent = state.stats.tossups.correct;
    document.getElementById('tossups-incorrect').textContent = state.stats.tossups.incorrect;
    const tossupAccuracy = state.stats.tossups.played > 0
        ? Math.round((state.stats.tossups.correct / state.stats.tossups.played) * 100)
        : 0;
    document.getElementById('tossup-accuracy').textContent = `${tossupAccuracy}%`;
    
    // Bonus stats
    document.getElementById('bonuses-played').textContent = state.stats.bonuses.played;
    document.getElementById('bonus-points-total').textContent = state.stats.bonuses.points;
    document.getElementById('bonus-parts-correct').textContent = state.stats.bonuses.partsCorrect;
    const bonusPPB = state.stats.bonuses.played > 0
        ? (state.stats.bonuses.points / state.stats.bonuses.played).toFixed(1)
        : '0.0';
    document.getElementById('bonus-ppb-avg').textContent = bonusPPB;
}

// ==================== Keyboard Controls ====================
function initializeKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        // Space to buzz
        if (e.code === 'Space' && state.currentScreen === 'tossup-game' && !state.buzzed && !state.answered) {
            e.preventDefault();
            buzz();
        }
        
        // Enter to submit answer
        if (e.code === 'Enter' && state.currentScreen === 'tossup-game' && state.buzzed && !state.answered) {
            if (document.activeElement.id === 'answer-input') {
                submitAnswer();
            }
        }
        
        // N for next question
        if (e.code === 'KeyN' && (state.currentScreen === 'tossup-game' || state.currentScreen === 'bonus-game')) {
            if (state.answered || state.currentScreen === 'bonus-game') {
                if (state.currentScreen === 'tossup-game') {
                    loadNextTossup();
                } else {
                    loadNextBonus();
                }
            }
        }
    });
    
    // Submit answer button
    document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);
    
    // Answer input Enter key
    document.getElementById('answer-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });
    
    // Control buttons
    document.getElementById('next-tossup-btn').addEventListener('click', loadNextTossup);
    document.getElementById('skip-tossup-btn').addEventListener('click', loadNextTossup);
    document.getElementById('pause-tossup-btn').addEventListener('click', () => {
        if (state.readingInterval) {
            stopReading();
        } else if (!state.buzzed) {
            startReading();
        }
    });
    document.getElementById('end-tossup-btn').addEventListener('click', resetToHome);
    
    // Bonus controls
    document.getElementById('next-bonus-btn').addEventListener('click', loadNextBonus);
    document.getElementById('end-bonus-btn').addEventListener('click', resetToHome);
    
    // Back button for multiplayer
    document.getElementById('back-to-home-mp')?.addEventListener('click', resetToHome);
}

// ==================== Database Search ====================
// Placeholder for future implementation
document.getElementById('search-btn')?.addEventListener('click', () => {
    alert('Database search feature coming soon!');
});

// ==================== Multiplayer ====================
// Placeholder for future implementation
document.getElementById('create-room-btn')?.addEventListener('click', () => {
    alert('Multiplayer feature coming soon!');
});

document.getElementById('join-room-btn')?.addEventListener('click', () => {
    alert('Multiplayer feature coming soon!');
});
