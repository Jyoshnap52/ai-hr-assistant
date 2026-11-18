import express from 'express';
import { getEmployees, getEmployeeById, createEmployee, updateEmployee } from '../controllers/employeeController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getEmployees);
router.get('/:id', requireAuth, getEmployeeById);
router.post('/', requireAuth, requireAdmin, createEmployee);
router.put('/:id', requireAuth, requireAdmin, updateEmployee);

export default router;
