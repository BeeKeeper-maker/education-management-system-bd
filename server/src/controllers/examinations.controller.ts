import { Request, Response } from 'express';
import { db } from '../db';
import {
  examTypes,
  exams,
  examSubjects,
  marks,
  gradingSystem,
  results,
  subjectResults,
  classes,
  sections,
  subjects,
  students,
  users,
} from '../db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

// Get all exam types
export const getExamTypes = async (req: Request, res: Response) => {
  try {
    const types = await db
      .select()
      .from(examTypes)
      .where(eq(examTypes.isActive, true))
      .orderBy(examTypes.name);

    res.status(200).json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error('Error fetching exam types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam types',
    });
  }
};

// Create exam
export const createExam = async (req: Request, res: Response) => {
  try {
    const {
      name,
      examTypeId,
      academicSessionId,
      startDate,
      endDate,
      description,
      instructions,
    } = req.body;

    const createdBy = req.user!.id;

    // Validate required fields
    if (!name || !examTypeId || !academicSessionId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const [exam] = await db
      .insert(exams)
      .values({
        name,
        examTypeId,
        academicSessionId,
        startDate,
        endDate,
        description: description || null,
        instructions: instructions || null,
        isPublished: false,
        resultsPublished: false,
        createdBy,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam,
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create exam',
    });
  }
};

// Get all exams
export const getExams = async (req: Request, res: Response) => {
  try {
    const { academicSessionId } = req.query;

    let query = db
      .select({
        id: exams.id,
        name: exams.name,
        startDate: exams.startDate,
        endDate: exams.endDate,
        description: exams.description,
        isPublished: exams.isPublished,
        resultsPublished: exams.resultsPublished,
        examType: {
          id: examTypes.id,
          name: examTypes.name,
          weightage: examTypes.weightage,
        },
        createdAt: exams.createdAt,
      })
      .from(exams)
      .leftJoin(examTypes, eq(exams.examTypeId, examTypes.id));

    if (academicSessionId) {
      query = query.where(eq(exams.academicSessionId, academicSessionId as string));
    }

    const allExams = await query.orderBy(desc(exams.createdAt));

    res.status(200).json({
      success: true,
      data: allExams,
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exams',
    });
  }
};

// Get exam by ID
export const getExamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [exam] = await db
      .select({
        id: exams.id,
        name: exams.name,
        startDate: exams.startDate,
        endDate: exams.endDate,
        description: exams.description,
        instructions: exams.instructions,
        isPublished: exams.isPublished,
        resultsPublished: exams.resultsPublished,
        examType: {
          id: examTypes.id,
          name: examTypes.name,
          weightage: examTypes.weightage,
        },
        createdAt: exams.createdAt,
      })
      .from(exams)
      .leftJoin(examTypes, eq(exams.examTypeId, examTypes.id))
      .where(eq(exams.id, id));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Get exam subjects
    const subjects = await db
      .select({
        id: examSubjects.id,
        examDate: examSubjects.examDate,
        startTime: examSubjects.startTime,
        endTime: examSubjects.endTime,
        duration: examSubjects.duration,
        totalMarks: examSubjects.totalMarks,
        passingMarks: examSubjects.passingMarks,
        roomNumber: examSubjects.roomNumber,
        class: {
          id: classes.id,
          name: classes.name,
        },
        section: {
          id: sections.id,
          name: sections.name,
        },
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        },
      })
      .from(examSubjects)
      .leftJoin(classes, eq(examSubjects.classId, classes.id))
      .leftJoin(sections, eq(examSubjects.sectionId, sections.id))
      .leftJoin(subjects, eq(examSubjects.subjectId, subjects.id))
      .where(eq(examSubjects.examId, id));

    res.status(200).json({
      success: true,
      data: {
        ...exam,
        subjects,
      },
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam',
    });
  }
};

