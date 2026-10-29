"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const ConnectorRepository_1 = require("../repositories/ConnectorRepository");
const router = (0, express_1.Router)();
const UpsertConnectorSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    enabled: zod_1.z.boolean(),
    config: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional().default({}),
});
const UpdateConnectorSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().optional(),
    config: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
// GET /api/connectors - List all connectors
router.get('/', (req, res) => {
    try {
        const connectors = ConnectorRepository_1.ConnectorRepository.findAll();
        res.json(connectors);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// GET /api/connectors/:id - Get connector by id
router.get('/:id', (req, res) => {
    try {
        const connector = ConnectorRepository_1.ConnectorRepository.findById(req.params.id);
        if (!connector) {
            return res.status(404).json({ error: 'Connector not found' });
        }
        res.json(connector);
    }
    catch (error) {
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
        const connector = ConnectorRepository_1.ConnectorRepository.upsert(parseResult.data);
        res.status(201).json(connector);
    }
    catch (error) {
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
        const existing = ConnectorRepository_1.ConnectorRepository.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Connector not found' });
        }
        const { enabled, config } = parseResult.data;
        const updated = ConnectorRepository_1.ConnectorRepository.updateStatus(req.params.id, enabled !== undefined ? enabled : existing.enabled, config !== undefined ? config : JSON.parse(existing.config || '{}'));
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// DELETE /api/connectors/:id - Delete connector configuration
router.delete('/:id', (req, res) => {
    try {
        const existing = ConnectorRepository_1.ConnectorRepository.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Connector not found' });
        }
        ConnectorRepository_1.ConnectorRepository.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// POST /api/connectors/github/sync - Mock GitHub connection / sync action
router.post('/github/sync', (req, res) => {
    try {
        const githubConnector = ConnectorRepository_1.ConnectorRepository.findById('github');
        if (!githubConnector || !githubConnector.enabled) {
            return res.status(400).json({ error: 'GitHub connector is not configured or enabled' });
        }
        // Perform mock sync action
        ConnectorRepository_1.ConnectorRepository.updateLastSynced('github');
        const updated = ConnectorRepository_1.ConnectorRepository.findById('github');
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
exports.default = router;
