const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Cấu hình CORS để cho phép kết nối từ GitHub Pages hoặc bất kỳ domain nào
const io = new Server(server, {
  cors: {
    origin: "*", // Bạn có thể thay "*" bằng URL GitHub Pages của bạn để bảo mật hơn (vd: "https://username.github.io")
    methods: ["GET", "POST"]
  }
});

// Lưu trữ danh sách người chơi
const players = {};

io.on('connection', (socket) => {
  console.log('Một người chơi vừa kết nối:', socket.id);

  // Khởi tạo dữ liệu người chơi mới
  players[socket.id] = {
    id: socket.id,
    x: 400, // Vị trí X khởi đầu
    y: 300  // Vị trí Y khởi đầu
  };

  // Gửi danh sách người chơi hiện tại cho người mới vào
  socket.emit('currentPlayers', players);

  // Báo cho các người chơi khác biết có người mới tham gia
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Lắng nghe sự kiện cập nhật vị trí từ client
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      
      // Phát lại vị trí mới cho TẤT CẢ các người chơi KHÁC
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // Xử lý khi người chơi ngắt kết nối
  socket.on('disconnect', () => {
    console.log('Người chơi ngắt kết nối:', socket.id);
    delete players[socket.id];
    // Báo cho các người chơi khác xóa nhân vật này khỏi màn hình
    io.emit('playerDisconnected', socket.id);
  });
});

// Railway sẽ tự động cung cấp process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Multiplayer server đang chạy tại port ${PORT}`);
});
