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
        standardOnly: false,
        themeMode: 'light',
        glowEffect: 'none',
        strictness: 1,  // 0=lenient, 1=normal, 2=strict
        fontSize: 16  // Font size in pixels
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
        players: [],
        currentQuestion: 0,
        questions: [],
        currentQuestionData: null,
        readingPosition: 0,
        currentQuestionWordCount: 0,
        buzzPosition: 0,
        buzzed: false,
        answered: false,
        readingInterval: null,
        timerInterval: null,
        buzzWindowInterval: null,
        buzzWindowTime: 5,
        timeRemaining: CONFIG.TIMER_DURATION
    },
    auth: {
        isLoggedIn: false,
        currentUser: null,
        profilePicture: null
    }
};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAuthState();
    
    // Always show home page and initialize
    showScreen('home');
    initializeNavigation();
    initializeModeCards();
    initializeFilters();
    initializeSettings();
    initializeKeyboardControls();
    initializeSidebarToggle();
    initializeMultiplayer();
    loadSettings();
    loadStatistics();
    initializeAuthPage();
    
    // Update navbar based on login status
    updateNavbar();
});

// ==================== Authentication ====================
function initializeAuthPage() {
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('signup-btn').addEventListener('click', handleSignup);
    
    document.getElementById('auth-username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    document.getElementById('auth-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function handleLogin() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error');
    
    if (!username || !password) {
        setAuthError('Please enter both username and password');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('protoreader-users') || '{}');
    
    if (!users[username] || users[username].password !== password) {
        setAuthError('Invalid username or password');
        return;
    }
    
    // Login successful
    state.auth.isLoggedIn = true;
    state.auth.currentUser = username;
    saveAuthState();
    
    errorDiv.style.display = 'none';
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    
    // Reinitialize the app
    showScreen('home');
    initializeNavigation();
    initializeModeCards();
    initializeFilters();
    initializeSettings();
    initializeKeyboardControls();
    initializeSidebarToggle();
    initializeMultiplayer();
    loadSettings();
    loadStatistics();
    updateNavbar();
}

function handleSignup() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error');
    
    if (!username || !password) {
        setAuthError('Please enter both username and password');
        return;
    }
    
    if (username.length < 3) {
        setAuthError('Username must be at least 3 characters');
        return;
    }
    
    if (password.length < 4) {
        setAuthError('Password must be at least 4 characters');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('protoreader-users') || '{}');
    
    if (users[username]) {
        setAuthError('Username already exists');
        return;
    }
    
    // Create account
    users[username] = { password };
    localStorage.setItem('protoreader-users', JSON.stringify(users));
    
    // Auto-login
    state.auth.isLoggedIn = true;
    state.auth.currentUser = username;
    saveAuthState();
    
    errorDiv.style.display = 'none';
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    
    // Reinitialize the app
    showScreen('home');
    initializeNavigation();
    initializeModeCards();
    initializeFilters();
    initializeSettings();
    initializeKeyboardControls();
    initializeSidebarToggle();
    initializeMultiplayer();
    loadSettings();
    loadStatistics();
    updateNavbar();
}

function setAuthError(message) {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function saveAuthState() {
    localStorage.setItem('protoreader-auth', JSON.stringify({
        isLoggedIn: state.auth.isLoggedIn,
        currentUser: state.auth.currentUser,
        profilePicture: state.auth.profilePicture
    }));
}

function loadAuthState() {
    const saved = localStorage.getItem('protoreader-auth');
    if (saved) {
        const auth = JSON.parse(saved);
        state.auth.isLoggedIn = auth.isLoggedIn;
        state.auth.currentUser = auth.currentUser;
        state.auth.profilePicture = auth.profilePicture;
    }
}

function updateNavbar() {
    const loginLink = document.getElementById('login-link');
    const profileMenu = document.getElementById('profile-menu');
    
    if (state.auth.isLoggedIn) {
        updateNavbarForLoggedIn();
    } else {
        // Show login link, hide profile menu
        loginLink.style.display = 'block';
        profileMenu.style.display = 'none';
    }
}

function updateNavbarForLoggedIn() {
    const loginLink = document.getElementById('login-link');
    const profileMenu = document.getElementById('profile-menu');
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileUsername = document.getElementById('profile-username');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileInitial = document.getElementById('profile-initial');
    const profileImg = document.getElementById('profile-img');
    
    if (state.auth.isLoggedIn) {
        loginLink.style.display = 'none';
        profileMenu.style.display = 'block';
        
        profileUsername.textContent = state.auth.currentUser;
        profileInitial.textContent = state.auth.currentUser[0].toUpperCase();
        
        if (state.auth.profilePicture) {
            profileImg.src = state.auth.profilePicture;
            profileImg.style.display = 'block';
            profileInitial.style.display = 'none';
        }
        
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            profileDropdown.style.display = profileDropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        document.getElementById('logout-nav-btn').addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
        
        document.getElementById('account-settings-link').addEventListener('click', (e) => {
            e.preventDefault();
            profileDropdown.style.display = 'none';
            showScreen('account-settings');
            initializeAccountSettings();
        });
        
        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target)) {
                profileDropdown.style.display = 'none';
            }
        });
    }
}

