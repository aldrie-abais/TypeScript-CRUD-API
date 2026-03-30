// src/users/user.service.ts

import bcrypt from 'bcryptjs';
import { db } from '../_helpers/db';
import { Role } from '../_helpers/role';
import { User } from './user.model';
import type { UserCreationAttributes } from './user.model';
import jwt from 'jsonwebtoken';
import config from '../../config.json';

export const userService = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function getAll(): Promise<User[]> {
    return await db.User.findAll();
}

async function getById(id: number): Promise<User> {
    return await getUser(id);
}

async function create(params: UserCreationAttributes & { password?: string }): Promise<void> {
    // Check if email already exists
    const existingUser = await db.User.findOne({ where: { email: params.email } });
    if (existingUser) {
        throw new Error(`Email "${params.email}" is already registered`);
    }

    // Hash password
    let passwordHash = '';
    if (params.password) {
        passwordHash = await bcrypt.hash(params.password, 10);
    }

    // Create user (exclude password from saved fields)
    await db.User.create({
        ...params,
        passwordHash,
        role: params.role || Role.User // Default to User role
    } as UserCreationAttributes);
}

async function update(id: number, params: Partial<UserCreationAttributes> & { password?: string }): Promise<void> {
    const user = await getUser(id);

    // Hash new password if provided
    if (params.password) {
        const passwordHash = await bcrypt.hash(params.password, 10);
        (params as any).passwordHash = passwordHash;
        delete params.password; // Remove plain password
    }

    // Update user
    await user.update(params as Partial<UserCreationAttributes>);
}

async function _delete(id: number): Promise<void> {
    const user = await getUser(id);
    await user.destroy();
}

async function authenticate({ email, password }: any) {
    // 1. Find the user by email (we use 'withHash' scope so we can actually check the password)
    const user = await db.User.scope('withHash').findOne({ where: { email } });
    
    if (!user) {
        throw new Error('Email or password is incorrect');
    }

    // 2. Compare the plain text password to the hashed database password
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordMatch) {
        throw new Error('Email or password is incorrect');
    }

    // 3. Generate the JWT token
    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

    // 4. Return the user info (without the password hash!) and the token
    const userWithoutHash = { ...user.toJSON() };
    delete userWithoutHash.passwordHash;

    return {
        ...userWithoutHash,
        token
    };
}

// Helper: Get user or throw error
async function getUser(id: number): Promise<User> {
    const user = await db.User.scope('withHash').findByPk(id);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}