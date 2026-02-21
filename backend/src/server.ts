import express, { Request, Response } from 'express';
import cors from 'cors';
import { registerHandler, loginHandler, authHandler } from './routes/auth';
import { analyticsService } from './services/analytics.service';
import { mongoDBService } from './services/mongodb.service';
import { rabbitmqService } from './services/rabbitmq.service';
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/login', loginHandler);
app.post('/api/auth', authHandler);
app.post('/api/register', registerHandler);
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/api/health', async (req, res) => {
  try {
    const health = await analyticsService.getSystemHealth();
    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
});
app.get('/api/analytics', async (req, res) => {
  try {
    const metrics = await analyticsService.getMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    'Routes registered: /api/auth/register, /api/auth/login, /api/auth, /api/register, /api/health, /api/analytics, /health',
  );
  try {
    await mongoDBService.connect();
    console.log('MongoDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MongoDB:', error);
  }
  try {
    await rabbitmqService.connect();
    console.log('RabbitMQ initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
    console.error('RabbitMQ will remain unavailable - some features may not work');
  }
});
export default app;