function handleLogout() {
    state.auth.isLoggedIn = false;
    state.auth.currentUser = null;
    state.auth.profilePicture = null;
    saveAuthState();
    
    document.getElementById('login-link').style.display = 'block';
    document.getElementById('profile-menu').style.display = 'none';
    
    showScreen('login');
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-error').style.display = 'none';
}

// ==================== Account Settings ====================
function initializeAccountSettings() {
    const profilePicInput = document.getElementById('profile-pic-input');
    const avatarDisplay = document.getElementById('account-avatar-display');
    const currentUsername = document.getElementById('account-current-username');
    const newUsernameField = document.getElementById('account-new-username');
    const newPasswordField = document.getElementById('account-new-password');
    const saveBtn = document.getElementById('save-account-btn');
    const backBtn = document.getElementById('back-from-account');
    const errorDiv = document.getElementById('account-error');
    const successDiv = document.getElementById('account-success');
    
    // Display current username
    currentUsername.value = state.auth.currentUser;
    
    // Display profile picture
    displayAccountProfilePicture();
    
    // Avatar click to upload
    avatarDisplay.addEventListener('click', () => {
        profilePicInput.click();
    });
    
    profilePicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                state.auth.profilePicture = event.target.result;
                displayAccountProfilePicture();
                saveAuthState();
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Save changes button
    saveBtn.addEventListener('click', () => {
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';
        
        const newUsername = newUsernameField.value.trim();
        const newPassword = newPasswordField.value;
        
        // Check if new username is valid
        if (newUsername && newUsername.length < 3) {
            setAccountError('New username must be at least 3 characters');
            return;
        }
        
        // Check if new username already exists
        if (newUsername && newUsername !== state.auth.currentUser) {
            const users = JSON.parse(localStorage.getItem('protoreader-users') || '{}');
            if (users[newUsername]) {
                setAccountError('Username already taken');
                return;
            }
        }
        
        // Check if new password is valid
        if (newPassword && newPassword.length < 4) {
            setAccountError('New password must be at least 4 characters');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('protoreader-users') || '{}');
        
        // Update username if provided
        if (newUsername && newUsername !== state.auth.currentUser) {
            users[newUsername] = users[state.auth.currentUser];
            delete users[state.auth.currentUser];
            state.auth.currentUser = newUsername;
        }
        
        // Update password if provided
        if (newPassword) {
            users[state.auth.currentUser].password = newPassword;
        }
        
        // Save to localStorage
        localStorage.setItem('protoreader-users', JSON.stringify(users));
        saveAuthState();
        
        // Update navbar
        updateNavbar();
        
        // Clear fields and show success
        newUsernameField.value = '';
        newPasswordField.value = '';
        
        setAccountSuccess('Account settings updated successfully!');
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    });
    
    // Back button
    backBtn.addEventListener('click', () => {
        showScreen('home');
    });
}

