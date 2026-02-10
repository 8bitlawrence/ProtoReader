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

// Serve static files
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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
                isHost: true
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

        const player = {
            id: socket.id,
            name: data.playerName,
            score: 0,
            isHost: false
        };

        room.players.push(player);
        socket.join(data.roomCode);
        socket.roomCode = data.roomCode;

        socket.emit('roomJoined', {
            roomCode: data.roomCode,
            players: room.players
        });

        io.to(data.roomCode).emit('updatePlayers', room.players);
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
