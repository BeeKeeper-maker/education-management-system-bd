import { Request, Response } from 'express';
import { db } from '../db';
import { books, bookIssues, users } from '../db/schema';
import { eq, and, or, sql, desc, asc, like, lte, gte } from 'drizzle-orm';
   import { sendLibraryOverdueSms } from '../services/sms.service';

// Get all books
export const getBooks = async (req: Request, res: Response) => {
  try {
    const { search, category, language, isActive } = req.query;

    const conditions = [];
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(books.title, searchTerm),
          like(books.author, searchTerm),
          like(books.isbn, searchTerm)
        )
      );
    }
    
    if (category) conditions.push(eq(books.category, category as string));
    if (language) conditions.push(eq(books.language, language as string));
    if (isActive !== undefined) conditions.push(eq(books.isActive, isActive === 'true'));

    let query = db.select().from(books);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const booksList = await query.orderBy(asc(books.title));

    res.json({
      success: true,
      books: booksList,
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
    });
  }
};

// Get book by ID
export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const book = await db.select().from(books).where(eq(books.id, id)).limit(1);

    if (!book.length) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Get issue history for this book
    const issues = await db
      .select({
        issue: bookIssues,
        student: {
          id: sql`students.id`,
          studentId: sql`students.student_id`,
          firstName: sql`students.first_name`,
          lastName: sql`students.last_name`,
        },
      })
      .from(bookIssues)
      .innerJoin(sql`students`, eq(bookIssues.studentId, sql`students.id`))
      .where(eq(bookIssues.bookId, id))
      .orderBy(desc(bookIssues.issueDate));

    res.json({
      success: true,
      book: {
        ...book[0],
        issues,
      },
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
    });
  }
};

// Create book
export const createBook = async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      isbn,
      publisher,
      publicationYear,
      category,
      language,
      edition,
      pages,
      totalQuantity,
      shelfLocation,
      description,
      coverImage,
      price,
    } = req.body;

    const newBook = await db
      .insert(books)
      .values({
        title,
        author,
        isbn,
        publisher,
        publicationYear,
        category,
        language: language || 'English',
        edition,
        pages,
        totalQuantity,
        availableQuantity: totalQuantity, // Initially all books are available
        shelfLocation,
        description,
        coverImage,
        price,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      book: newBook[0],
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add book',
    });
  }
};

// Update book
export const updateBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If totalQuantity is updated, adjust availableQuantity proportionally
    if (updateData.totalQuantity !== undefined) {
      const book = await db.select().from(books).where(eq(books.id, id)).limit(1);
      
      if (book.length) {
        const issuedBooks = book[0].totalQuantity - book[0].availableQuantity;
        updateData.availableQuantity = Math.max(0, updateData.totalQuantity - issuedBooks);
      }
    }

    const updated = await db
      .update(books)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(books.id, id))
      .returning();

    if (!updated.length) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      book: updated[0],
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
    });
  }
};

// Delete book
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if book has active issues
    const activeIssues = await db
      .select()
      .from(bookIssues)
      .where(and(eq(bookIssues.bookId, id), eq(bookIssues.status, 'issued')));

    if (activeIssues.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with active issues',
      });
    }

    await db.delete(books).where(eq(books.id, id));

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
    });
  }
};

// Issue book to student
export const issueBook = async (req: Request, res: Response) => {
  try {
    const { bookId, studentId, issueDate, dueDate, remarks } = req.body;
    const userId = (req as any).user.id;

    // Check if book exists and is available
    const book = await db.select().from(books).where(eq(books.id, bookId)).limit(1);

    if (!book.length) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (book[0].availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available',
      });
    }

    // Check if student already has this book issued
    const existingIssue = await db
      .select()
      .from(bookIssues)
      .where(
        and(
          eq(bookIssues.bookId, bookId),
          eq(bookIssues.studentId, studentId),
          eq(bookIssues.status, 'issued')
        )
      );

    if (existingIssue.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Student already has this book issued',
      });
    }

    // Create issue record
    const issue = await db
      .insert(bookIssues)
      .values({
        bookId,
        studentId,
        issueDate,
        dueDate,
        remarks,
        issuedBy: userId,
      })
      .returning();

    // Update book available quantity
    await db
      .update(books)
      .set({
        availableQuantity: book[0].availableQuantity - 1,
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId));

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      issue: issue[0],
    });
  } catch (error) {
    console.error('Issue book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue book',
    });
  }
};