function displayAccountProfilePicture() {
    const avatarDisplay = document.getElementById('account-avatar-display');
    const avatarInitial = document.getElementById('account-avatar-initial');
    const avatarImg = document.getElementById('account-avatar-img');
    const navbarAvatar = document.getElementById('profile-avatar');
    const navbarInitial = document.getElementById('profile-initial');
    const navbarImg = document.getElementById('profile-img');
    
    avatarInitial.textContent = state.auth.currentUser[0].toUpperCase();
    navbarInitial.textContent = state.auth.currentUser[0].toUpperCase();
    
    if (state.auth.profilePicture) {
        avatarImg.src = state.auth.profilePicture;
        avatarImg.style.display = 'block';
        avatarInitial.style.display = 'none';
        
        navbarImg.src = state.auth.profilePicture;
        navbarImg.style.display = 'block';
        navbarInitial.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        avatarInitial.style.display = 'block';
        
        navbarImg.style.display = 'none';
        navbarInitial.style.display = 'block';
    }
}

function setAccountError(message) {
    document.getElementById('account-error').textContent = message;
    document.getElementById('account-error').style.display = 'block';
}

function setAccountSuccess(message) {
    document.getElementById('account-success').textContent = message;
    document.getElementById('account-success').style.display = 'block';
}
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
    
    // Reset multiplayer state
    if (state.multiplayer.socket) {
        state.multiplayer.roomCode = null;
        state.multiplayer.playerName = null;
        state.multiplayer.isHost = false;
        state.multiplayer.players = [];
        state.multiplayer.currentQuestion = 0;
        state.multiplayer.questions = [];
        state.multiplayer.currentQuestionData = null;
        state.multiplayer.readingPosition = 0;
        state.multiplayer.buzzed = false;
        state.multiplayer.answered = false;
        if (state.multiplayer.readingInterval) {
            clearInterval(state.multiplayer.readingInterval);
            state.multiplayer.readingInterval = null;
        }
        if (state.multiplayer.timerInterval) {
            clearInterval(state.multiplayer.timerInterval);
            state.multiplayer.timerInterval = null;
        }
        if (state.multiplayer.buzzWindowInterval) {
            clearInterval(state.multiplayer.buzzWindowInterval);
            state.multiplayer.buzzWindowInterval = null;
        }
    }
    
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
        document.getElementById('player-name').value = '';
        initializeMultiplayer(); // Initialize Socket.io when entering multiplayer mode
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
    const strictnessMap = ['lenient', 'normal', 'strict'];
    const strictnessLevel = strictnessMap[state.settings.strictness || 1];
    
    const response = await fetch(`${CONFIG.API_BASE}/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            answerline: cleanAnswer,
            givenAnswer: userAnswer,
            strictness: strictnessLevel
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
        const strictnessMap = ['lenient', 'normal', 'strict'];
        const strictnessLevel = strictnessMap[state.settings.strictness || 1];
        
        const response = await fetch(`${CONFIG.API_BASE}/check-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answerline: correctAnswer,
                givenAnswer: userAnswer,
                strictness: strictnessLevel
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
    
    // Strictness slider
    const strictnessSlider = document.getElementById('strictness-slider');
    if (strictnessSlider) {
        strictnessSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            state.settings.strictness = value;
            const strictnessLabels = ['Lenient', 'Normal', 'Strict'];
            document.getElementById('strictness-value').textContent = strictnessLabels[value];
        });
    }
    
    // Font size slider
    const fontSizeSlider = document.getElementById('font-size');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            state.settings.fontSize = value;
            document.getElementById('font-size-value').textContent = `${value}px`;
            applyFontSize();
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
    
    // Theme mode listeners
    document.getElementById('theme-light').addEventListener('change', (e) => {
        if (e.target.checked) {
            state.settings.themeMode = 'light';
            applyTheme();
            saveSettings();
        }
    });
    
    document.getElementById('theme-dark').addEventListener('change', (e) => {
        if (e.target.checked) {
            state.settings.themeMode = 'dark';
            applyTheme();
            saveSettings();
        }
    });
    
    // Glow effect listener
    document.getElementById('glow-color').addEventListener('change', (e) => {
        state.settings.glowEffect = e.target.value;
        applyTheme();
        saveSettings();
    });
    
    document.getElementById('save-settings-btn').addEventListener('click', () => {
        saveSettings();
        showCustomAlert('Settings saved!');
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
        
        // Load strictness
        const strictness = state.settings.strictness !== undefined ? state.settings.strictness : 1;
        const strictnessLabels = ['Lenient', 'Normal', 'Strict'];
        const strictnessSlider = document.getElementById('strictness-slider');
        const strictnessValue = document.getElementById('strictness-value');
        if (strictnessSlider && strictnessValue) {
            strictnessSlider.value = strictness;
            strictnessValue.textContent = strictnessLabels[strictness];
        }
        const multiplayerStrictnessSlider = document.getElementById('multiplayer-strictness-slider');
        const multiplayerStrictnessValue = document.getElementById('multiplayer-strictness-value');
        if (multiplayerStrictnessSlider && multiplayerStrictnessValue) {
            multiplayerStrictnessSlider.value = strictness;
            multiplayerStrictnessValue.textContent = strictnessLabels[strictness];
        }
        
        document.getElementById('auto-reveal').checked = state.settings.autoReveal;
        document.getElementById('show-metadata').checked = state.settings.showMetadata;
        document.getElementById('standard-only').checked = state.settings.standardOnly;
        
        // Load font size
        const fontSize = state.settings.fontSize || 16;
        const fontSizeSlider = document.getElementById('font-size');
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeSlider && fontSizeValue) {
            fontSizeSlider.value = fontSize;
            fontSizeValue.textContent = `${fontSize}px`;
        }
        
        // Load theme settings
        const themeMode = state.settings.themeMode || 'light';
        document.getElementById(`theme-${themeMode}`).checked = true;
        
        const glowEffect = state.settings.glowEffect || 'none';
        document.getElementById('glow-color').value = glowEffect;
    }
    // Always apply theme and font size (uses defaults if no saved settings)
    applyTheme();
    applyFontSize();
}

