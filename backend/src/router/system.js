// src/router/system.js
import { Router } from 'express';
import { env } from '../config/env.js';
import dayjs from 'dayjs';

const router = Router();

// Aliases: /health y /healthz
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: dayjs().toISOString(), requestId: req.id });
});
router.get('/healthz', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: dayjs().toISOString(), requestId: req.id });
});

router.get('/livez', (req, res) => {
  res.json({ success: true, status: 'alive', timestamp: dayjs().toISOString(), uptime: process.uptime(), requestId: req.id });
});

// Aliases: /ready y /readyz
router.get('/ready', (req, res) => {
  res.json({ success: true, status: 'ready', timestamp: dayjs().toISOString(), checks: { server: 'ok' }, requestId: req.id });
});
router.get('/readyz', (req, res) => {
  res.json({ success: true, status: 'ready', timestamp: dayjs().toISOString(), checks: { server: 'ok' }, requestId: req.id });
});

router.get('/metrics', (req, res) => {
  if (!env.METRICS_PUBLIC) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Metrics endpoint not found' },
      timestamp: dayjs().toISOString(),
      requestId: req.id,
    });
  }
  res.set('Content-Type', 'text/plain');
  res.send(`# Basic metrics endpoint
# Placeholder for Prometheus metrics
skeleton_status{version="1.0.0"} 1
skeleton_uptime_seconds ${Math.floor(process.uptime())}
skeleton_memory_usage_bytes ${process.memoryUsage().rss}
`);
});

export default router;