# ProtoReader - Quiz Bowl Practice Platform

A modern, original Quiz Bowl practice platform with single-player modes powered by real questions from the QBreader API.

## Features

### Core Practice Modes
- **Tossup Practice**: Practice with unlimited real quiz bowl tossup questions
- **Bonus Practice**: Master three-part bonus questions with individual scoring
- **Smart Reading**: Progressive reading at adjustable speeds (50-500 WPM)
- **Realistic Buzzer**: Press SPACE to buzz in - answer field disabled until you buzz
- **5-Second Timer**: Just like real quiz bowl - answer within 5 seconds with visual countdown
- **Adjustable Reading Speed**: Control how fast questions are read (50-500 WPM)
- **Category Filtering**: Choose from 12+ quiz bowl categories (Literature, History, Science, etc.)
- **Difficulty Levels**: 10 difficulty levels
- **Real Quiz Bowl Questions**: Powered by QBreader API with thousands of questions from actual tournaments
- **Smart Answer Checking**: Uses QBreader's answer checker for accurate grading

### Advanced Features
- Clean HTML tag removal - questions display without markup
- Question metadata display (category, subcategory, tournament, year, difficulty)
- Category filtering (12 categories including Literature, History, Science, etc.)
- Difficulty filtering (1-10 difficulty levels)
- Year range filtering
- Case-insensitive answer checking
- Persistent statistics tracking (localStorage)
- Real-time reading speed adjustment during practice
- Responsive design for desktop and mobile
- Keyboard shortcuts for power users

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

## Running the Application

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

For development with auto-reload:
```bash
npm run dev
```

## How to Play

### Tossup Practice
1. Click **"TU"** (Tossups) on the home screen
2. Select categories, difficulties, and year range (optional - leave blank for all)
3. Click **"Start Practice"**
4. Questions will begin reading automatically at your set speed
5. **Press SPACE** to buzz in when you know the answer
6. Type your answer in the text field and press **ENTER** or click **Submit**
7. Your answer will be checked and displayed with the correct answer
8. Click **"Next Question"** to continue practicing

### Bonus Practice
1. Click **"B"** (Bonuses) on the home screen
2. Select your filters and click **"Start Practice"**
3. Each bonus has 3 parts worth 10 points each
4. Answer each part sequentially
5. You get **30 points maximum** per bonus
6. Track your PPB (Points Per Bonus) average

### Settings
Adjust your experience in the **Settings** screen:
- **Reading Speed**: 50-500 WPM (default: 250)
- **Auto-reveal answers**: Automatically show correct answer after submitting
- **Show metadata**: Display question source and difficulty
- **Standard format only**: Filter to standard-format questions

## Scoring System

### Tossups
- **10 points** for correct answer
- **0 points** for incorrect or timed-out answer
- Accuracy percentage shown in real-time

### Bonuses
- **10 points** per correct part
- **0 points** per incorrect part
- **PPB (Points Per Bonus)** displayed: Total points ÷ bonuses played

## Timer System

After buzzing in, you have **5 seconds** to answer:
- **5-3 seconds**: Green
- **3-2 seconds**: Yellow (warning)
- **Under 2 seconds**: Red and pulsing
- **0 seconds**: Auto-submit if empty

## Controls & Keyboard Shortcuts

| Action | Control |
|--------|---------|
| Buzz in | **SPACE** or read question fully |
| Submit answer | **ENTER** or click Submit button |
| Next question | **N** or click Next button |
| Pause reading | Click Pause button |
| Skip question | Click Skip button |
| End session | Click End Session button |

## Settings Overview

### Reading Speed Range
- **50 WPM** - Very slow (learning mode)
- **250 WPM** - Standard (default)
- **500 WPM** - Very fast (challenge mode)
- **Adjust anytime** during practice with the slider

### Categories (Multi-select)
Literature, History, Science, Fine Arts, Religion, Mythology, Philosophy, Social Science, Current Events, Geography, Other Academic, Trash

### Difficulty Levels (Multi-select)
1-10 scale matching quiz bowl tournament difficulty standards

### Filters
- Leave selections empty to get questions from ALL categories/difficulties
- Select specific options to focus your practice
- Adjust year range to practice recent or vintage questions

## Statistics

Your practice statistics are automatically saved:
- **Tossup Stats**: Total played, correct, incorrect, accuracy %
- **Bonus Stats**: Total played, total points, parts correct, average PPB
- View in **Statistics** screen
- Stats persist across browser sessions (localStorage)

## Data & Privacy

- All statistics stored locally in your browser
- No data sent to external servers except QBreader API calls
- You can clear stats anytime from the Statistics screen

## Technical Stack

### Frontend
- HTML5 (semantic markup)
- CSS3 (custom design, responsive layout)
- Vanilla JavaScript (no frameworks)
- Clean, minimal UI design

### Backend
- Node.js + Express (static file server)
- No database required (browser localStorage only)

### API
- **QBreader API** (https://www.qbreader.org/api)
  - `/random-tossup` - Fetch random tossup questions
  - `/random-bonus` - Fetch random bonus questions
  - `/check-answer` - Intelligent answer validation
- Billions of questions from actual quiz bowl tournaments

## Browser Requirements

- Modern browser with JavaScript enabled
- Chrome, Firefox, Safari, or Edge (latest versions)
- Internet connection for question loading

## Troubleshooting

**Questions won't load?**
- Check internet connection
- Verify QBreader API is accessible
- Check browser console for errors (F12)
- Try different categories/filters

**Buzz not working?**
- Ensure page has focus (click on it first)
- Try spacebar
- Check that question reading has started

**Answer not being checked?**
- Ensure you've buzzed in first
- Check that answer field is enabled
- Verify internet connection

**Stats not saving?**
- Enable localStorage cookies in browser settings
- Check browser console for errors
- Try clearing and reloading

## Known Limitations

- Multiplayer mode coming soon
- Database search coming soon
- No user accounts (browser-local only)
- No power marks yet (instant 10 points detection)

## Future Enhancements

- Real-time multiplayer matches
- Power mark detection
- Question database search
- User accounts and cloud statistics
- Leaderboards
- Tournament mode
- Custom question sets
- Voice reading option
- Mobile app version
- Advanced statistics and heatmaps

## Created By

Lawrence Tong

## API & Credits

Questions and answer validation powered by:
- **QBreader** (https://www.qbreader.org/)
- Questions from (https://quizbowlpackets.com/)

Thank you to the QBreader team for this excellent resource!

## License

MIT License - Open source and free to use for quiz bowl practice

## Feedback & Issues

Have suggestions or found a bug? Open an issue on GitHub!

---

**ProtoReader** - Your personal quiz bowl practice partner. Made for competitors, by a competitor.