// Create exam subject schedule
export const createExamSubject = async (req: Request, res: Response) => {
  try {
    const {
      examId,
      classId,
      sectionId,
      subjectId,
      examDate,
      startTime,
      endTime,
      duration,
      totalMarks,
      passingMarks,
      roomNumber,
      instructions,
    } = req.body;

    // Validate required fields
    if (
      !examId ||
      !classId ||
      !subjectId ||
      !examDate ||
      !startTime ||
      !endTime ||
      !duration ||
      !totalMarks ||
      !passingMarks
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const [examSubject] = await db
      .insert(examSubjects)
      .values({
        examId,
        classId,
        sectionId: sectionId || null,
        subjectId,
        examDate,
        startTime,
        endTime,
        duration,
        totalMarks,
        passingMarks,
        roomNumber: roomNumber || null,
        instructions: instructions || null,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Exam subject created successfully',
      data: examSubject,
    });
  } catch (error) {
    console.error('Error creating exam subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create exam subject',
    });
  }
};

// Get students for marks entry
export const getStudentsForMarksEntry = async (req: Request, res: Response) => {
  try {
    const { examSubjectId } = req.params;

    // Get exam subject details
    const [examSubject] = await db
      .select()
      .from(examSubjects)
      .where(eq(examSubjects.id, examSubjectId));

    if (!examSubject) {
      return res.status(404).json({
        success: false,
        message: 'Exam subject not found',
      });
    }

    // Get students enrolled in the class/section
    const studentsQuery = db
      .select({
        id: students.id,
        studentId: students.studentId,
        name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        rollNumber: sql<string>`enrollments.roll_number`,
        marks: marks.marksObtained,
        isAbsent: marks.isAbsent,
        remarks: marks.remarks,
        markId: marks.id,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(sql`enrollments`, and(
        eq(sql`enrollments.student_id`, students.id),
        eq(sql`enrollments.class_id`, examSubject.classId),
        examSubject.sectionId ? eq(sql`enrollments.section_id`, examSubject.sectionId) : sql`true`
      ))
      .leftJoin(marks, and(
        eq(marks.examSubjectId, examSubjectId),
        eq(marks.studentId, students.id)
      ))
      .where(eq(sql`enrollments.status`, 'active'))
      .orderBy(sql`enrollments.roll_number`);

    const studentsList = await studentsQuery;

    res.status(200).json({
      success: true,
      data: {
        examSubject,
        students: studentsList,
      },
    });
  } catch (error) {
    console.error('Error fetching students for marks entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
    });
  }
};

// Save marks (single or bulk)
export const saveMarks = async (req: Request, res: Response) => {
  try {
    const { examSubjectId, marksData } = req.body;
    const enteredBy = req.user!.id;

    // Validate required fields
    if (!examSubjectId || !marksData || !Array.isArray(marksData)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Get exam subject to validate marks
    const [examSubject] = await db
      .select()
      .from(examSubjects)
      .where(eq(examSubjects.id, examSubjectId));

    if (!examSubject) {
      return res.status(404).json({
        success: false,
        message: 'Exam subject not found',
      });
    }

    // Validate marks
    for (const mark of marksData) {
      if (!mark.isAbsent && mark.marksObtained > examSubject.totalMarks) {
        return res.status(400).json({
          success: false,
          message: `Marks cannot exceed total marks (${examSubject.totalMarks})`,
        });
      }
    }

    // Process each mark entry
    for (const mark of marksData) {
      const existingMark = await db
        .select()
        .from(marks)
        .where(
          and(
            eq(marks.examSubjectId, examSubjectId),
            eq(marks.studentId, mark.studentId)
          )
        );

      if (existingMark.length > 0) {
        // Update existing mark
        await db
          .update(marks)
          .set({
            marksObtained: mark.isAbsent ? null : mark.marksObtained,
            isAbsent: mark.isAbsent || false,
            remarks: mark.remarks || null,
            enteredBy,
            updatedAt: new Date(),
          })
          .where(eq(marks.id, existingMark[0].id));
      } else {
        // Insert new mark
        await db.insert(marks).values({
          examSubjectId,
          studentId: mark.studentId,
          marksObtained: mark.isAbsent ? null : mark.marksObtained,
          isAbsent: mark.isAbsent || false,
          remarks: mark.remarks || null,
          enteredBy,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Marks saved successfully',
    });
  } catch (error) {
    console.error('Error saving marks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save marks',
    });
  }
};

// Get grading system
export const getGradingSystem = async (req: Request, res: Response) => {
  try {
    const grades = await db
      .select()
      .from(gradingSystem)
      .where(eq(gradingSystem.isActive, true))
      .orderBy(desc(gradingSystem.gradePoint));

    res.status(200).json({
      success: true,
      data: grades,
    });
  } catch (error) {
    console.error('Error fetching grading system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grading system',
    });
  }
};

// Calculate grade based on percentage
const calculateGrade = async (percentage: number) => {
  const grades = await db
    .select()
    .from(gradingSystem)
    .where(eq(gradingSystem.isActive, true))
    .orderBy(desc(gradingSystem.gradePoint));

  for (const grade of grades) {
    const minPer = parseFloat(grade.minPercentage);
    const maxPer = parseFloat(grade.maxPercentage);
    if (percentage >= minPer && percentage <= maxPer) {
      return {
        grade: grade.grade,
        gradePoint: parseFloat(grade.gradePoint),
      };
    }
  }

  return { grade: 'F', gradePoint: 0 };
};

// Process results for an exam
export const processResults = async (req: Request, res: Response) => {
  try {
    const { examId, classId, sectionId } = req.body;

    // Validate required fields
    if (!examId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Get all exam subjects for this class
    let examSubjectsQuery = db
      .select()
      .from(examSubjects)
      .where(
        and(
          eq(examSubjects.examId, examId),
          eq(examSubjects.classId, classId)
        )
      );

    if (sectionId) {
      examSubjectsQuery = examSubjectsQuery.where(
        and(
          eq(examSubjects.examId, examId),
          eq(examSubjects.classId, classId),
          eq(examSubjects.sectionId, sectionId)
        )
      );
    }

    const examSubjectsList = await examSubjectsQuery;

    if (examSubjectsList.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No exam subjects found',
      });
    }

    const examSubjectIds = examSubjectsList.map(es => es.id);

    // Get all marks for these exam subjects
    const allMarks = await db
      .select()
      .from(marks)
      .where(inArray(marks.examSubjectId, examSubjectIds));

    // Group marks by student
    const studentMarks: Record<string, any[]> = {};
    allMarks.forEach(mark => {
      if (!studentMarks[mark.studentId]) {
        studentMarks[mark.studentId] = [];
      }
      studentMarks[mark.studentId].push(mark);
    });

    // Calculate results for each student
    const resultsData = [];
    for (const [studentId, marks] of Object.entries(studentMarks)) {
      let totalMarks = 0;
      let marksObtained = 0;
      const subjectResultsData = [];

      for (const mark of marks) {
        const examSubject = examSubjectsList.find(es => es.id === mark.examSubjectId);
        if (!examSubject) continue;

        totalMarks += examSubject.totalMarks;
        const obtained = mark.isAbsent ? 0 : parseFloat(mark.marksObtained || '0');
        marksObtained += obtained;

        const subjectPercentage = (obtained / examSubject.totalMarks) * 100;
        const subjectGrade = await calculateGrade(subjectPercentage);

        subjectResultsData.push({
          subjectId: examSubject.subjectId,
          totalMarks: examSubject.totalMarks,
          marksObtained: obtained,
          grade: subjectGrade.grade,
          gradePoint: subjectGrade.gradePoint,
          isPassed: obtained >= examSubject.passingMarks,
        });
      }

      const percentage = (marksObtained / totalMarks) * 100;
      const overallGrade = await calculateGrade(percentage);

      resultsData.push({
        studentId,
        totalMarks,
        marksObtained,
        percentage,
        grade: overallGrade.grade,
        gradePoint: overallGrade.gradePoint,
        subjectResults: subjectResultsData,
      });
    }

    // Sort by marks obtained for merit position
    resultsData.sort((a, b) => b.marksObtained - a.marksObtained);

    // Assign merit positions
    resultsData.forEach((result, index) => {
      result.meritPosition = index + 1;
    });

    // Save results to database
    for (const result of resultsData) {
      // Check if result already exists
      const existing = await db
        .select()
        .from(results)
        .where(
          and(
            eq(results.examId, examId),
            eq(results.studentId, result.studentId)
          )
        );

      let resultId;
      if (existing.length > 0) {
        // Update existing result
        const [updated] = await db
          .update(results)
          .set({
            totalMarks: result.totalMarks,
            marksObtained: result.marksObtained.toString(),
            percentage: result.percentage.toString(),
            grade: result.grade,
            gradePoint: result.gradePoint.toString(),
            meritPosition: result.meritPosition,
            updatedAt: new Date(),
          })
          .where(eq(results.id, existing[0].id))
          .returning();
        resultId = updated.id;

        // Delete old subject results
        await db.delete(subjectResults).where(eq(subjectResults.resultId, resultId));
      } else {
        // Insert new result
        const [newResult] = await db
          .insert(results)
          .values({
            examId,
            studentId: result.studentId,
            classId,
            sectionId: sectionId || null,
            totalMarks: result.totalMarks,
            marksObtained: result.marksObtained.toString(),
            percentage: result.percentage.toString(),
            grade: result.grade,
            gradePoint: result.gradePoint.toString(),
            meritPosition: result.meritPosition,
            isPublished: false,
          })
          .returning();
        resultId = newResult.id;
      }

      // Insert subject results
      for (const subjectResult of result.subjectResults) {
        await db.insert(subjectResults).values({
          resultId,
          subjectId: subjectResult.subjectId,
          totalMarks: subjectResult.totalMarks,
          marksObtained: subjectResult.marksObtained.toString(),
          grade: subjectResult.grade,
          gradePoint: subjectResult.gradePoint.toString(),
          isPassed: subjectResult.isPassed,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Results processed successfully',
      data: {
        totalStudents: resultsData.length,
        processed: resultsData.length,
      },
    });
  } catch (error) {
    console.error('Error processing results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process results',
    });
  }
};

// Get student result
export const getStudentResult = async (req: Request, res: Response) => {
  try {
    const { examId, studentId } = req.params;

    const [result] = await db
      .select({
        id: results.id,
        totalMarks: results.totalMarks,
        marksObtained: results.marksObtained,
        percentage: results.percentage,
        grade: results.grade,
        gradePoint: results.gradePoint,
        meritPosition: results.meritPosition,
        isPublished: results.isPublished,
        exam: {
          id: exams.id,
          name: exams.name,
          examType: examTypes.name,
        },
        class: {
          id: classes.id,
          name: classes.name,
        },
        section: {
          id: sections.id,
          name: sections.name,
        },
      })
      .from(results)
      .leftJoin(exams, eq(results.examId, exams.id))
      .leftJoin(examTypes, eq(exams.examTypeId, examTypes.id))
      .leftJoin(classes, eq(results.classId, classes.id))
      .leftJoin(sections, eq(results.sectionId, sections.id))
      .where(
        and(
          eq(results.examId, examId),
          eq(results.studentId, studentId)
        )
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    // Get subject-wise results
    const subjectResultsList = await db
      .select({
        id: subjectResults.id,
        totalMarks: subjectResults.totalMarks,
        marksObtained: subjectResults.marksObtained,
        grade: subjectResults.grade,
        gradePoint: subjectResults.gradePoint,
        isPassed: subjectResults.isPassed,
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        },
      })
      .from(subjectResults)
      .leftJoin(subjects, eq(subjectResults.subjectId, subjects.id))
      .where(eq(subjectResults.resultId, result.id));

    res.status(200).json({
      success: true,
      data: {
        ...result,
        subjectResults: subjectResultsList,
      },
    });
  } catch (error) {
    console.error('Error fetching student result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch result',
    });
  }
};

// Publish results
export const publishResults = async (req: Request, res: Response) => {
  try {
    const { examId } = req.body;

    // Update exam
    await db
      .update(exams)
      .set({ resultsPublished: true, updatedAt: new Date() })
      .where(eq(exams.id, examId));

    // Update all results for this exam
    await db
      .update(results)
      .set({ isPublished: true, publishedAt: new Date() })
      .where(eq(results.examId, examId));

    res.status(200).json({
      success: true,
      message: 'Results published successfully',
    });
  } catch (error) {
    console.error('Error publishing results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish results',
    });
  }
};