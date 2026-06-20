import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import db from './models';
import authRoutes from './routes/auth.routes';
import loginRoutes from './routes/login.routes';
import chatRoutes from './routes/chat.routes';
import guideRoutes from './routes/guide.routes';
import tourRoutes from './routes/tour.routes';
import customerRoutes from './routes/customer.routes';
import operatorRoutes from './routes/operator/operator.routes';
import pendingBookingRoutes from './routes/pendingBooking.routes';
import socketManager from './sockets/socketManager';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
socketManager.initSocket(io);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure uploads directory exists and serve it statically
const uploadsDir = path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.warn('Could not create uploads directory:', err.message);
}
app.use('/uploads', express.static(uploadsDir));

// Mount authentication routes
app.use('/', authRoutes);
// Mount login routes (login, profile, /api/auth/me)
app.use('/', loginRoutes);
// Mount chat routes
app.use('/', chatRoutes);



// ==================== API ROUTING ====================
app.use('/', tourRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/bookings/pending', pendingBookingRoutes);
app.use('/api/guides', guideRoutes);

// ==================== START SERVER & DATABASE CONNECTION ====================

db.sequelize.authenticate()
  .then(async () => {
    console.log('MySQL Database Connected.');
    // Force: false to prevent table wiping, but syncs models and associations
    await db.sequelize.sync({ force: false });
    
    server.listen(PORT, () => {
      console.log(`Backend Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database Connection Error:', err);
  });
