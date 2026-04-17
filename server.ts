import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db: admin.firestore.Firestore | null = null;
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

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store player data and room info
  const players: { [key: string]: any } = {};
  const rooms: { [key: string]: { materials: any[] } } = {}; // Temporary in-memory room data

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('ping', (callback) => {
      if (typeof callback === 'function') callback();
    });

    socket.on('login', async (username, callback) => {
      if (!db) {
        console.error('Login failed: Database not initialized');
        return callback({ success: false, error: 'Database not initialized' });
      }
      if (!username || typeof username !== 'string' || username.trim() === '') {
        return callback({ success: false, error: 'Invalid username' });
      }
      
      const cleanUsername = username.trim();
      try {
        const userRef = db.collection('users').doc(cleanUsername);
        const doc = await userRef.get();
        
        if (!doc.exists) {
          const initialData = {
            username: cleanUsername,
            stats: { totalKills: 0, maxWave: 0, totalMaterials: 0 },
            unlockedCharacters: ['potato'],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          };
          await userRef.set(initialData);
          console.log('Đã tạo user mới thành công:', cleanUsername);
          callback({ success: true, data: initialData });
        } else {
          console.log('Đã tìm thấy user cũ:', cleanUsername);
          callback({ success: true, data: doc.data() });
        }
      } catch (error: any) {
        console.error('Login error for user', cleanUsername, ':', error);
        // If error code is 5 (NOT_FOUND), it might mean the database itself is missing
        if (error.code === 5) {
          callback({ success: false, error: 'Database or collection not found. Please check Firestore setup.' });
        } else {
          callback({ success: false, error: error.message });
        }
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
      
      if (!rooms[roomId]) {
        rooms[roomId] = {
          materials: []
        };
      }
      
      players[socket.id] = {
        id: socket.id,
        x: 800,
        y: 450,
        hp: 100,
        maxHp: 100,
        roomId,
        name,
        isDead: false
      };

      // Send current players in this room to the new player
      const roomPlayers: { [key: string]: any } = {};
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
          
          // Check for death
          if (players[socket.id].hp <= 0 && !players[socket.id].isDead) {
            players[socket.id].isDead = true;
            io.to(roomId).emit('playerDied', socket.id);
          }
        }
      }
    });

    socket.on('enemiesUpdate', (data) => {
      if (data.roomId) {
        socket.to(data.roomId).emit('enemiesUpdate', data.enemies);
      }
    });

    socket.on('spawnMaterial', (data) => {
      if (data.roomId && rooms[data.roomId]) {
        const material = {
          id: Math.random().toString(36).substr(2, 9),
          x: data.x,
          y: data.y,
          value: data.value || 1,
          radius: data.radius || 5
        };
        rooms[data.roomId].materials.push(material);
        io.to(data.roomId).emit('materialsUpdate', rooms[data.roomId].materials);
      }
    });

    socket.on('materialPickedUp', (data) => {
      if (data.roomId && rooms[data.roomId]) {
        // Find by ID or by proximity if ID is missing
        const index = rooms[data.roomId].materials.findIndex(m => 
          (data.id && m.id === data.id) || 
          (Math.abs(m.x - data.x) < 10 && Math.abs(m.y - data.y) < 10)
        );
        
        if (index !== -1) {
          rooms[data.roomId].materials.splice(index, 1);
          io.to(data.roomId).emit('materialsUpdate', rooms[data.roomId].materials);
        }
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
          
          // Clean up room if empty
          setTimeout(() => {
            const roomPlayers = Object.values(players).filter(p => p.roomId === roomId);
            if (roomPlayers.length === 0) {
              delete rooms[roomId];
            }
          }, 5000);
        }
        delete players[socket.id];
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
