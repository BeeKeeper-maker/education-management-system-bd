import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, BookOpen, UserCheck, RotateCcw, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  availableQuantity: number;
  totalQuantity: number;
  shelfLocation: string;
}

interface BookIssue {
  issue: {
    id: string;
    issueDate: string;
    dueDate: string;
    returnDate: string | null;
    status: string;
    fineAmount: number;
  };
  book: Book;
  student: Student;
}

export default function IssueReturn() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<BookIssue[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<BookIssue | null>(null);

  const [issueForm, setIssueForm] = useState({
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    remarks: '',
  });

  const [returnForm, setReturnForm] = useState({
    returnDate: format(new Date(), 'yyyy-MM-dd'),
    fineAmount: '',
    remarks: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadIssuedBooks();
  }, []);

  const loadIssuedBooks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/library/issues?status=issued', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to load issued books');

      const data = await response.json();
      setIssuedBooks(data.issues || []);
    } catch (error) {
      console.error('Load issued books error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load issued books',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchStudents = async (query: string) => {
    if (!query.trim()) {
      setStudents([]);
      return;
    }

    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to search students');

      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Search students error:', error);
      toast({
        title: 'Error',
        description: 'Failed to search students',
        variant: 'destructive',
      });
    }
  };

  const searchBooks = async (query: string) => {
    if (!query.trim()) {
      setBooks([]);
      return;
    }

    try {
      const response = await fetch(`/api/library/books?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to search books');

      const data = await response.json();
      // Filter only available books
      const availableBooks = (data.books || []).filter((book: Book) => book.availableQuantity > 0);
      setBooks(availableBooks);
    } catch (error) {
      console.error('Search books error:', error);
      toast({
        title: 'Error',
        description: 'Failed to search books',
        variant: 'destructive',
      });
    }
  };

  const handleIssueBook = async () => {
    if (!selectedStudent || !selectedBook) {
      toast({
        title: 'Validation Error',
        description: 'Please select both a student and a book',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/library/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          bookId: selectedBook.id,
          studentId: selectedStudent.id,
          issueDate: issueForm.issueDate,
          dueDate: issueForm.dueDate,
          remarks: issueForm.remarks || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to issue book');
      }

      toast({
        title: 'Success',
        description: 'Book issued successfully',
      });

      setIsIssueDialogOpen(false);
      resetIssueForm();
      loadIssuedBooks();
    } catch (error: any) {
      console.error('Issue book error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue book',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnBook = async () => {
    if (!selectedIssue) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/library/issues/${selectedIssue.issue.id}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          returnDate: returnForm.returnDate,
          fineAmount: returnForm.fineAmount ? parseInt(returnForm.fineAmount) : 0,
          remarks: returnForm.remarks || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to return book');
      }

      toast({
        title: 'Success',
        description: 'Book returned successfully',
      });

      setIsReturnDialogOpen(false);
      resetReturnForm();
      loadIssuedBooks();
    } catch (error: any) {
      console.error('Return book error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to return book',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openIssueDialog = (student: Student, book: Book) => {
    setSelectedStudent(student);
    setSelectedBook(book);
    setIsIssueDialogOpen(true);
  };

  const openReturnDialog = (issue: BookIssue) => {
    setSelectedIssue(issue);
    
    // Calculate fine if overdue
    const dueDate = new Date(issue.issue.dueDate);
    const today = new Date();
    const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    const fine = daysOverdue * 5; // $5 per day

    setReturnForm({
      returnDate: format(new Date(), 'yyyy-MM-dd'),
      fineAmount: fine.toString(),
      remarks: daysOverdue > 0 ? `${daysOverdue} days overdue` : '',
    });
    setIsReturnDialogOpen(true);
  };

  const resetIssueForm = () => {
    setIssueForm({
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      remarks: '',
    });
    setSelectedStudent(null);
    setSelectedBook(null);
    setStudentSearch('');
    setBookSearch('');
    setStudents([]);
    setBooks([]);
  };

  const resetReturnForm = () => {
    setReturnForm({
      returnDate: format(new Date(), 'yyyy-MM-dd'),
      fineAmount: '',
      remarks: '',
    });
    setSelectedIssue(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading library data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Issue & Return Books</h1>
        <p className="text-muted-foreground">Manage book circulation</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Issued</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{issuedBooks.length}</div>
            <p className="text-xs text-muted-foreground">Books in circulation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {issuedBooks.filter((issue) => new Date(issue.issue.dueDate) < new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">Books past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {issuedBooks.filter((issue) => new Date(issue.issue.dueDate) >= new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">Books within due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="issue" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="issue">Issue Book</TabsTrigger>
          <TabsTrigger value="return">Return Book</TabsTrigger>
        </TabsList>

        {/* Issue Book Tab */}
        <TabsContent value="issue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Student */}
            <Card>
              <CardHeader>
                <CardTitle>Search Student</CardTitle>
                <CardDescription>Find student by name or ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter student name or ID..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      searchStudents(e.target.value);
                    }}
                    className="pl-8"
                  />
                </div>

                {selectedStudent ? (
                  <Card className="border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{selectedStudent.studentId}</div>
                        </div>
                        <Badge variant="default">Selected</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ) : students.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {students.map((student) => (
                      <Card
                        key={student.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => {
                          setSelectedStudent(student);
                          setStudents([]);
                          setStudentSearch('');
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{student.studentId}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Search Book */}
            <Card>
              <CardHeader>
                <CardTitle>Search Book</CardTitle>
                <CardDescription>Find available book by title or author</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter book title or author..."
                    value={bookSearch}
                    onChange={(e) => {
                      setBookSearch(e.target.value);
                      searchBooks(e.target.value);
                    }}
                    className="pl-8"
                  />
                </div>

                {selectedBook ? (
                  <Card className="border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">{selectedBook.title}</div>
                          <div className="text-sm text-muted-foreground">{selectedBook.author}</div>
                        </div>
                        <Badge variant="default">Selected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Available: {selectedBook.availableQuantity}/{selectedBook.totalQuantity}
                      </div>
                    </CardContent>
                  </Card>
                ) : books.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {books.map((book) => (
                      <Card
                        key={book.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => {
                          setSelectedBook(book);
                          setBooks([]);
                          setBookSearch('');
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="font-medium">{book.title}</div>
                          <div className="text-sm text-muted-foreground">{book.author}</div>
                          <div className="text-sm text-muted-foreground">
                            Available: {book.availableQuantity}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Issue Button */}
          {selectedStudent && selectedBook && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Ready to Issue</h3>
                    <p className="text-sm text-muted-foreground">
                      Issue "{selectedBook.title}" to {selectedStudent.firstName} {selectedStudent.lastName}
                    </p>
                  </div>
                  <Button size="lg" onClick={() => setIsIssueDialogOpen(true)}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Issue Book
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Return Book Tab */}
        <TabsContent value="return">
          <Card>
            <CardHeader>
              <CardTitle>Currently Issued Books</CardTitle>
              <CardDescription>{issuedBooks.length} books to return</CardDescription>
            </CardHeader>
            <CardContent>
              {issuedBooks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No books currently issued</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Book</th>
                        <th className="text-left p-2">Student</th>
                        <th className="text-left p-2">Issue Date</th>
                        <th className="text-left p-2">Due Date</th>
                        <th className="text-center p-2">Status</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issuedBooks.map((issue) => {
                        const isOverdue = new Date(issue.issue.dueDate) < new Date();
                        return (
                          <tr key={issue.issue.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <div className="font-medium">{issue.book.title}</div>
                              <div className="text-xs text-muted-foreground">{issue.book.author}</div>
                            </td>
                            <td className="p-2">
                              <div>{issue.student.firstName} {issue.student.lastName}</div>
                              <div className="text-xs text-muted-foreground">{issue.student.studentId}</div>
                            </td>
                            <td className="p-2">{format(new Date(issue.issue.issueDate), 'MMM dd, yyyy')}</td>
                            <td className="p-2">{format(new Date(issue.issue.dueDate), 'MMM dd, yyyy')}</td>
                            <td className="text-center p-2">
                              <Badge variant={isOverdue ? 'destructive' : 'default'}>
                                {isOverdue ? 'Overdue' : 'On Time'}
                              </Badge>
                            </td>
                            <td className="text-center p-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openReturnDialog(issue)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Return
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Issue Book Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
            <DialogDescription>
              Issue "{selectedBook?.title}" to {selectedStudent?.firstName} {selectedStudent?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueForm.issueDate}
                  onChange={(e) => setIssueForm({ ...issueForm, issueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={issueForm.dueDate}
                  onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueRemarks">Remarks</Label>
              <Input
                id="issueRemarks"
                placeholder="Additional notes..."
                value={issueForm.remarks}
                onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleIssueBook} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Issuing...' : 'Issue Book'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsIssueDialogOpen(false);
                  resetIssueForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>
              Return "{selectedIssue?.book.title}" from {selectedIssue?.student.firstName}{' '}
              {selectedIssue?.student.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="returnDate">Return Date *</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={returnForm.returnDate}
                  onChange={(e) => setReturnForm({ ...returnForm, returnDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fineAmount">Fine Amount</Label>
                <Input
                  id="fineAmount"
                  type="number"
                  value={returnForm.fineAmount}
                  onChange={(e) => setReturnForm({ ...returnForm, fineAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnRemarks">Remarks</Label>
              <Input
                id="returnRemarks"
                placeholder="Additional notes..."
                value={returnForm.remarks}
                onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleReturnBook} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Processing...' : 'Return Book'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsReturnDialogOpen(false);
                  resetReturnForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}