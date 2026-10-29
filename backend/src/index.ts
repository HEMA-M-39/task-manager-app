import express from 'express';
import path from 'path';
import db from './db';
import taskRoutes from './routes/tasks';
import connectorRoutes from './routes/connectors';

const app = express();
const port = 8100;

app.use(express.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/connectors', connectorRoutes);

// Serve static frontend build
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
