import { Request, Response } from 'express';
import { eq, or, ilike, desc } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword } from '../utils/password';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';

export class UsersController {
  // Get all users with pagination and search
  async getAllUsers(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        role = '',
        status = '' 
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      let whereConditions: any[] = [];

      if (search) {
        whereConditions.push(
          or(
            ilike(users.email, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`)
          )
        );
      }

      if (role) {
        whereConditions.push(eq(users.role, role as string));
      }

      if (status === 'active') {
        whereConditions.push(eq(users.isActive, true));
      } else if (status === 'inactive') {
        whereConditions.push(eq(users.isActive, false));
      }

      // Get total count
      const totalResult = await db
        .select()
        .from(users)
        .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

      const total = totalResult.length;

      // Get paginated users
      const usersList = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          phone: users.phone,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
        .orderBy(desc(users.createdAt))
        .limit(limitNum)
        .offset(offset);

      return successResponse(res, {
        users: usersList,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return errorResponse(res, 'Failed to fetch users', 500);
    }
  }

  // Get user by ID
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) {
        return notFoundResponse(res, 'User not found');
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return successResponse(res, userWithoutPassword);
    } catch (error) {
      console.error('Get user by ID error:', error);
      return errorResponse(res, 'Failed to fetch user', 500);
    }
  }

  // Create new user
  async createUser(req: Request, res: Response) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        address,
        dateOfBirth,
        gender,
        bloodGroup,
      } = req.body;

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        return errorResponse(res, 'User with this email already exists', 409);
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || 'student',
          phone,
          address,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          bloodGroup,
          isActive: true,
        })
        .returning();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      return successResponse(
        res,
        userWithoutPassword,
        'User created successfully',
        201
      );
    } catch (error) {
      console.error('Create user error:', error);
      return errorResponse(res, 'Failed to create user', 500);
    }
  }

  // Update user
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth,
        gender,
        bloodGroup,
        isActive,
      } = req.body;

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!existingUser) {
        return notFoundResponse(res, 'User not found');
      }

      // Update user
      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
          phone: phone || existingUser.phone,
          address: address || existingUser.address,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingUser.dateOfBirth,
          gender: gender || existingUser.gender,
          bloodGroup: bloodGroup || existingUser.bloodGroup,
          isActive: isActive !== undefined ? isActive : existingUser.isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      return successResponse(res, userWithoutPassword, 'User updated successfully');
    } catch (error) {
      console.error('Update user error:', error);
      return errorResponse(res, 'Failed to update user', 500);
    }
  }

  // Delete user (soft delete)
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!existingUser) {
        return notFoundResponse(res, 'User not found');
      }

      // Soft delete by setting isActive to false
      await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      return errorResponse(res, 'Failed to delete user', 500);
    }
  }

  // Get user statistics
  async getUserStats(req: Request, res: Response) {
    try {
      const allUsers = await db.select().from(users);

      const stats = {
        total: allUsers.length,
        active: allUsers.filter(u => u.isActive).length,
        inactive: allUsers.filter(u => !u.isActive).length,
        byRole: {
          superadmin: allUsers.filter(u => u.role === 'superadmin').length,
          admin: allUsers.filter(u => u.role === 'admin').length,
          teacher: allUsers.filter(u => u.role === 'teacher').length,
          student: allUsers.filter(u => u.role === 'student').length,
          guardian: allUsers.filter(u => u.role === 'guardian').length,
          accountant: allUsers.filter(u => u.role === 'accountant').length,
          hostel_manager: allUsers.filter(u => u.role === 'hostel_manager').length,
        },
      };

      return successResponse(res, stats);
    } catch (error) {
      console.error('Get user stats error:', error);
      return errorResponse(res, 'Failed to fetch user statistics', 500);
    }
  }
}