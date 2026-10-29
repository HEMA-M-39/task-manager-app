import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import connectorRoutes from '../routes/connectors';
import db from '../db';

const app = express();
app.use(express.json());
app.use('/api/connectors', connectorRoutes);

beforeEach(() => {
  db.prepare('DELETE FROM connectors').run();
});

describe('Connector API', () => {
  it('should list empty connectors initially', async () => {
    const res = await request(app).get('/api/connectors');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should create or update a connector configuration', async () => {
    const res = await request(app)
      .post('/api/connectors')
      .send({
        id: 'github',
        name: 'GitHub',
        type: 'vcs',
        enabled: true,
        config: { owner: 'testuser', repo: 'testrepo' }
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('github');
    expect(res.body.name).toBe('GitHub');
    expect(res.body.enabled).toBe(true);
    expect(JSON.parse(res.body.config)).toEqual({ owner: 'testuser', repo: 'testrepo' });
  });

  it('should return 400 for invalid connector payload', async () => {
    const res = await request(app)
      .post('/api/connectors')
      .send({
        id: '',
        name: 'GitHub',
        type: 'vcs',
        enabled: 'not-a-boolean'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should retrieve a single connector by id', async () => {
    await request(app)
      .post('/api/connectors')
      .send({
        id: 'slack',
        name: 'Slack',
        type: 'chat',
        enabled: false,
        config: { channel: '#general' }
      });

    const res = await request(app).get('/api/connectors/slack');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('slack');
    expect(res.body.name).toBe('Slack');
    expect(res.body.enabled).toBe(false);
  });

  it('should return 404 for non-existent connector', async () => {
    const res = await request(app).get('/api/connectors/non-existent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should partially update connector status', async () => {
    await request(app)
      .post('/api/connectors')
      .send({
        id: 'github',
        name: 'GitHub',
        type: 'vcs',
        enabled: false,
        config: { owner: 'old' }
      });

    const res = await request(app)
      .patch('/api/connectors/github')
      .send({ enabled: true, config: { owner: 'new' } });

    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(true);
    expect(JSON.parse(res.body.config)).toEqual({ owner: 'new' });
  });

  it('should delete a connector', async () => {
    await request(app)
      .post('/api/connectors')
      .send({
        id: 'github',
        name: 'GitHub',
        type: 'vcs',
        enabled: true
      });

    const delRes = await request(app).delete('/api/connectors/github');
    expect(delRes.status).toBe(204);

    const getRes = await request(app).get('/api/connectors/github');
    expect(getRes.status).toBe(404);
  });

  it('should fail mock github sync when disabled or not configured', async () => {
    const res = await request(app).post('/api/connectors/github/sync');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should succeed mock github sync when enabled', async () => {
    await request(app)
      .post('/api/connectors')
      .send({
        id: 'github',
        name: 'GitHub',
        type: 'vcs',
        enabled: true,
        config: { token: 'gh_token_123' }
      });

    const res = await request(app).post('/api/connectors/github/sync');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.synced_at).toBeDefined();
    expect(res.body.connector.last_synced_at).toBeDefined();
  });

  it('should test github connection', async () => {
    const res = await request(app)
      .post('/api/connectors/github/test')
      .send({ token: 'gh_token_xyz', repository: 'org/repo' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.repository).toBe('org/repo');
  });
});
