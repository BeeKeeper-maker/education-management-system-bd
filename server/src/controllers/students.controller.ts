import { Request, Response } from 'express';
import { eq, or, ilike, desc, and } from 'drizzle-orm';
import { db } from '../db';
import { users, students, enrollments, classes, sections, academicSessions } from '../db/schema';
import { hashPassword } from '../utils/password';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';

export class StudentsController {
  // Create new student (admission)
  async createStudent(req: Request, res: Response) {
    try {
      const {
        // User information
        email,
        password,
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth,
        gender,
        bloodGroup,
        
        // Student specific information
        admissionNumber,
        admissionDate,
        rollNumber,
        guardianName,
        guardianPhone,
        guardianEmail,
        guardianRelation,
        emergencyContact,
        previousSchool,
        medicalInfo,
        
        // Enrollment information
        classId,
        sectionId,
        academicSessionId,
      } = req.body;

      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        return errorResponse(res, 'User with this email already exists', 409);
      }

      // Check if admission number already exists
      if (admissionNumber) {
        const existingStudent = await db.query.students.findFirst({
          where: eq(students.admissionNumber, admissionNumber),
        });

        if (existingStudent) {
          return errorResponse(res, 'Student with this admission number already exists', 409);
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user first
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'student',
          phone,
          address,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          bloodGroup,
          isActive: true,
        })
        .returning();

      // Generate student ID
      const studentIdPrefix = 'STU';
      const timestamp = Date.now().toString().slice(-6);
      const studentId = `${studentIdPrefix}${timestamp}`;

      // Create student record
      const [newStudent] = await db
        .insert(students)
        .values({
          userId: newUser.id,
          studentId,
          admissionNumber,
          admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
          rollNumber,
          guardianName,
          guardianPhone,
          guardianEmail,
          guardianRelation,
          emergencyContact,
          previousSchool,
          medicalInfo,
          status: 'active',
        })
        .returning();

      // Create enrollment if class and section provided
      if (classId && sectionId) {
        // Get current academic session if not provided
        let sessionId = academicSessionId;
        if (!sessionId) {
          const currentSession = await db.query.academicSessions.findFirst({
            where: eq(academicSessions.isCurrent, true),
          });
          sessionId = currentSession?.id;
        }

        if (sessionId) {
          await db.insert(enrollments).values({
            studentId: newStudent.id,
            classId,
            sectionId,
            academicSessionId: sessionId,
            enrollmentDate: new Date(),
            status: 'active',
          });
        }
      }

      // Fetch complete student data
      const completeStudent = await this.getStudentWithDetails(newStudent.id);

      return successResponse(
        res,
        completeStudent,
        'Student admitted successfully',
        201
      );
    } catch (error) {
      console.error('Create student error:', error);
      return errorResponse(res, 'Failed to admit student', 500);
    }
  }

  // Get all students with pagination, search, and filters
  async getAllStudents(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        classId = '',
        sectionId = '',
        status = '',
        academicSessionId = '',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build query
      let query = db
        .select({
          student: students,
          user: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            phone: users.phone,
            dateOfBirth: users.dateOfBirth,
            gender: users.gender,
            bloodGroup: users.bloodGroup,
            isActive: users.isActive,
          },
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id));

      // Apply filters
      const conditions: any[] = [];

      if (search) {
        conditions.push(
          or(
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(students.studentId, `%${search}%`),
            ilike(students.admissionNumber, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(students.status, status as string));
      }

      // Get all students with filters
      const allStudents = conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;

      // Filter by class/section if provided (from enrollments)
      let filteredStudents = allStudents;
      if (classId || sectionId || academicSessionId) {
        const enrollmentConditions: any[] = [];
        if (classId) enrollmentConditions.push(eq(enrollments.classId, classId as string));
        if (sectionId) enrollmentConditions.push(eq(enrollments.sectionId, sectionId as string));
        if (academicSessionId) enrollmentConditions.push(eq(enrollments.academicSessionId, academicSessionId as string));

        const enrolledStudents = await db
          .select({ studentId: enrollments.studentId })
          .from(enrollments)
          .where(and(...enrollmentConditions));

        const enrolledStudentIds = new Set(enrolledStudents.map(e => e.studentId));
        filteredStudents = allStudents.filter(s => enrolledStudentIds.has(s.student.id));
      }

      const total = filteredStudents.length;

      // Apply pagination
      const paginatedStudents = filteredStudents.slice(offset, offset + limitNum);

      // Get enrollment details for each student
      const studentsWithEnrollment = await Promise.all(
        paginatedStudents.map(async (item) => {
          const enrollment = await db.query.enrollments.findFirst({
            where: eq(enrollments.studentId, item.student.id),
            with: {
              class: true,
              section: true,
            },
            orderBy: desc(enrollments.enrollmentDate),
          });

          return {
            ...item.student,
            user: item.user,
            currentEnrollment: enrollment,
          };
        })
      );

      return successResponse(res, {
        students: studentsWithEnrollment,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Get all students error:', error);
      return errorResponse(res, 'Failed to fetch students', 500);
    }
  }

  // Get student by ID with complete details
  async getStudentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const studentData = await this.getStudentWithDetails(id);

      if (!studentData) {
        return notFoundResponse(res, 'Student not found');
      }

      return successResponse(res, studentData);
    } catch (error) {
      console.error('Get student by ID error:', error);
      return errorResponse(res, 'Failed to fetch student', 500);
    }
  }

  // Helper method to get student with all details
  private async getStudentWithDetails(studentId: string) {
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        user: true,
      },
    });

    if (!student) {
      return null;
    }

    // Get enrollments
    const studentEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.studentId, studentId),
      with: {
        class: true,
        section: true,
        academicSession: true,
      },
      orderBy: desc(enrollments.enrollmentDate),
    });

    // Get current enrollment
    const currentEnrollment = studentEnrollments.find(e => e.status === 'active');

    // Remove password from user data
    const { password: _, ...userWithoutPassword } = student.user;

    return {
      ...student,
      user: userWithoutPassword,
      enrollments: studentEnrollments,
      currentEnrollment,
    };
  }

  // Update student
  async updateStudent(req: Request, res: Response) {
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
        rollNumber,
        guardianName,
        guardianPhone,
        guardianEmail,
        guardianRelation,
        emergencyContact,
        medicalInfo,
      } = req.body;

      // Check if student exists
      const existingStudent = await db.query.students.findFirst({
        where: eq(students.id, id),
      });

      if (!existingStudent) {
        return notFoundResponse(res, 'Student not found');
      }

      // Update user information
      await db
        .update(users)
        .set({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          address: address || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: gender || undefined,
          bloodGroup: bloodGroup || undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingStudent.userId));

      // Update student information
      await db
        .update(students)
        .set({
          rollNumber: rollNumber || undefined,
          guardianName: guardianName || undefined,
          guardianPhone: guardianPhone || undefined,
          guardianEmail: guardianEmail || undefined,
          guardianRelation: guardianRelation || undefined,
          emergencyContact: emergencyContact || undefined,
          medicalInfo: medicalInfo || undefined,
          updatedAt: new Date(),
        })
        .where(eq(students.id, id));

      // Fetch updated student data
      const updatedStudent = await this.getStudentWithDetails(id);

      return successResponse(res, updatedStudent, 'Student updated successfully');
    } catch (error) {
      console.error('Update student error:', error);
      return errorResponse(res, 'Failed to update student', 500);
    }
  }

  // Deactivate/Activate student
  async toggleStudentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const existingStudent = await db.query.students.findFirst({
        where: eq(students.id, id),
      });

      if (!existingStudent) {
        return notFoundResponse(res, 'Student not found');
      }

      // Update student status
      await db
        .update(students)
        .set({
          status: status || 'inactive',
          updatedAt: new Date(),
        })
        .where(eq(students.id, id));

      // Also update user active status
      await db
        .update(users)
        .set({
          isActive: status === 'active',
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingStudent.userId));

      return successResponse(res, null, `Student ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Toggle student status error:', error);
      return errorResponse(res, 'Failed to update student status', 500);
    }
  }

  // Get student statistics
  async getStudentStats(req: Request, res: Response) {
    try {
      const allStudents = await db.select().from(students);

      const stats = {
        total: allStudents.length,
        active: allStudents.filter(s => s.status === 'active').length,
        inactive: allStudents.filter(s => s.status === 'inactive').length,
        graduated: allStudents.filter(s => s.status === 'graduated').length,
        transferred: allStudents.filter(s => s.status === 'transferred').length,
      };

      return successResponse(res, stats);
    } catch (error) {
      console.error('Get student stats error:', error);
      return errorResponse(res, 'Failed to fetch student statistics', 500);
    }
  }
}