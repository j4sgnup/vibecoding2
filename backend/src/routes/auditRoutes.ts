import { Router } from 'express';
import { searchAuditLogs } from '../controllers/auditController';

const router = Router();

router.post('/search', searchAuditLogs);

export default router;
