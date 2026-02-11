const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// VIP Codes storage
// Option 1: Hardcoded list (for testing)
const VIP_CODES = [
    'PROTO2024',
    'READER2024',
    'PLUS2024'
];

// Option 2: Load from environment variables (more secure)
// Format: VIP_CODES_LIST=CODE1,CODE2,CODE3
const envCodes = process.env.VIP_CODES_LIST ? process.env.VIP_CODES_LIST.split(',') : [];
const VALID_VIP_CODES = [...VIP_CODES, ...envCodes];

// Track used codes to prevent reuse (optional)
const usedCodes = new Set();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Leaderboard storage
const leaderboard = new Map(); // Map of username -> { pp20tuh, tossupsPlayed, isVIP, nameColor }

app.post('/api/update-leaderboard', (req, res) => {
    const { username, pp20tuh, tossupsPlayed, isVIP, nameColor } = req.body;
    
    if (!username || pp20tuh === undefined || tossupsPlayed === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Only add to leaderboard if at least 1 tossup played
    if (tossupsPlayed > 0) {
        leaderboard.set(username, {
            username,
            pp20tuh,
            tossupsPlayed,
            isVIP: isVIP || false,
            nameColor: nameColor || null
        });
    }
    
    return res.status(200).json({ success: true });
});

app.get('/api/leaderboard', (req, res) => {
    const sorted = Array.from(leaderboard.values())
        .sort((a, b) => b.pp20tuh - a.pp20tuh)
        .slice(0, 50); // Top 50
    
    return res.status(200).json(sorted);
});

app.post('/api/validate-vip-code', (req, res) => {
    const { code, username } = req.body;
    
    if (!code || !username) {
        return res.status(400).json({ 
            success: false, 
            message: 'Code and username are required' 
        });
    }
    
    const trimmedCode = code.trim().toUpperCase();
    
    // Check if code is valid
    if (!VALID_VIP_CODES.includes(trimmedCode)) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid VIP code' 
        });
    }
    
    // Optional: Prevent code reuse
    if (usedCodes.has(trimmedCode)) {
        return res.status(401).json({ 
            success: false, 
            message: 'This code has already been used' 
        });
    }
    
    // Mark code as used
    usedCodes.add(trimmedCode);
    
    console.log(`VIP code claimed by ${username}: ${trimmedCode}`);
    
    return res.status(200).json({ 
        success: true, 
        message: 'VIP code validated successfully' 
    });
});

