import { db } from '../_helpers/db';

export const employeeService = {
    getAll: async () => await db.Employee.findAll(),
    create: async (params: any) => await db.Employee.create(params),
    delete: async (id: number) => {
        const emp = await db.Employee.findByPk(id);
        if (!emp) throw new Error('Employee not found');
        await emp.destroy();
    }
};