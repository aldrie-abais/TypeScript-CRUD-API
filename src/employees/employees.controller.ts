import { Router } from 'express';
import { employeeService } from './employee.service';

const router = Router();

router.get('/', (req, res, next) => {
    employeeService.getAll().then((data: any) => res.json(data)).catch(next);
});

router.post('/', (req, res, next) => {
    employeeService.create(req.body).then(() => res.json({ message: 'Employee saved' })).catch(next);
});

router.delete('/:id', (req, res, next) => {
    employeeService.delete(Number(req.params.id)).then(() => res.json({ message: 'Employee deleted' })).catch(next);
});

export default router;