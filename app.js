// ProtoReader - Original Quiz Bowl Practice Platform
// Created by Lawrence Tong

// ==================== Configuration ====================
const CONFIG = {
    API_BASE: 'https://www.qbreader.org/api',
    DEFAULT_READING_SPEED: 250, // Words per minute
    TIMER_DURATION: 5, // Seconds for answering
    POWER_THRESHOLD: 0.33, // Fraction of question for power
    POWER_POINTS: 15,
    NORMAL_POINTS: 10,
    NEG_POINTS: -5,
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
    DIFFICULTIES: [
        { display: 'Middle School', value: 1 },
        { display: 'Easy High School', value: 2 },
        { display: 'Regular High School', value: 3 },
        { display: 'Hard High School', value: 4 },
        { display: 'National High School', value: 5 },
        { display: 'Easy College', value: 6 },
        { display: 'Regular College', value: 7 },
        { display: 'Hard College', value: 8 },
        { display: 'Open', value: 9 }
    ]
};

// ==================== State Management ====================
const state = {
    currentScreen: 'home',
    currentMode: null,
    currentQuestion: null,
    questionIndex: 0,
    readingPosition: 0,
    currentQuestionWordCount: 0,
    buzzPosition: 0,
    readingInterval: null,
    timerInterval: null,
    buzzWindowInterval: null,
    buzzWindowTime: 5,
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
        tossups: { correct: 0, incorrect: 0, played: 0, score: 0, powers: 0, normals: 0, negs: 0, dead: 0 },
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
    initializeSidebarToggle();
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
        pill.textContent = diff.display;
        pill.dataset.value = diff.value;
        pill.addEventListener('click', () => togglePill(pill, diff.value, 'difficulties'));
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
        pill.textContent = diff.display;
        pill.dataset.value = diff.value;
        pill.addEventListener('click', () => togglePill(pill, diff.value, 'difficulties'));
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
    resetBuzzLog();
    
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
    console.log('Filters:', state.filters);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
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
        // Convert difficulty number to display name
        const difficultyObj = CONFIG.DIFFICULTIES.find(d => d.value === question.difficulty);
        const difficultyName = difficultyObj ? difficultyObj.display : question.difficulty;
        metadataEl.textContent = `${question.category} | ${question.subcategory} | ${difficultyName} | ${question.tournament} ${question.year}`;
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
    state.currentQuestionWordCount = words.length;
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
            // Start 5-second buzz window instead of immediately revealing
            startBuzzWindow();
        }
    }, intervalMs);
}

function stopReading() {
    if (state.readingInterval) {
        clearInterval(state.readingInterval);
        state.readingInterval = null;
    }
}

function startBuzzWindow() {
    state.buzzWindowTime = 5;
    updateBuzzWindowDisplay();
    
    state.buzzWindowInterval = setInterval(() => {
        state.buzzWindowTime--;
        updateBuzzWindowDisplay();
        
        if (state.buzzWindowTime <= 0) {
            stopBuzzWindow();
            // Time's up - mark as incorrect and reveal answer
            document.getElementById('answer-feedback').textContent = 'Time expired - No buzz';
            document.getElementById('answer-feedback').className = 'answer-feedback incorrect';
            state.answered = true;
            recordTossupResult('dead');
            revealAnswer();
        }
    }, 1000);
}

function stopBuzzWindow() {
    if (state.buzzWindowInterval) {
        clearInterval(state.buzzWindowInterval);
        state.buzzWindowInterval = null;
    }
    document.getElementById('buzz-status').textContent = '';
}

function updateBuzzWindowDisplay() {
    const statusEl = document.getElementById('buzz-status');
    statusEl.textContent = `Question complete! Press SPACE to buzz (${state.buzzWindowTime}s remaining)`;
    statusEl.style.color = state.buzzWindowTime <= 2 ? 'var(--danger)' : 'var(--primary)';
    statusEl.style.fontWeight = '600';
}

function buzz() {
    if (state.buzzed || state.answered) return;
    
    state.buzzed = true;
    state.buzzPosition = state.readingPosition;
    stopReading();
    stopBuzzWindow();
    
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
        recordTossupResult('neg');
        appendBuzzLog({
            correct: false,
            userAnswer: '(no answer)',
            correctAnswer: stripHtmlTags(state.currentQuestion.answer),
            outcome: 'neg'
        });
        revealAnswer();
        return;
    }
    
    try {
        const result = await checkAnswer(userAnswer);
        const correct = result.directive?.toLowerCase() === 'accept';
        const outcome = getTossupOutcome(correct);
        displayAnswerFeedback(result);
        recordTossupResult(outcome);
        appendBuzzLog({
            correct,
            userAnswer,
            correctAnswer: stripHtmlTags(state.currentQuestion.answer),
            outcome
        });
    } catch (error) {
        console.error('Error checking answer:', error);
        // Fallback to simple matching - case insensitive
        const cleanAnswer = stripHtmlTags(state.currentQuestion.answer).toLowerCase();
        const correct = userAnswer.toLowerCase().includes(cleanAnswer.slice(0, 5));
        displayAnswerFeedback({ correct, directive: correct ? 'accept' : 'reject' });
        const outcome = getTossupOutcome(correct);
        recordTossupResult(outcome);
        appendBuzzLog({
            correct,
            userAnswer,
            correctAnswer: stripHtmlTags(state.currentQuestion.answer),
            outcome
        });
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
        const powerTag = isPowerBuzz() ? ' (Power)' : '';
        feedbackEl.textContent = `✓ Correct${powerTag}!`;
        feedbackEl.className = 'answer-feedback correct';
    } else {
        feedbackEl.textContent = '✗ Incorrect';
        feedbackEl.className = 'answer-feedback incorrect';
    }
}