// Game state management
const rooms = new Map();

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('getRooms', () => {
        const roomsList = Array.from(rooms.values()).map(room => ({
            code: room.code,
            playerCount: room.players.length,
            gameStarted: room.gameStarted,
            hostName: room.players.find(p => p.isHost)?.name || 'Unknown'
        }));
        socket.emit('roomsList', roomsList);
    });

    socket.on('createRoom', (data) => {
        const roomCode = generateRoomCode();
        const room = {
            code: roomCode,
            host: socket.id,
            players: [{
                id: socket.id,
                name: data.playerName,
                score: 0,
                isHost: true,
                isVIP: data.isVIP || false,
                nameColor: data.nameColor || null
            }],
            gameStarted: false,
            currentQuestion: 0,
            questions: [],
            buzzedPlayer: null
        };

        rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.roomCode = roomCode;

        socket.emit('roomCreated', { roomCode });
        console.log(`Room created: ${roomCode} by ${data.playerName}`);
    });

    socket.on('joinRoom', (data) => {
        const room = rooms.get(data.roomCode);

        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        
        // Check if player is already in the room
        const existingPlayer = room.players.find(p => p.id === socket.id);
        if (existingPlayer) {
            // Already in room, just send them the current state
            socket.emit('roomJoined', {
                roomCode: data.roomCode,
                players: room.players
            });
            // If game is already started, send game state
            if (room.gameStarted) {
                socket.emit('gameStarted', {
                    questions: room.questions,
                    players: room.players,
                    currentQuestion: room.currentQuestion
                });
            }
            return;
        }

        const player = {
            id: socket.id,
            name: data.playerName,
            score: 0,
            isHost: false,
            isVIP: data.isVIP || false,
            nameColor: data.nameColor || null
        };

        room.players.push(player);
        socket.join(data.roomCode);
        socket.roomCode = data.roomCode;

        socket.emit('roomJoined', {
            roomCode: data.roomCode,
            players: room.players
        });

        io.to(data.roomCode).emit('updatePlayers', room.players);
        // If game is already started, send game state to the new player
        if (room.gameStarted) {
            socket.emit('gameStarted', {
                questions: room.questions,
                players: room.players,
                currentQuestion: room.currentQuestion
            });
        }
        console.log(`${data.playerName} joined room ${data.roomCode}`);
    });

    socket.on('startGame', (data) => {
        const room = rooms.get(data.roomCode);

        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        if (socket.id !== room.host) {
            socket.emit('error', 'Only host can start the game');
            return;
        }

        room.gameStarted = true;
        room.questions = data.questions;
        room.currentQuestion = 0;

        io.to(data.roomCode).emit('gameStarted', {
            questions: room.questions,
            players: room.players
        });

        console.log(`Game started in room ${data.roomCode}`);
    });

    socket.on('buzz', (data) => {
        const room = rooms.get(data.roomCode);

        if (!room || !room.gameStarted) {
            return;
        }

        if (!room.buzzedPlayer) {
            room.buzzedPlayer = data.playerName;
            io.to(data.roomCode).emit('playerBuzzed', data.playerName);
            console.log(`${data.playerName} buzzed in room ${data.roomCode}`);
        }
    });

    socket.on('submitAnswer', (data) => {
        const room = rooms.get(data.roomCode);

        if (!room || !room.gameStarted) {
            return;
        }

        const player = room.players.find(p => p.name === data.playerName);
        if (player && data.correct) {
            player.score += 10;
        }

        io.to(data.roomCode).emit('answerResult', {
            playerName: data.playerName,
            correct: data.correct,
            answer: data.correctAnswer,
            players: room.players
        });

        // Reset for next question
        room.buzzedPlayer = null;
        room.currentQuestion++;

        setTimeout(() => {
            if (room.currentQuestion < room.questions.length) {
                io.to(data.roomCode).emit('nextQuestion');
            } else {
                io.to(data.roomCode).emit('gameEnded', {
                    players: room.players
                });
                room.gameStarted = false;
            }
        }, 3000);
    });

    socket.on('leaveRoom', (data) => {
        const room = rooms.get(data.roomCode);

        if (room) {
            room.players = room.players.filter(p => p.id !== socket.id);
            socket.leave(data.roomCode);
            
            // Clear the socket's room code
            delete socket.roomCode;

            if (room.players.length === 0) {
                rooms.delete(data.roomCode);
                console.log(`Room ${data.roomCode} deleted (empty)`);
            } else {
                // If host left, assign new host
                if (socket.id === room.host && room.players.length > 0) {
                    room.host = room.players[0].id;
                    room.players[0].isHost = true;
                }
                io.to(data.roomCode).emit('updatePlayers', room.players);
            }
            
            console.log(`${socket.id} left room ${data.roomCode}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Clean up rooms when user disconnects
        if (socket.roomCode) {
            const room = rooms.get(socket.roomCode);
            if (room) {
                room.players = room.players.filter(p => p.id !== socket.id);

                if (room.players.length === 0) {
                    rooms.delete(socket.roomCode);
                    console.log(`Room ${socket.roomCode} deleted (empty)`);
                } else {
                    // If host disconnected, assign new host
                    if (socket.id === room.host) {
                        room.host = room.players[0].id;
                        room.players[0].isHost = true;
                    }
                    io.to(socket.roomCode).emit('updatePlayers', room.players);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
