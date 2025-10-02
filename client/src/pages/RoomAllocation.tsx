import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Building, DoorOpen, Users, CheckCircle } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentClass?: string;
  currentSection?: string;
}

interface Hostel {
  id: string;
  name: string;
  type: string;
  totalCapacity: number;
  occupiedCapacity: number;
}

interface Room {
  id: string;
  hostelId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  occupiedCapacity: number;
  type: string;
  monthlyRent: number;
}

interface Allocation {
  id: string;
  allocation: any;
  room: Room;
  hostel: Hostel;
  student: Student;
}

export default function RoomAllocation() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHostel, setSelectedHostel] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    allocationDate: new Date().toISOString().split('T')[0],
    bedNumber: '',
    monthlyRent: '',
    remarks: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedHostel && selectedHostel !== 'all') {
      loadRooms(selectedHostel);
    } else {
      setRooms([]);
    }
  }, [selectedHostel]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, hostelsRes, allocationsRes] = await Promise.all([
        fetch('/api/students', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/hostel/hostels', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/hostel/allocations?status=active', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (!studentsRes.ok || !hostelsRes.ok) throw new Error('Failed to load data');

      const studentsData = await studentsRes.json();
      const hostelsData = await hostelsRes.json();
      const allocationsData = allocationsRes.ok ? await allocationsRes.json() : { allocations: [] };

      setStudents(studentsData.students || []);
      setHostels(hostelsData.hostels || []);
      setAllocations(allocationsData.allocations || []);
    } catch (error) {
      console.error('Load data error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRooms = async (hostelId: string) => {
    try {
      const response = await fetch(`/api/hostel/hostels/${hostelId}/rooms?isActive=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to load rooms');

      const data = await response.json();
      // Filter only rooms with available capacity
      const availableRooms = (data.rooms || []).filter((room: Room) => room.occupiedCapacity < room.capacity);
      setRooms(availableRooms);
    } catch (error) {
      console.error('Load rooms error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rooms',
        variant: 'destructive',
      });
    }
  };

  const handleAllocateRoom = async () => {
    if (!selectedStudent || !selectedRoom) {
      toast({
        title: 'Validation Error',
        description: 'Please select both a student and a room',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/hostel/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          studentId: selectedStudent.id,
          allocationDate: allocationForm.allocationDate,
          bedNumber: allocationForm.bedNumber || undefined,
          monthlyRent: allocationForm.monthlyRent ? parseInt(allocationForm.monthlyRent) : undefined,
          remarks: allocationForm.remarks || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to allocate room');
      }

      toast({
        title: 'Success',
        description: 'Room allocated successfully',
      });

      setIsAllocateDialogOpen(false);
      resetAllocationForm();
      loadData();
      if (selectedHostel !== 'all') loadRooms(selectedHostel);
    } catch (error: any) {
      console.error('Allocate room error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to allocate room',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVacateRoom = async (allocationId: string) => {
    if (!confirm('Are you sure you want to vacate this room?')) return;

    try {
      const response = await fetch(`/api/hostel/allocations/${allocationId}/vacate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          vacateDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to vacate room');
      }

      toast({
        title: 'Success',
        description: 'Room vacated successfully',
      });

      loadData();
      if (selectedHostel !== 'all') loadRooms(selectedHostel);
    } catch (error: any) {
      console.error('Vacate room error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to vacate room',
        variant: 'destructive',
      });
    }
  };

  const openAllocateDialog = (student: Student, room: Room) => {
    setSelectedStudent(student);
    setSelectedRoom(room);
    setAllocationForm({
      ...allocationForm,
      monthlyRent: room.monthlyRent.toString(),
    });
    setIsAllocateDialogOpen(true);
  };

  const resetAllocationForm = () => {
    setAllocationForm({
      allocationDate: new Date().toISOString().split('T')[0],
      bedNumber: '',
      monthlyRent: '',
      remarks: '',
    });
    setSelectedStudent(null);
    setSelectedRoom(null);
  };

  // Get allocated student IDs
  const allocatedStudentIds = new Set(allocations.map((a) => a.student.id));

  // Filter unallocated students
  const unallocatedStudents = students.filter((s) => !allocatedStudentIds.has(s.id));

  // Filter students by search
  const filteredStudents = unallocatedStudents.filter((student) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading allocation data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Room Allocation</h1>
        <p className="text-muted-foreground">Allocate rooms to students</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{allocations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unallocated</CardTitle>
            <UserPlus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unallocatedStudents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unallocated Students */}
        <Card>
          <CardHeader>
            <CardTitle>Unallocated Students</CardTitle>
            <CardDescription>{filteredStudents.length} students without rooms</CardDescription>
            <div className="pt-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No unallocated students found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{student.studentId}</div>
                          {student.currentClass && (
                            <div className="text-sm text-muted-foreground">
                              Class {student.currentClass} - {student.currentSection}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">Unallocated</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Rooms */}
        <Card>
          <CardHeader>
            <CardTitle>Available Rooms</CardTitle>
            <CardDescription>Select hostel to view available rooms</CardDescription>
            <div className="pt-4">
              <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hostel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hostels</SelectItem>
                  {hostels.map((hostel) => (
                    <SelectItem key={hostel.id} value={hostel.id}>
                      {hostel.name} ({hostel.totalCapacity - hostel.occupiedCapacity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedHostel === 'all' ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a hostel to view available rooms</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DoorOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No available rooms in this hostel</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rooms.map((room) => (
                  <Card key={room.id} className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">Room {room.roomNumber}</div>
                          <div className="text-sm text-muted-foreground">Floor {room.floor}</div>
                        </div>
                        <Badge variant="outline">{room.type}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Available: {room.capacity - room.occupiedCapacity}/{room.capacity}
                        </span>
                        <span className="font-medium">${room.monthlyRent}/mo</span>
                      </div>
                      {selectedStudent && (
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => openAllocateDialog(selectedStudent, room)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Allocate to {selectedStudent.firstName}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Allocations */}
      <Card>
        <CardHeader>
          <CardTitle>Current Allocations</CardTitle>
          <CardDescription>{allocations.length} active allocations</CardDescription>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No active allocations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Student ID</th>
                    <th className="text-left p-2">Hostel</th>
                    <th className="text-left p-2">Room</th>
                    <th className="text-left p-2">Bed</th>
                    <th className="text-right p-2">Rent</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((allocation) => (
                    <tr key={allocation.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {allocation.student.firstName} {allocation.student.lastName}
                      </td>
                      <td className="p-2">{allocation.student.studentId}</td>
                      <td className="p-2">{allocation.hostel.name}</td>
                      <td className="p-2">Room {allocation.room.roomNumber}</td>
                      <td className="p-2">{allocation.allocation.bedNumber || '-'}</td>
                      <td className="text-right p-2">${allocation.allocation.monthlyRent}/mo</td>
                      <td className="text-center p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVacateRoom(allocation.allocation.id)}
                        >
                          Vacate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocation Dialog */}
      <Dialog open={isAllocateDialogOpen} onOpenChange={setIsAllocateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Room</DialogTitle>
            <DialogDescription>
              Allocate Room {selectedRoom?.roomNumber} to {selectedStudent?.firstName}{' '}
              {selectedStudent?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allocationDate">Allocation Date *</Label>
              <Input
                id="allocationDate"
                type="date"
                value={allocationForm.allocationDate}
                onChange={(e) =>
                  setAllocationForm({ ...allocationForm, allocationDate: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedNumber">Bed Number</Label>
                <Input
                  id="bedNumber"
                  placeholder="e.g., A1"
                  value={allocationForm.bedNumber}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, bedNumber: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rent</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={allocationForm.monthlyRent}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, monthlyRent: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                placeholder="Additional notes..."
                value={allocationForm.remarks}
                onChange={(e) => setAllocationForm({ ...allocationForm, remarks: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAllocateRoom} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Allocating...' : 'Allocate Room'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAllocateDialogOpen(false);
                  resetAllocationForm();
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