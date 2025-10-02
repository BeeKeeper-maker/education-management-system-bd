import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, DollarSign, Receipt, Printer, CheckCircle, AlertCircle, Calendar, User } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentClass?: string;
  currentSection?: string;
}

interface FeeStructure {
  id: string;
  name: string;
  totalAmount: number;
  items: FeeStructureItem[];
}

interface FeeStructureItem {
  id: string;
  categoryName: string;
  amount: number;
  dueDate: string;
}

interface StudentFee {
  id: string;
  feeStructure: FeeStructure;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  dueDate: string;
}

interface PaymentHistory {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  collectedBy: string;
}

export default function FeeCollection() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Search students
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Search Required',
        description: 'Please enter a student name, ID, or admission number',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to search students');

      const data = await response.json();
      setSearchResults(data.students || []);

      if (data.students.length === 0) {
        toast({
          title: 'No Results',
          description: 'No students found matching your search',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to search students. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Select student and load their fees
  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
    
    // Load student fees
    try {
      const [feesResponse, paymentsResponse] = await Promise.all([
        fetch(`/api/fees/student/${student.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch(`/api/fees/payments/${student.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      if (!feesResponse.ok) throw new Error('Failed to load fees');

      const feesData = await feesResponse.json();
      const paymentsData = paymentsResponse.ok ? await paymentsResponse.json() : { payments: [] };

      setStudentFees(feesData.fees || []);
      setPaymentHistory(paymentsData.payments || []);

      // Auto-select first pending fee
      const pendingFee = feesData.fees?.find((f: StudentFee) => f.status !== 'paid');
      if (pendingFee) {
        setSelectedFee(pendingFee);
        setPaymentAmount(pendingFee.dueAmount.toString());
      }
    } catch (error) {
      console.error('Load fees error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student fees',
        variant: 'destructive',
      });
    }
  };

  // Process payment
  const handleProcessPayment = async () => {
    if (!selectedStudent || !selectedFee) return;

    const amount = parseFloat(paymentAmount);
    const discount = parseFloat(discountAmount) || 0;

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }

    if (amount > selectedFee.dueAmount) {
      toast({
        title: 'Amount Exceeds Due',
        description: 'Payment amount cannot exceed due amount',
        variant: 'destructive',
      });
      return;
    }

    if (discount > 0 && !discountReason.trim()) {
      toast({
        title: 'Discount Reason Required',
        description: 'Please provide a reason for the discount',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          studentFeeId: selectedFee.id,
          amount,
          paymentMethod,
          discountAmount: discount,
          discountReason: discount > 0 ? discountReason : undefined,
          remarks: remarks || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
      }

      const data = await response.json();
      
      // Show receipt
      setReceiptData(data.payment);
      setShowReceipt(true);

      // Refresh student fees
      handleSelectStudent(selectedStudent);

      // Reset form
      setPaymentAmount('');
      setDiscountAmount('');
      setDiscountReason('');
      setRemarks('');

      toast({
        title: 'Payment Successful',
        description: `Receipt #${data.payment.receiptNumber} generated`,
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Collection</h1>
          <p className="text-muted-foreground">Collect fees and generate receipts</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <User className="h-4 w-4 mr-2" />
          {user?.firstName} {user?.lastName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Search & Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Card */}
          <Card>
            <CardHeader>
              <CardTitle>Search Student</CardTitle>
              <CardDescription>Find student by name, ID, or admission number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter student name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((student) => (
                    <Card
                      key={student.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectStudent(student)}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium">{student.firstName} {student.lastName}</div>
                        <div className="text-sm text-muted-foreground">{student.studentId}</div>
                        {student.currentClass && (
                          <div className="text-sm text-muted-foreground">
                            Class {student.currentClass} - {student.currentSection}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Student Card */}
          {selectedStudent && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Student</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Student ID:</span>
                  <span className="font-medium">{selectedStudent.studentId}</span>
                </div>
                {selectedStudent.currentClass && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Class:</span>
                    <span className="font-medium">
                      {selectedStudent.currentClass} - {selectedStudent.currentSection}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium text-sm">{selectedStudent.email}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Fee Details & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <Tabs defaultValue="payment" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payment">Payment</TabsTrigger>
                <TabsTrigger value="history">Payment History</TabsTrigger>
              </TabsList>

              {/* Payment Tab */}
              <TabsContent value="payment" className="space-y-6">
                {/* Fee Structures */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fee Structures</CardTitle>
                    <CardDescription>Select a fee structure to collect payment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {studentFees.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No fee structures assigned to this student</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studentFees.map((fee) => (
                          <Card
                            key={fee.id}
                            className={`cursor-pointer transition-all ${
                              selectedFee?.id === fee.id
                                ? 'border-primary shadow-md'
                                : 'hover:border-accent'
                            }`}
                            onClick={() => {
                              setSelectedFee(fee);
                              setPaymentAmount(fee.dueAmount.toString());
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">{fee.feeStructure.name}</h4>
                                <Badge
                                  variant={
                                    fee.status === 'paid'
                                      ? 'default'
                                      : fee.status === 'partial'
                                      ? 'secondary'
                                      : 'destructive'
                                  }
                                >
                                  {fee.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Total:</span>
                                  <div className="font-medium">${fee.totalAmount.toFixed(2)}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Paid:</span>
                                  <div className="font-medium text-green-600">${fee.paidAmount.toFixed(2)}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Due:</span>
                                  <div className="font-medium text-red-600">${fee.dueAmount.toFixed(2)}</div>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Due: {new Date(fee.dueDate).toLocaleDateString()}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Form */}
                {selectedFee && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Collect Payment</CardTitle>
                      <CardDescription>Enter payment details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Payment Amount *</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum: ${selectedFee.dueAmount.toFixed(2)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="method">Payment Method *</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="online">Online Payment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discount">Discount Amount</Label>
                          <Input
                            id="discount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discountReason">Discount Reason</Label>
                          <Input
                            id="discountReason"
                            placeholder="e.g., Sibling discount"
                            value={discountReason}
                            onChange={(e) => setDiscountReason(e.target.value)}
                            disabled={!discountAmount || parseFloat(discountAmount) === 0}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks (Optional)</Label>
                        <Input
                          id="remarks"
                          placeholder="Additional notes..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <div className="text-sm text-muted-foreground">Amount to Pay</div>
                          <div className="text-2xl font-bold text-primary">
                            ${(parseFloat(paymentAmount) || 0).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          size="lg"
                          onClick={handleProcessPayment}
                          disabled={isProcessing || !paymentAmount}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          {isProcessing ? 'Processing...' : 'Process Payment'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Payment History Tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>All payments made by this student</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paymentHistory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No payment history available</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentHistory.map((payment) => (
                          <Card key={payment.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{payment.receiptNumber}</span>
                                </div>
                                <Badge variant="outline">{payment.paymentMethod}</Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Amount:</span>
                                  <div className="font-medium text-green-600">
                                    ${payment.amount.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Date:</span>
                                  <div className="font-medium">
                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Collected By:</span>
                                  <div className="font-medium text-sm">{payment.collectedBy}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Student Selected</h3>
                  <p>Search and select a student to collect fees</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>Payment processed successfully</DialogDescription>
          </DialogHeader>
          
          {receiptData && (
            <div className="space-y-6 print:p-8">
              {/* Receipt Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">EduPro</h2>
                <p className="text-sm text-muted-foreground">Fee Payment Receipt</p>
              </div>

              {/* Receipt Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Receipt Number:</span>
                  <div className="font-medium">{receiptData.receiptNumber}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="font-medium">
                    {new Date(receiptData.paymentDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Student Name:</span>
                  <div className="font-medium">
                    {selectedStudent?.firstName} {selectedStudent?.lastName}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Student ID:</span>
                  <div className="font-medium">{selectedStudent?.studentId}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Method:</span>
                  <div className="font-medium capitalize">{receiptData.paymentMethod}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Collected By:</span>
                  <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                </div>
              </div>

              {/* Amount */}
              <div className="border-t border-b py-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">Amount Paid:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${receiptData.amount.toFixed(2)}
                  </span>
                </div>
                {receiptData.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Discount Applied:</span>
                    <span className="text-red-600">-${receiptData.discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Success Message */}
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Payment Successful</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 print:hidden">
                <Button onClick={handlePrintReceipt} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setShowReceipt(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}