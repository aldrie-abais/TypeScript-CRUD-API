import { Router, Request, Response, NextFunction } from 'express';
import { departmentService } from './department.service';

const router = Router();

router.get('/', (req, res, next) => {
    departmentService.getAll().then((data: any) => res.json(data)).catch(next);
});

router.post('/', (req, res, next) => {
    departmentService.create(req.body).then(() => res.json({ message: 'Department created' })).catch(next);
});

router.delete('/:id', (req, res, next) => {
    departmentService.delete(Number(req.params.id)).then(() => res.json({ message: 'Department deleted' })).catch(next);
});

export default router;