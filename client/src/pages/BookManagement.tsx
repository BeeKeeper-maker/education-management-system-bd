import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, BookOpen, Library, TrendingUp } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher?: string;
  publicationYear?: number;
  category: string;
  language: string;
  edition?: string;
  pages?: number;
  totalQuantity: number;
  availableQuantity: number;
  shelfLocation?: string;
  description?: string;
  price: number;
  isActive: boolean;
}

interface Category {
  category: string;
  book_count: number;
}

export default function BookManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publicationYear: '',
    category: '',
    language: 'English',
    edition: '',
    pages: '',
    totalQuantity: '',
    shelfLocation: '',
    description: '',
    price: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [booksRes, categoriesRes, statsRes] = await Promise.all([
        fetch('/api/library/books', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/library/books/categories', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/library/books/statistics', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (!booksRes.ok) throw new Error('Failed to load books');

      const booksData = await booksRes.json();
      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { categories: [] };
      const statsData = statsRes.ok ? await statsRes.json() : null;

      setBooks(booksData.books || []);
      setCategories(categoriesData.categories || []);
      setStatistics(statsData?.statistics);
    } catch (error) {
      console.error('Load data error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load library data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBook = async () => {
    if (!bookForm.title || !bookForm.author || !bookForm.category || !bookForm.totalQuantity) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingBook ? `/api/library/books/${editingBook.id}` : '/api/library/books';
      const method = editingBook ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...bookForm,
          publicationYear: bookForm.publicationYear ? parseInt(bookForm.publicationYear) : undefined,
          pages: bookForm.pages ? parseInt(bookForm.pages) : undefined,
          totalQuantity: parseInt(bookForm.totalQuantity),
          price: parseInt(bookForm.price) || 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save book');
      }

      toast({
        title: 'Success',
        description: `Book ${editingBook ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Save book error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save book',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const response = await fetch(`/api/library/books/${bookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete book');
      }

      toast({
        title: 'Success',
        description: 'Book deleted successfully',
      });

      loadData();
    } catch (error: any) {
      console.error('Delete book error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete book',
        variant: 'destructive',
      });
    }
  };

  const openEditBook = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear?.toString() || '',
      category: book.category,
      language: book.language,
      edition: book.edition || '',
      pages: book.pages?.toString() || '',
      totalQuantity: book.totalQuantity.toString(),
      shelfLocation: book.shelfLocation || '',
      description: book.description || '',
      price: book.price.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      publisher: '',
      publicationYear: '',
      category: '',
      language: 'English',
      edition: '',
      pages: '',
      totalQuantity: '',
      shelfLocation: '',
      description: '',
      price: '',
    });
    setEditingBook(null);
  };

  // Filter books
  const filteredBooks = books.filter((book) => {
    if (filterCategory !== 'all' && book.category !== filterCategory) return false;
    if (filterLanguage !== 'all' && book.language !== filterLanguage) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn?.toLowerCase().includes(query) ||
        book.category.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading library catalog...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Book Management</h1>
          <p className="text-muted-foreground">Manage library catalog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Edit' : 'Add'} Book</DialogTitle>
              <DialogDescription>Enter book details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={bookForm.publisher}
                    onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    placeholder="e.g., Fiction"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={bookForm.language}
                    onValueChange={(value) => setBookForm({ ...bookForm, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicationYear">Publication Year</Label>
                  <Input
                    id="publicationYear"
                    type="number"
                    value={bookForm.publicationYear}
                    onChange={(e) => setBookForm({ ...bookForm, publicationYear: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edition">Edition</Label>
                  <Input
                    id="edition"
                    value={bookForm.edition}
                    onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pages">Pages</Label>
                  <Input
                    id="pages"
                    type="number"
                    value={bookForm.pages}
                    onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalQuantity">Total Quantity *</Label>
                  <Input
                    id="totalQuantity"
                    type="number"
                    value={bookForm.totalQuantity}
                    onChange={(e) => setBookForm({ ...bookForm, totalQuantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shelfLocation">Shelf Location</Label>
                  <Input
                    id="shelfLocation"
                    value={bookForm.shelfLocation}
                    onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
                    placeholder="e.g., A-101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={bookForm.price}
                    onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveBook} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Saving...' : editingBook ? 'Update' : 'Add'} Book
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
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

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <Library className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_books || 0}</div>
              <p className="text-xs text-muted-foreground">{statistics.total_copies || 0} copies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.available_copies || 0}
              </div>
              <p className="text-xs text-muted-foreground">Copies available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issued</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistics.issued_books || 0}
              </div>
              <p className="text-xs text-muted-foreground">Currently issued</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Library className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Book categories</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.category} value={cat.category}>
                      {cat.category} ({cat.book_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setFilterCategory('all');
              setFilterLanguage('all');
            }}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Books List */}
      <Card>
        <CardHeader>
          <CardTitle>Library Catalog</CardTitle>
          <CardDescription>
            Showing {filteredBooks.length} of {books.length} books
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No books found</p>
              <p className="text-sm">Try adjusting your filters or add a new book</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Author</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">ISBN</th>
                    <th className="text-center p-2">Total</th>
                    <th className="text-center p-2">Available</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{book.title}</td>
                      <td className="p-2">{book.author}</td>
                      <td className="p-2">
                        <Badge variant="outline">{book.category}</Badge>
                      </td>
                      <td className="p-2 text-muted-foreground">{book.isbn || '-'}</td>
                      <td className="text-center p-2">{book.totalQuantity}</td>
                      <td className="text-center p-2">
                        <Badge
                          variant={book.availableQuantity > 0 ? 'default' : 'destructive'}
                        >
                          {book.availableQuantity}
                        </Badge>
                      </td>
                      <td className="p-2">{book.shelfLocation || '-'}</td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditBook(book)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBook(book.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}