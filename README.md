# QB Reader - Quiz Bowl Practice Website

A full-featured Quiz Bowl practice website with single-player and multiplayer modes, powered by real quiz bowl questions from the QBreader API.

## Features

### Core Features
- ✅ **Tossup Practice Mode**: Practice with unlimited real quiz bowl questions
- ✅ **Multiplayer Mode**: Compete with friends in real-time
- ✅ **Buzzer System**: Press spacebar or click to buzz in
- ✅ **5-Second Timer**: Just like real quiz bowl - answer within 5 seconds of buzzing
- ✅ **Adjustable Reading Speed**: Control how fast questions are read (50-300 WPM)
- ✅ **Category Filtering**: Choose from 12+ quiz bowl categories (Literature, History, Science, etc.)
- ✅ **Difficulty Levels**: 9 difficulty levels from Middle School to Open
- ✅ **Real Quiz Bowl Questions**: Powered by QBreader API with thousands of questions from actual tournaments
- ✅ **Smart Answer Checking**: Uses QBreader's answer checker for accurate grading

### Advanced Features
- Progressive question reading with visual progress indicator
- Question metadata display (category, tournament, year, difficulty)
- Keyboard shortcuts (Spacebar to buzz, Enter to submit)
- Room-based multiplayer with unique codes
- Host controls for multiplayer games
- Timer with visual warnings (green → yellow → red)
- Unlimited practice mode (no question limits)
- Responsive design for mobile and desktop

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

### Single Player Mode (Tossups)
1. Click "Tossups" from the main menu
2. Enter your name
3. Adjust settings (reading speed, categories, difficulties) if desired
4. Click "Start Practice"
5. The question will begin reading automatically
6. Press spacebar to buzz in when you know the answer
7. You have 5 seconds to type and submit your answer
8. Continue practicing with unlimited questions!

### Multiplayer Mode
1. One player creates a room by clicking "Create Room"
2. Share the room code with other players
3. Other players click "Join Room" and enter the code
4. Host starts the game when all players are ready
5. First to buzz gets 5 seconds to answer
6. Winner is determined by highest score

## Settings

### Reading Speed
- Range: 50-300 words per minute
- Default: 150 WPM (standard quiz bowl speed)

### Categories (Multi-select)
- Literature
- History
- Science
- Fine Arts
- Religion
- Mythology
- Philosophy
- Social Science
- Current Events
- Geography
- Other Academic
- Trash

### Difficulty Levels (Multi-select)
- 1: Middle School
- 2: Easy High School
- 3: Regular High School (default)
- 4: Hard High School
- 5: National High School
- 6: Easy College
- 7: Regular College
- 8: Hard College
- 9: Open

*Leave selections empty to practice all categories/difficulties*

## Controls

- **Spacebar**: Buzz in during question reading
- **Enter**: Submit answer
- **Skip Button**: Skip current question
- **Show Answer Button**: Reveal the correct answer
- **End Game Button**: End current session and view stats

## Timer System

After buzzing:
- You have **5 seconds** to answer
- Timer shows in **green** (5-3 seconds)
- Timer turns **yellow** (3-2 seconds) 
- Timer turns **red** and pulses (under 2 seconds)
- If time expires, the question is marked incorrect

## Scoring

- **10 points** for correct answers
- **0 points** for incorrect or timed-out answers
- Future: Power marks (15 points) for early buzzes

## Technical Details

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Socket.io client for real-time multiplayer
- Clean, minimalist design inspired by qbreader.org
- Responsive layout with smooth animations

### Backend
- Node.js with Express
- Socket.io for WebSocket connections
- Room-based game state management

### API Integration
- **QBreader API** (https://www.qbreader.org/api)
  - `/random-tossup` - Fetch random quiz bowl questions
  - `/check-answer` - Intelligent answer checking
- Thousands of questions from actual quiz bowl tournaments
- Questions parsed from quizbowlpackets.com

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

**Questions not loading?**
- Check your internet connection
- The QBreader API might be temporarily unavailable
- Check browser console for errors

**Multiplayer not working?**
- Ensure the server is running on port 3000
- Check that all players can reach the server
- Verify firewall settings

**Buzzer not responding?**
- Make sure the page has focus
- Try clicking on the page before pressing spacebar
- Check that question reading has started

**Timer not working?**
- Ensure JavaScript is enabled
- Try refreshing the page
- Check browser console for errors

## Future Enhancements

- Power mark detection and bonus points
- Bonus questions support
- User accounts and statistics tracking
- Leaderboards
- Custom question sets
- Tournament mode
- Voice reading option
- Mobile app version
- Power mark training mode
- Detailed statistics and charts

## API Credits

Questions and answer checking powered by:
- **QBreader** (https://www.qbreader.org/)
- Questions sourced from (https://quizbowlpackets.com/)

Special thanks to the QBreader team for providing this excellent API!

## License

MIT License - Feel free to use and modify for your own quiz bowl practice!

## Contributing

Found a bug or have a feature request? Please open an issue on GitHub!

## About Quiz Bowl

Quiz Bowl is an academic competition where teams compete to answer questions from various subjects. Questions are read aloud, and players can "buzz in" to answer at any point. This website simulates that experience for practice purposes.