// Return book
export const returnBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { returnDate, fineAmount, remarks } = req.body;
    const userId = (req as any).user.id;

    const issue = await db.select().from(bookIssues).where(eq(bookIssues.id, id)).limit(1);

    if (!issue.length) {
      return res.status(404).json({
        success: false,
        message: 'Issue record not found',
      });
    }

    if (issue[0].status !== 'issued') {
      return res.status(400).json({
        success: false,
        message: 'Book is not currently issued',
      });
    }

    // Update issue record
    await db
      .update(bookIssues)
      .set({
        status: 'returned',
        returnDate,
        fineAmount: fineAmount || 0,
        remarks: remarks || issue[0].remarks,
        returnedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(bookIssues.id, id));

    // Update book available quantity
    await db.execute(sql`
      UPDATE books 
      SET available_quantity = available_quantity + 1,
          updated_at = NOW()
      WHERE id = ${issue[0].bookId}
    `);

    res.json({
      success: true,
      message: 'Book returned successfully',
   
       // Send SMS notification if there's a fine
       if (fineAmount && fineAmount > 0) {
         try {
           const [user] = await db
             .select({
               name: users.name,
               phone: users.phone,
             })
             .from(users)
             .where(eq(users.id, issue[0].studentId));

           const [book] = await db
             .select({
               title: books.title,
             })
             .from(books)
             .where(eq(books.id, issue[0].bookId));

           if (user?.phone && book) {
             await sendLibraryOverdueSms(
               user.phone,
               user.name,
               book.title,
               new Date(issue[0].dueDate).toLocaleDateString(),
               fineAmount
             );
           }
         } catch (smsError) {
           console.error('Error sending library overdue SMS:', smsError);
         }
       }
   
       res.json({
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return book',
    });
  }
};

// Get book issues
export const getBookIssues = async (req: Request, res: Response) => {
  try {
    const { bookId, studentId, status } = req.query;

    const conditions = [];
    if (bookId) conditions.push(eq(bookIssues.bookId, bookId as string));
    if (studentId) conditions.push(eq(bookIssues.studentId, studentId as string));
    if (status) conditions.push(eq(bookIssues.status, status as string));

    let query = db
      .select({
        issue: bookIssues,
        book: books,
        student: {
          id: sql`students.id`,
          studentId: sql`students.student_id`,
          firstName: sql`students.first_name`,
          lastName: sql`students.last_name`,
          email: sql`students.email`,
        },
      })
      .from(bookIssues)
      .innerJoin(books, eq(bookIssues.bookId, books.id))
      .innerJoin(sql`students`, eq(bookIssues.studentId, sql`students.id`));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const issues = await query.orderBy(desc(bookIssues.issueDate));

    res.json({
      success: true,
      issues,
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
    });
  }
};

// Get student's issued books
export const getStudentBooks = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const issues = await db
      .select({
        issue: bookIssues,
        book: books,
      })
      .from(bookIssues)
      .innerJoin(books, eq(bookIssues.bookId, books.id))
      .where(and(eq(bookIssues.studentId, studentId), eq(bookIssues.status, 'issued')))
      .orderBy(desc(bookIssues.issueDate));

    res.json({
      success: true,
      issues,
    });
  } catch (error) {
    console.error('Get student books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student books',
    });
  }
};

// Get library statistics
export const getLibraryStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT b.id) as total_books,
        SUM(b.total_quantity) as total_copies,
        SUM(b.available_quantity) as available_copies,
        COUNT(DISTINCT CASE WHEN bi.status = 'issued' THEN bi.id END) as issued_books,
        COUNT(DISTINCT CASE WHEN bi.status = 'overdue' THEN bi.id END) as overdue_books,
        COUNT(DISTINCT b.category) as total_categories
      FROM books b
      LEFT JOIN book_issues bi ON b.id = bi.book_id
      WHERE b.is_active = true
    `);

    res.json({
      success: true,
      statistics: stats.rows[0],
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
};

// Get book categories
export const getBookCategories = async (req: Request, res: Response) => {
  try {
    const categories = await db.execute(sql`
      SELECT DISTINCT category, COUNT(*) as book_count
      FROM books
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `);

    res.json({
      success: true,
      categories: categories.rows,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
};

// Update overdue status (should be run periodically)
export const updateOverdueStatus = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    await db
      .update(bookIssues)
      .set({ status: 'overdue', updatedAt: new Date() })
      .where(and(eq(bookIssues.status, 'issued'), lte(bookIssues.dueDate, today)));

    res.json({
      success: true,
      message: 'Overdue status updated successfully',
    });
  } catch (error) {
    console.error('Update overdue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update overdue status',
    });
  }
};