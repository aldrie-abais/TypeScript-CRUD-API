// src/_helpers/db.ts
import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

export interface Database {
    User: any; // We'll type this properly after creating the model
    Department: any; 
    Employee: any;
    Request: any; // New Added
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
    const { host, port, user, password, database } = config.database;

    // Create database if it doesn't exist
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();

    // Connect to database with Sequelize
    const sequelize = new Sequelize(database, user, password, { dialect: 'mysql' });

    // Initialize models
    const { default: userModel } = await import('../users/user.model');
    db.User = userModel(sequelize); 

    const { default: deptModel } = await import('../departments/department.model'); // <--- ADD THIS
    db.Department = deptModel(sequelize); // <--- ADD THIS

    const { default: empModel } = await import('../employees/employee.model');
    db.Employee = empModel(sequelize);

    const { default: reqModel } = await import('../requests/request.model');
    db.Request = reqModel(sequelize);

    // Sync models with database
    await sequelize.sync({ alter: true });

    console.log('Database initialized and models synced');
}