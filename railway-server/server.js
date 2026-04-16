const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Initialize Firebase Admin
let db = null;
try {
  const configJson = process.env.FIREBASE_CONFIG_JSON;
  if (configJson) {
    const config = JSON.parse(configJson);
    admin.initializeApp({
      credential: admin.credential.cert(config)
    });
    db = admin.firestore();
    console.log('Firebase Admin initialized successfully from environment variable');
  } else {
    console.warn('FIREBASE_CONFIG_JSON environment variable not found, persistence disabled');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the Vite build directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Store player data and room info
const players = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('login', async (username, callback) => {
      if (!db) {
        return callback({ success: false, error: 'Database not initialized' });
      }
      try {
        const userRef = db.collection('users').doc(username);
        const doc = await userRef.get();
        if (!doc.exists) {
          const initialData = {
            username,
            stats: { totalKills: 0, maxWave: 0, totalMaterials: 0 },
            unlockedCharacters: ['potato'],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          };
          await userRef.set(initialData);
          console.log('Đã tạo user mới thành công:', username);
          callback({ success: true, data: initialData });
        } else {
          console.log('Đã tìm thấy user cũ:', username);
          callback({ success: true, data: doc.data() });
        }
      } catch (error) {
        console.error('Login error:', error);
        callback({ success: false, error: error.message });
      }
    });

    socket.on('updateUserData', async (data) => {
      if (!db) return;
      const { username, updates } = data;
      try {
        // Use set with merge: true to avoid NOT_FOUND error
        await db.collection('users').doc(username).set(updates, { merge: true });
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    });

    socket.on('joinRoom', (data) => {
    const roomId = typeof data === 'string' ? data : data.roomId;
    const name = typeof data === 'object' ? data.name : 'Unknown';
    
    socket.join(roomId);
    
    players[socket.id] = {
      id: socket.id,
      x: 800,
      y: 450,
      hp: 100,
      maxHp: 100,
      roomId,
      name
    };

    // Send current players in this room to the new player
    const roomPlayers = {};
    Object.keys(players).forEach(id => {
      if (players[id].roomId === roomId) {
        roomPlayers[id] = players[id];
      }
    });
    
    socket.emit('currentPlayers', roomPlayers);
    
    // Notify others in the room
    socket.to(roomId).emit('newPlayer', players[socket.id]);
    
    console.log(`User ${socket.id} (${name}) joined room ${roomId}`);
  });

  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].hp = movementData.hp;
      players[socket.id].maxHp = movementData.maxHp;
      const roomId = movementData.roomId || players[socket.id].roomId;
      
      if (roomId) {
        socket.to(roomId).emit('playerMoved', players[socket.id]);
      }
    }
  });

  socket.on('enemiesUpdate', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('enemiesUpdate', data.enemies);
    }
  });

  socket.on('materialsUpdate', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('materialsUpdate', data.materials);
    }
  });

  socket.on('materialPickedUp', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('materialPickedUp', { x: data.x, y: data.y });
    }
  });

  socket.on('enemyDamage', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('enemyDamage', { x: data.x, y: data.y, damage: data.damage });
    }
  });

  socket.on('revivePlayer', (data) => {
    if (data.roomId && data.targetId) {
      io.to(data.roomId).emit('playerRevived', data.targetId);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (players[socket.id]) {
      const roomId = players[socket.id].roomId;
      if (roomId) {
        io.to(roomId).emit('playerDisconnected', socket.id);
      }
      delete players[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});