function applyTheme() {
    const themeMode = state.settings.themeMode || 'light';
    const glowEffect = state.settings.glowEffect || 'none';
    
    // Remove all theme classes
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.remove('glow-neon-pink', 'glow-cyan-dream', 'glow-purple-storm', 
                                   'glow-sunset-fire', 'glow-ocean-wave', 'glow-aurora-lights');
    document.body.classList.remove('has-glow');
    
    // Apply theme mode
    document.body.classList.add(`theme-${themeMode}`);
    
    // Apply glow effect
    if (glowEffect !== 'none') {
        document.body.classList.add(`glow-${glowEffect}`);
        document.body.classList.add('has-glow');
    }
}

function applyFontSize() {
    const fontSize = state.settings.fontSize || 16;
    document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);
}

function saveSettings() {
    localStorage.setItem('protoreader-settings', JSON.stringify(state.settings));
}

// ==================== Custom Alert ====================
function showCustomAlert(message = 'Settings saved!') {
    const alertBox = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('custom-alert-message');
    
    alertMessage.textContent = message;
    alertBox.classList.add('show');
    
    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 2000);
}
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

        // Space to buzz in multiplayer
        if (e.code === 'Space' && state.currentScreen === 'multiplayer-game' && !state.multiplayer.buzzed && !state.multiplayer.answered) {
            e.preventDefault();
            buzzMultiplayer();
        }
        
        // Enter to submit answer
        if (e.code === 'Enter' && state.currentScreen === 'tossup-game' && state.buzzed && !state.answered) {
            if (document.activeElement.id === 'answer-input') {
                submitAnswer();
            }
        }

        // Enter to submit answer in multiplayer
        if (e.code === 'Enter' && state.currentScreen === 'multiplayer-game' && state.multiplayer.buzzed && !state.multiplayer.answered) {
            if (document.activeElement.id === 'multiplayer-answer-input') {
                submitMultiplayerAnswer();
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
    document.getElementById('back-to-home-mp-1')?.addEventListener('click', resetToHome);
    document.getElementById('back-to-home-mp-2')?.addEventListener('click', resetToHome);
}

// ==================== Database Search ====================
// Placeholder for future implementation
document.getElementById('search-btn')?.addEventListener('click', () => {
    alert('Database search feature coming soon!');
});

// ==================== Multiplayer ====================
function initializeMultiplayer() {
    // Only initialize Socket.io if it's available and not already connected
    if (typeof io === 'undefined' || state.multiplayer.socket) {
        return;
    }
    
    // Connect to Socket.io server
    state.multiplayer.socket = io();

    // Handle player name entry
    document.getElementById('proceed-multiplayer-btn').addEventListener('click', () => {
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        state.multiplayer.playerName = playerName;
        document.getElementById('lobby-player-name').textContent = playerName;
        showScreen('multiplayer-lobby');
        
        // Request rooms list
        state.multiplayer.socket.emit('getRooms');
    });

    // Back buttons
    document.getElementById('back-to-home-mp-1').addEventListener('click', resetToHome);
    document.getElementById('back-to-home-mp-2').addEventListener('click', resetToHome);

    // Create room button
    document.getElementById('create-room-btn').addEventListener('click', () => {
        state.multiplayer.socket.emit('createRoom', { playerName: state.multiplayer.playerName });
    });

    // Refresh rooms button
    document.getElementById('refresh-rooms-btn').addEventListener('click', () => {
        state.multiplayer.socket.emit('getRooms');
    });

    // Leave room button
    document.getElementById('leave-room-btn').addEventListener('click', () => {
        state.multiplayer.socket.emit('leaveRoom', { roomCode: state.multiplayer.roomCode });
        resetToHome();
    });

    // Start game button (host only)
    document.getElementById('start-multiplayer-btn').addEventListener('click', () => {
        startMultiplayerGameAuto();
    });
    
    // End game button
    document.getElementById('end-multiplayer-game-btn').addEventListener('click', () => {
        state.multiplayer.socket.emit('leaveRoom', { roomCode: state.multiplayer.roomCode });
        resetToHome();
    });

    // Multiplayer answer input
    document.getElementById('multiplayer-submit-answer-btn').addEventListener('click', submitMultiplayerAnswer);

    // Multiplayer strictness slider
    const multiplayerStrictnessSlider = document.getElementById('multiplayer-strictness-slider');
    if (multiplayerStrictnessSlider) {
        multiplayerStrictnessSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            state.settings.strictness = value;
            const strictnessLabels = ['Lenient', 'Normal', 'Strict'];
            document.getElementById('multiplayer-strictness-value').textContent = strictnessLabels[value] || value;
        });
    }

    // Multiplayer sidebar toggle
    const mpSidebarToggle = document.getElementById('multiplayer-sidebar-toggle');
    const mpSidebar = document.getElementById('multiplayer-game-sidebar');
    if (mpSidebarToggle && mpSidebar) {
        mpSidebarToggle.addEventListener('click', () => {
            mpSidebar.classList.toggle('collapsed');
            const icon = mpSidebarToggle.querySelector('.toggle-icon');
            if (mpSidebar.classList.contains('collapsed')) {
                icon.textContent = '▶';
            } else {
                icon.textContent = '◀';
            }
        });
    }

    // ==================== Socket.io Event Listeners ====================
    state.multiplayer.socket.on('roomCreated', (data) => {
        console.log('Room created:', data.roomCode);
        state.multiplayer.roomCode = data.roomCode;
        state.multiplayer.isHost = true;
        document.getElementById('current-room-code').textContent = data.roomCode;
        document.getElementById('start-multiplayer-btn').style.display = 'block';
        document.getElementById('waiting-for-host').style.display = 'none';
        showScreen('multiplayer-room');
        console.log('Host can now click "Start Game" button to begin');
    });

    state.multiplayer.socket.on('roomJoined', (data) => {
        console.log('Room joined:', data.roomCode);
        state.multiplayer.roomCode = data.roomCode;
        state.multiplayer.isHost = false;
        document.getElementById('current-room-code').textContent = data.roomCode;
        document.getElementById('start-multiplayer-btn').style.display = 'none';
        document.getElementById('waiting-for-host').style.display = 'block';
        document.getElementById('waiting-for-host').textContent = 'Waiting for host to start game...';
        showScreen('multiplayer-room');
        updatePlayersList(data.players);
    });

    state.multiplayer.socket.on('updatePlayers', (players) => {
        console.log('Players updated:', players);
        
        // Detect new players
        players.forEach(newPlayer => {
            const wasAlreadyHere = state.multiplayer.players.some(p => p.id === newPlayer.id);
            if (!wasAlreadyHere) {
                appendPlayerJoinedLog(newPlayer.name);
            }
        });
        
        state.multiplayer.players = players;
        updatePlayersList(players);
    });

    state.multiplayer.socket.on('error', (message) => {
        console.error('Socket error:', message);
        alert('Error: ' + message);
        resetToHome();
    });

    state.multiplayer.socket.on('roomsList', (roomsList) => {
        console.log('Rooms list received:', roomsList);
        displayRoomsList(roomsList);
    });

    state.multiplayer.socket.on('gameStarted', (data) => {
        console.log('Game started');
        state.multiplayer.currentQuestion = 0;
        state.multiplayer.questions = data.questions;
        state.multiplayer.players = data.players;
        resetMultiplayerQuestionState();
        showScreen('multiplayer-game');
        loadMultiplayerQuestion(data.questions);
    });

    state.multiplayer.socket.on('playerBuzzed', (playerName) => {
        console.log('Player buzzed:', playerName);
        document.getElementById('multiplayer-buzz-status').textContent = `${playerName} buzzed in!`;
        document.getElementById('multiplayer-buzz-status').style.color = 'var(--warning)';
    });

    state.multiplayer.socket.on('answerResult', (data) => {
        console.log('Answer result:', data);
        // Update scores
        updateMultiplayerScores(data.players);
        // Show feedback
        if (data.correct) {
            document.getElementById('multiplayer-answer-feedback').textContent = `✓ ${data.playerName} is correct!`;
            document.getElementById('multiplayer-answer-feedback').className = 'answer-feedback correct';
        } else {
            document.getElementById('multiplayer-answer-feedback').textContent = `✗ ${data.playerName} is incorrect. Answer: ${data.answer}`;
            document.getElementById('multiplayer-answer-feedback').className = 'answer-feedback incorrect';
        }
    });

    state.multiplayer.socket.on('nextQuestion', () => {
        console.log('Moving to next question');
        state.multiplayer.currentQuestion++;
        resetMultiplayerQuestionState();
        const questions = state.multiplayer.questions;
        if (state.multiplayer.currentQuestion < questions.length) {
            loadMultiplayerQuestion(questions);
        }
    });

    state.multiplayer.socket.on('gameEnded', (data) => {
        console.log('Game ended');
        alert('Game Over! Final Scores:\n' + 
              data.players.map(p => `${p.name}: ${p.score}`).join('\n'));
        resetToHome();
    });
}

