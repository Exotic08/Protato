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

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('ping', (callback) => {
      if (typeof callback === 'function') callback();
    });

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
          callback({ success: true, data: initialData });
        } else {
          callback({ success: true, data: doc.data() });
        }
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    socket.on('updateUserData', async (data) => {
      if (!db) return;
      const { username, updates } = data;
      try {
        await db.collection('users').doc(username).update(updates);
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
        roomId,
        name
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

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (players[socket.id]) {
        const roomId = players[socket.id].roomId;
        if (roomId) {
          io.to(roomId).emit('playerDisconnected', socket.id);
          // Optional: Reset all players ready state in that room if someone leaves to avoid stuck state
          // Or just let the client handle the count reduction
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
