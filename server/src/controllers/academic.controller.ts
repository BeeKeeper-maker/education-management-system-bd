import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { classes, sections, subjects, academicSessions } from '../db/schema';
import { successResponse, errorResponse } from '../utils/response';

export class AcademicController {
  // Get all classes
  async getAllClasses(req: Request, res: Response) {
    try {
      const allClasses = await db.query.classes.findMany({
        with: {
          academicSession: true,
          shift: true,
        },
      });

      return successResponse(res, allClasses);
    } catch (error) {
      console.error('Get all classes error:', error);
      return errorResponse(res, 'Failed to fetch classes', 500);
    }
  }

  // Get sections by class ID
  async getSectionsByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;

      const classSections = await db.query.sections.findMany({
        where: eq(sections.classId, classId),
      });

      return successResponse(res, classSections);
    } catch (error) {
      console.error('Get sections by class error:', error);
      return errorResponse(res, 'Failed to fetch sections', 500);
    }
  }

  // Get all sections
  async getAllSections(req: Request, res: Response) {
    try {
      const allSections = await db.query.sections.findMany({
        with: {
          class: true,
        },
      });

      return successResponse(res, allSections);
    } catch (error) {
      console.error('Get all sections error:', error);
      return errorResponse(res, 'Failed to fetch sections', 500);
    }
  }

  // Get all subjects
  async getAllSubjects(req: Request, res: Response) {
    try {
      const allSubjects = await db.query.subjects.findMany();

      return successResponse(res, allSubjects);
    } catch (error) {
      console.error('Get all subjects error:', error);
      return errorResponse(res, 'Failed to fetch subjects', 500);
    }
  }

  // Get current academic session
  async getCurrentSession(req: Request, res: Response) {
    try {
      const currentSession = await db.query.academicSessions.findFirst({
        where: eq(academicSessions.isCurrent, true),
      });

      return successResponse(res, currentSession);
    } catch (error) {
      console.error('Get current session error:', error);
      return errorResponse(res, 'Failed to fetch current session', 500);
    }
  }

  // Get all academic sessions
  async getAllSessions(req: Request, res: Response) {
    try {
      const allSessions = await db.query.academicSessions.findMany();

      return successResponse(res, allSessions);
    } catch (error) {
      console.error('Get all sessions error:', error);
      return errorResponse(res, 'Failed to fetch sessions', 500);
    }
  }
}