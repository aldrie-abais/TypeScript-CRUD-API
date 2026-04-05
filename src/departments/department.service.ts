import { db } from '../_helpers/db';

export const departmentService = {
    getAll: async () => await db.Department.findAll(),
    create: async (params: any) => await db.Department.create(params),
    delete: async (id: number) => {
        const dept = await db.Department.findByPk(id);
        if (!dept) throw new Error('Department not found');
        await dept.destroy();
    }
};