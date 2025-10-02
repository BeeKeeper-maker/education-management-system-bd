import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response';

export class AuthController {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role, phone } = req.body;

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
          isActive: true,
        })
        .returning();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      // Generate token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      return successResponse(
        res,
        {
          user: userWithoutPassword,
          token,
        },
        'User registered successfully',
        201
      );
    } catch (error) {
      console.error('Registration error:', error);
      return errorResponse(res, 'Registration failed', 500);
    }
  }

  // Login user
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return unauthorizedResponse(res, 'Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        return unauthorizedResponse(res, 'Your account has been deactivated');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return unauthorizedResponse(res, 'Invalid email or password');
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Set session
      if (req.session) {
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.role = user.role;
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return successResponse(res, {
        user: userWithoutPassword,
        token,
      }, 'Login successful');
    } catch (error) {
      console.error('Login error:', error);
      return errorResponse(res, 'Login failed', 500);
    }
  }

  // Logout user
  async logout(req: Request, res: Response) {
    try {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            return errorResponse(res, 'Logout failed', 500);
          }
          return successResponse(res, null, 'Logout successful');
        });
      } else {
        return successResponse(res, null, 'Logout successful');
      }
    } catch (error) {
      console.error('Logout error:', error);
      return errorResponse(res, 'Logout failed', 500);
    }
  }

  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return unauthorizedResponse(res, 'Not authenticated');
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.userId),
      });

      if (!user) {
        return unauthorizedResponse(res, 'User not found');
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return successResponse(res, userWithoutPassword);
    } catch (error) {
      console.error('Get current user error:', error);
      return errorResponse(res, 'Failed to get user', 500);
    }
  }

  // Change password
  async changePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        return unauthorizedResponse(res, 'Not authenticated');
      }

      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.userId),
      });

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await comparePassword(currentPassword, user.password);

      if (!isPasswordValid) {
        return errorResponse(res, 'Current password is incorrect', 400);
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      return successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);
      return errorResponse(res, 'Failed to change password', 500);
    }
  }
}