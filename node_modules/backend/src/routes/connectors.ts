import { Router } from 'express';
import { z } from 'zod';
import { ConnectorRepository } from '../repositories/ConnectorRepository';

const router = Router();

const UpsertConnectorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  enabled: z.boolean(),
  config: z.record(z.string(), z.any()).optional().default({}),
});

const UpdateConnectorSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.any()).optional(),
});

// GET /api/connectors - List all connectors
router.get('/', (req, res) => {
  try {
    const connectors = ConnectorRepository.findAll();
    res.json(connectors);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/connectors/:id - Get connector by id
router.get('/:id', (req, res) => {
  try {
    const connector = ConnectorRepository.findById(req.params.id);
    if (!connector) {
      return res.status(404).json({ error: 'Connector not found' });
    }
    res.json(connector);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/connectors - Create or update connector configuration
router.post('/', (req, res) => {
  const parseResult = UpsertConnectorSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }

  try {
    const connector = ConnectorRepository.upsert(parseResult.data);
    res.status(201).json(connector);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PATCH /api/connectors/:id - Update connector status/config
router.patch('/:id', (req, res) => {
  const parseResult = UpdateConnectorSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues });
  }

  try {
    const existing = ConnectorRepository.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Connector not found' });
    }

    const { enabled, config } = parseResult.data;
    const updated = ConnectorRepository.updateStatus(
      req.params.id, 
      enabled !== undefined ? enabled : existing.enabled, 
      config !== undefined ? config : JSON.parse(existing.config || '{}')
    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/connectors/:id - Delete connector configuration
router.delete('/:id', (req, res) => {
  try {
    const existing = ConnectorRepository.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Connector not found' });
    }
    ConnectorRepository.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/connectors/github/sync - Mock GitHub connection / sync action
router.post('/github/sync', (req, res) => {
  try {
    const githubConnector = ConnectorRepository.findById('github');
    if (!githubConnector || !githubConnector.enabled) {
      return res.status(400).json({ error: 'GitHub connector is not configured or enabled' });
    }

    // Perform mock sync action
    ConnectorRepository.updateLastSynced('github');
    const updated = ConnectorRepository.findById('github');

    res.json({
      success: true,
      message: 'Successfully synced with GitHub repositories and issues.',
      synced_at: updated?.last_synced_at,
      connector: updated,
      mock_data: {
        repositories_scanned: 3,
        issues_imported: 2,
        pull_requests_checked: 5
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/connectors/github/test - Test GitHub connection
router.post('/github/test', (req, res) => {
  try {
    const { token, repository } = req.body || {};
    // Simulate testing connection
    res.json({
      success: true,
      message: 'GitHub connection test successful!',
      authenticated_user: 'mock-github-user',
      repository: repository || 'default/repo'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
