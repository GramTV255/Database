import http from 'http';
import { Server, Socket } from 'socket.io';
import app from './app';
import { config } from './config/env';
import { connectDB } from './config/db';

// 1. Kushughulikia makosa yasiyotarajiwa ya kiufundi kwenye Mfumo (Uncaught Exception)
process.on('uncaughtException', (error: Error) => {
  console.error('KOSA KUBWA (Uncaught Exception): Seva inazima...');
  console.error(error.name, error.message);
  process.exit(1);
});

// 2. Unganisha na Database ya MongoDB kupitia Mipangilio Salama
connectDB();

// 3. Unda Seva ya HTTP kwa kutumia Express App
const server = http.createServer(app);

// 4. Sanidi Socket.io kwa ajili ya Real-time capabilities na usalama wa CORS
const io = new Server(server, {
  cors: {
    origin: '*', // Unaweza kuweka domain maalum hapa baadaye kwa usalama zaidi
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000, // Muda wa kusubiri kabla ya kukata muunganisho
});

// 5. Muundo wa Real-time Events (Sockets Management)
io.on('connection', (socket: Socket) => {
  console.log(`[Real-time]: Mtumiaji ameunganishwa salama | Socket ID: ${socket.id}`);

  // Mteja anapojiunga na chumba maalum (Room join)
  socket.on('join_room', (room: string) => {
    socket.join(room);
    console.log(`[Socket Room]: Mtumiaji ${socket.id} ameingia kwenye chumba: ${room}`);
    io.to(room).emit('notification', `Mtumiaji mpya amejiunga na chumba cha ${room}`);
  });

  // Kusikiliza ujumbe wa kawaida wa papo kwa hapo
  socket.on('send_message', (data: { room?: string; sender: string; message: string }) => {
    console.log('[Real-time Message]:', data);
    if (data.room) {
      // Kutuma ujumbe kwenye chumba maalum tu
      io.to(data.room).emit('receive_message', data);
    } else {
      // Kutuma ujumbe kwa kila mtu aliyeunganishwa (Broadcast)
      io.emit('receive_message', data);
    }
  });

  // Wakati mtumiaji anapotoka au kukata mtandao
  socket.on('disconnect', (reason) => {
    console.log(`[Real-time]: Mtumiaji amejiondoa (${socket.id}). Sababu: ${reason}`);
  });
});

// 6. Washa Seva kwenye Bandari (Port) iliyotajwa
const PORT = config.port || 5000;

const serverInstance = server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Seva ya [backend-api] imewaka na inafanya kazi!`);
  console.log(`🌍 Mazingira (Environment): ${config.nodeEnv}`);
  console.log(`🔌 Port inayotumika: ${PORT}`);
  console.log(`==================================================`);
});

// 7. Kushughulikia makosa ya database au async yasiyokamatwa (Unhandled Rejection)
process.on('unhandledRejection', (reason: any) => {
  console.error('KOSA LA ASYNC (Unhandled Rejection): Seva inazima...');
  console.error(reason?.name || 'Error', reason?.message || reason);
  
  serverInstance.close(() => {
    process.exit(1);
  });
});