function resetBuzzLog() {
    const log = document.getElementById('buzz-log');
    if (!log) return;
    log.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'buzz-log-empty';
    empty.textContent = 'No buzzes yet.';
    log.appendChild(empty);
}

function appendBuzzLog({ correct, userAnswer, correctAnswer, outcome }) {
    const log = document.getElementById('buzz-log');
    if (!log) return;

    const empty = log.querySelector('.buzz-log-empty');
    if (empty) {
        empty.remove();
    }

    const item = document.createElement('div');
    item.className = `buzz-log-item ${correct ? 'correct' : 'incorrect'}`;

    const icon = document.createElement('span');
    icon.className = 'buzz-log-icon';
    icon.textContent = correct ? '✓' : '✗';

    const body = document.createElement('div');
    body.className = 'buzz-log-body';

    const line1 = document.createElement('div');
    line1.className = 'buzz-log-line';
    line1.textContent = `You: ${userAnswer}`;

    const line2 = document.createElement('div');
    line2.className = 'buzz-log-line';
    line2.textContent = `Answer: ${correctAnswer}`;

    const meta = document.createElement('div');
    meta.className = 'buzz-log-meta';
    meta.textContent = formatOutcomeLabel(outcome);

    body.append(line1, line2, meta);
    item.append(icon, body);
    log.prepend(item);
}

function formatOutcomeLabel(outcome) {
    switch (outcome) {
        case 'power':
            return 'Power +15';
        case 'normal':
            return 'Correct +10';
        case 'neg':
            return 'Neg -5';
        default:
            return '';
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

function getTossupOutcome(correct) {
    if (!state.buzzed) return 'dead';
    if (!correct) return 'neg';
    return isPowerBuzz() ? 'power' : 'normal';
}

function isPowerBuzz() {
    const threshold = Math.max(1, Math.floor(state.currentQuestionWordCount * CONFIG.POWER_THRESHOLD));
    return state.buzzed && state.buzzPosition > 0 && state.buzzPosition <= threshold;
}

function recordTossupResult(outcome) {
    state.stats.tossups.played++;
    switch (outcome) {
        case 'power':
            state.stats.tossups.correct++;
            state.stats.tossups.powers++;
            state.stats.tossups.score += CONFIG.POWER_POINTS;
            break;
        case 'normal':
            state.stats.tossups.correct++;
            state.stats.tossups.normals++;
            state.stats.tossups.score += CONFIG.NORMAL_POINTS;
            break;
        case 'neg':
            state.stats.tossups.incorrect++;
            state.stats.tossups.negs++;
            state.stats.tossups.score += CONFIG.NEG_POINTS;
            break;
        case 'dead':
        default:
            state.stats.tossups.dead++;
            break;
    }
    
    const category = state.currentQuestion.category;
    if (!state.stats.categories[category]) {
        state.stats.categories[category] = { correct: 0, incorrect: 0 };
    }
    if (outcome === 'power' || outcome === 'normal') {
        state.stats.categories[category].correct++;
    } else if (outcome === 'neg') {
        state.stats.categories[category].incorrect++;
    }
    
    saveStatistics();
    updateGameStats();
}

function updateGameStats() {
    document.getElementById('correct-count').textContent = state.stats.tossups.correct;
    document.getElementById('score-total').textContent = state.stats.tossups.score;
}

function resetQuestionState() {
    state.readingPosition = 0;
    state.currentQuestionWordCount = 0;
    state.buzzed = false;
    state.answered = false;
    state.buzzPosition = 0;
    state.timeRemaining = CONFIG.TIMER_DURATION;
    state.buzzWindowTime = 5;
    stopBuzzWindow();
    
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
    
    // Convert difficulty number to display name
    const difficultyObj = CONFIG.DIFFICULTIES.find(d => d.value === bonus.difficulty);
    const difficultyName = difficultyObj ? difficultyObj.display : bonus.difficulty;
    document.getElementById('bonus-metadata').textContent = 
        `${bonus.category} | ${bonus.subcategory} | ${difficultyName} | ${bonus.tournament} ${bonus.year}`;
    
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
            document.getElementById('game-speed-value').textContent = `${e.target.value} WPM`;
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
            document.getElementById('game-speed-value').textContent = `${state.settings.readingSpeed} WPM`;
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
        const parsed = JSON.parse(saved);
        state.stats = {
            ...state.stats,
            ...parsed,
            tossups: { ...state.stats.tossups, ...parsed.tossups },
            bonuses: { ...state.stats.bonuses, ...parsed.bonuses }
        };
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

// ==================== Sidebar Toggle ====================
function initializeSidebarToggle() {
    // Tossup sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('game-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const icon = sidebarToggle.querySelector('.toggle-icon');
            if (sidebar.classList.contains('collapsed')) {
                icon.textContent = '▶';
            } else {
                icon.textContent = '◀';
            }
        });
    }
    
    // Bonus sidebar toggle
    const bonusSidebarToggle = document.getElementById('bonus-sidebar-toggle');
    const bonusSidebar = document.getElementById('bonus-sidebar');
    
    if (bonusSidebarToggle && bonusSidebar) {
        bonusSidebarToggle.addEventListener('click', () => {
            bonusSidebar.classList.toggle('collapsed');
            const icon = bonusSidebarToggle.querySelector('.toggle-icon');
            if (bonusSidebar.classList.contains('collapsed')) {
                icon.textContent = '▶';
            } else {
                icon.textContent = '◀';
            }
        });
    }
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
    
    // Answer input Enter key handled by keydown listener
    
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