function updatePlayersList(players) {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    players.forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.style.cssText = 'padding: 0.75rem; background: var(--bg-primary); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
        playerEl.innerHTML = `
            <span>${player.name}${player.isHost ? ' <strong style="color: var(--primary);">(Host)</strong>' : ''}</span>
            <span style="color: var(--text-light);">${player.score} pts</span>
        `;
        list.appendChild(playerEl);
    });
}

function displayRoomsList(roomsList) {
    const roomsListDiv = document.getElementById('rooms-list');
    roomsListDiv.innerHTML = '';
    
    if (roomsList.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'text-align: center; color: var(--text-light); padding: 2rem;';
        emptyMsg.textContent = 'No active rooms. Create one to get started!';
        roomsListDiv.appendChild(emptyMsg);
        return;
    }
    
    roomsList.forEach(room => {
        const roomEl = document.createElement('div');
        roomEl.style.cssText = 'padding: 1rem; background: var(--bg-primary); border: 2px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;';
        roomEl.onmouseover = () => roomEl.style.borderColor = 'var(--primary)';
        roomEl.onmouseout = () => roomEl.style.borderColor = 'var(--border)';
        
        const leftDiv = document.createElement('div');
        leftDiv.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 0.25rem;">Room ${room.code}</div>
            <div style="font-size: 0.9rem; color: var(--text-light);">Host: ${room.hostName}</div>
            <div style="font-size: 0.9rem; color: var(--text-light);">${room.playerCount} player${room.playerCount !== 1 ? 's' : ''} ${room.gameStarted ? '(In progress)' : '(Waiting)'}</div>
        `;
        
        const joinBtn = document.createElement('button');
        joinBtn.className = 'start-btn';
        joinBtn.textContent = 'Join';
        joinBtn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.9rem;';
        joinBtn.onclick = () => {
            state.multiplayer.socket.emit('joinRoom', { 
                roomCode: room.code,
                playerName: state.multiplayer.playerName 
            });
        };
        
        roomEl.appendChild(leftDiv);
        roomEl.appendChild(joinBtn);
        roomsListDiv.appendChild(roomEl);
    });
}

function appendPlayerJoinedLog(playerName) {
    const log = document.getElementById('multiplayer-buzz-log');
    if (!log) return;

    const empty = log.querySelector('.buzz-log-empty');
    if (empty) {
        empty.remove();
    }

    const item = document.createElement('div');
    item.className = 'buzz-log-item';
    item.style.cssText = 'background: var(--bg-secondary); border-left: 3px solid var(--primary);';

    const icon = document.createElement('span');
    icon.className = 'buzz-log-icon';
    icon.textContent = '→';
    icon.style.color = 'var(--primary)';

    const body = document.createElement('div');
    body.className = 'buzz-log-body';

    const line1 = document.createElement('div');
    line1.className = 'buzz-log-line';
    line1.style.color = 'var(--primary)';
    line1.textContent = `${playerName} joined the room`;

    body.appendChild(line1);
    item.append(icon, body);
    log.prepend(item);
}

async function loadMultiplayerQuestion(questions) {
    try {
        const question = questions[state.multiplayer.currentQuestion];
        state.multiplayer.currentQuestionData = question;
        
        const metadataEl = document.getElementById('multiplayer-question-metadata');
        const textEl = document.getElementById('multiplayer-question-text');
        
        if (state.settings.showMetadata) {
            const difficultyObj = CONFIG.DIFFICULTIES.find(d => d.value === question.difficulty);
            const difficultyName = difficultyObj ? difficultyObj.display : question.difficulty;
            metadataEl.textContent = `${question.category} | ${question.subcategory} | ${difficultyName} | ${question.tournament} ${question.year}`;
            metadataEl.style.display = 'block';
        } else {
            metadataEl.style.display = 'none';
        }
        
        textEl.textContent = '';
        document.getElementById('multiplayer-progress-fill').style.width = '0%';
        
        startMultiplayerReading();
    } catch (error) {
        console.error('Error loading multiplayer question:', error);
    }
}

function startMultiplayerReading() {
    const question = state.multiplayer.currentQuestionData;
    const cleanText = stripHtmlTags(question.question);
    const words = cleanText.split(' ');
    state.multiplayer.currentQuestionWordCount = words.length;
    const wordsPerSecond = state.settings.readingSpeed / 60;
    const intervalMs = 1000 / wordsPerSecond;
    
    state.multiplayer.readingPosition = 0;
    state.multiplayer.readingInterval = setInterval(() => {
        if (state.multiplayer.buzzed) {
            stopMultiplayerReading();
            return;
        }
        
        if (state.multiplayer.readingPosition < words.length) {
            const textEl = document.getElementById('multiplayer-question-text');
            textEl.textContent = words.slice(0, state.multiplayer.readingPosition + 1).join(' ');
            state.multiplayer.readingPosition++;
            
            const progress = (state.multiplayer.readingPosition / words.length) * 100;
            document.getElementById('multiplayer-progress-fill').style.width = `${progress}%`;
        } else {
            stopMultiplayerReading();
            startMultiplayerBuzzWindow();
        }
    }, intervalMs);
}

function stopMultiplayerReading() {
    if (state.multiplayer.readingInterval) {
        clearInterval(state.multiplayer.readingInterval);
        state.multiplayer.readingInterval = null;
    }
}

function startMultiplayerBuzzWindow() {
    state.multiplayer.buzzWindowTime = 5;
    state.multiplayer.buzzWindowInterval = setInterval(() => {
        state.multiplayer.buzzWindowTime--;
        
        if (state.multiplayer.buzzWindowTime <= 0) {
            stopMultiplayerBuzzWindow();
        }
    }, 1000);
}

function stopMultiplayerBuzzWindow() {
    if (state.multiplayer.buzzWindowInterval) {
        clearInterval(state.multiplayer.buzzWindowInterval);
        state.multiplayer.buzzWindowInterval = null;
    }
}

function buzzMultiplayer() {
    if (state.multiplayer.buzzed) return;
    
    state.multiplayer.buzzed = true;
    state.multiplayer.buzzPosition = state.multiplayer.readingPosition;
    stopMultiplayerReading();
    stopMultiplayerBuzzWindow();
    
    document.getElementById('multiplayer-buzz-status').textContent = 'You buzzed! Enter your answer:';
    document.getElementById('multiplayer-buzz-status').style.color = 'var(--warning)';
    document.getElementById('multiplayer-buzz-status').style.fontWeight = '700';
    
    const answerInput = document.getElementById('multiplayer-answer-input');
    answerInput.disabled = false;
    answerInput.placeholder = 'Type your answer...';
    answerInput.focus();
    
    // Emit buzz to server
    state.multiplayer.socket.emit('buzz', { 
        roomCode: state.multiplayer.roomCode,
        playerName: state.multiplayer.playerName 
    });
    
    startMultiplayerTimer();
}

async function startMultiplayerGameAuto() {
    try {
        // Load 10 questions for the multiplayer game
        const questionsPromises = [];
        for (let i = 0; i < 10; i++) {
            questionsPromises.push(fetchTossup());
        }
        const questions = await Promise.all(questionsPromises);
        state.multiplayer.questions = questions;
        
        state.multiplayer.socket.emit('startGame', {
            roomCode: state.multiplayer.roomCode,
            questions: questions
        });
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions. Please try again.');
    }
}

function startMultiplayerTimer() {
    state.multiplayer.timeRemaining = CONFIG.TIMER_DURATION;
    state.multiplayer.timerInterval = setInterval(() => {
        state.multiplayer.timeRemaining--;
        
        if (state.multiplayer.timeRemaining <= 0) {
            stopMultiplayerTimer();
            submitMultiplayerAnswer();
        }
    }, 1000);
}

function stopMultiplayerTimer() {
    if (state.multiplayer.timerInterval) {
        clearInterval(state.multiplayer.timerInterval);
        state.multiplayer.timerInterval = null;
    }
}

async function submitMultiplayerAnswer() {
    if (state.multiplayer.answered) return;
    
    const userAnswer = document.getElementById('multiplayer-answer-input').value.trim();
    state.multiplayer.answered = true;
    stopMultiplayerTimer();
    
    if (!userAnswer) {
        state.multiplayer.socket.emit('submitAnswer', {
            roomCode: state.multiplayer.roomCode,
            playerName: state.multiplayer.playerName,
            correct: false,
            correctAnswer: stripHtmlTags(state.multiplayer.currentQuestionData.answer)
        });
        return;
    }
    
    try {
        const result = await checkAnswer(userAnswer);
        const correct = result.directive?.toLowerCase() === 'accept';
        
        state.multiplayer.socket.emit('submitAnswer', {
            roomCode: state.multiplayer.roomCode,
            playerName: state.multiplayer.playerName,
            correct: correct,
            correctAnswer: stripHtmlTags(state.multiplayer.currentQuestionData.answer)
        });
    } catch (error) {
        console.error('Error checking answer:', error);
        // Fallback
        const cleanAnswer = stripHtmlTags(state.multiplayer.currentQuestionData.answer).toLowerCase();
        const correct = userAnswer.toLowerCase().includes(cleanAnswer.slice(0, 5));
        
        state.multiplayer.socket.emit('submitAnswer', {
            roomCode: state.multiplayer.roomCode,
            playerName: state.multiplayer.playerName,
            correct: correct,
            correctAnswer: stripHtmlTags(state.multiplayer.currentQuestionData.answer)
        });
    }
}

function resetMultiplayerQuestionState() {
    state.multiplayer.readingPosition = 0;
    state.multiplayer.currentQuestionWordCount = 0;
    state.multiplayer.buzzed = false;
    state.multiplayer.answered = false;
    state.multiplayer.buzzPosition = 0;
    state.multiplayer.timeRemaining = CONFIG.TIMER_DURATION;
    
    document.getElementById('multiplayer-buzz-status').textContent = '';
    const answerInput = document.getElementById('multiplayer-answer-input');
    answerInput.value = '';
    answerInput.disabled = true;
    answerInput.placeholder = 'Buzz first to answer...';
    document.getElementById('multiplayer-answer-feedback').textContent = '';
    document.getElementById('multiplayer-answer-feedback').className = 'answer-feedback';
}

function updateMultiplayerScores(players) {
    const scoresDiv = document.getElementById('multiplayer-scores');
    scoresDiv.innerHTML = '';
    
    players.forEach(player => {
        const scorePill = document.createElement('div');
        scorePill.className = 'stat-pill';
        const label = player.name === state.multiplayer.playerName ? 'Your Score:' : `${player.name}:`;
        scorePill.innerHTML = `${label} <span>${player.score}</span>`;
        scoresDiv.appendChild(scorePill);
    });
}
