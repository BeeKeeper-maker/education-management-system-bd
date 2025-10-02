import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building, Bed, Users, DoorOpen } from 'lucide-react';

interface Hostel {
  id: string;
  name: string;
  type: string;
  totalCapacity: number;
  occupiedCapacity: number;
  address: string;
  wardenName: string;
  wardenPhone: string;
  facilities: string;
  description: string;
  isActive: boolean;
}

interface Room {
  id: string;
  hostelId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  occupiedCapacity: number;
  type: string;
  facilities: string;
  monthlyRent: number;
  isActive: boolean;
}

export default function HostelManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  const [isHostelDialogOpen, setIsHostelDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [hostelForm, setHostelForm] = useState({
    name: '',
    type: 'boys',
    totalCapacity: '',
    address: '',
    wardenName: '',
    wardenPhone: '',
    facilities: '',
    description: '',
  });

  const [roomForm, setRoomForm] = useState({
    hostelId: '',
    roomNumber: '',
    floor: '',
    capacity: '',
    type: 'double',
    facilities: '',
    monthlyRent: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedHostel) {
      loadRooms(selectedHostel.id);
    }
  }, [selectedHostel]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hostelsRes, statsRes] = await Promise.all([
        fetch('/api/hostel/hostels', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/hostel/hostels/statistics', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (!hostelsRes.ok) throw new Error('Failed to load hostels');

      const hostelsData = await hostelsRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : null;

      setHostels(hostelsData.hostels || []);
      setStatistics(statsData?.statistics);

      if (hostelsData.hostels?.length > 0) {
        setSelectedHostel(hostelsData.hostels[0]);
      }
    } catch (error) {
      console.error('Load data error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hostel data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRooms = async (hostelId: string) => {
    try {
      const response = await fetch(`/api/hostel/hostels/${hostelId}/rooms`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to load rooms');

      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Load rooms error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rooms',
        variant: 'destructive',
      });
    }
  };

  const handleCreateHostel = async () => {
    if (!hostelForm.name || !hostelForm.totalCapacity) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingHostel
        ? `/api/hostel/hostels/${editingHostel.id}`
        : '/api/hostel/hostels';
      const method = editingHostel ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...hostelForm,
          totalCapacity: parseInt(hostelForm.totalCapacity),
          facilities: hostelForm.facilities ? hostelForm.facilities.split(',').map(f => f.trim()) : [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save hostel');
      }

      toast({
        title: 'Success',
        description: `Hostel ${editingHostel ? 'updated' : 'created'} successfully`,
      });

      setIsHostelDialogOpen(false);
      resetHostelForm();
      loadData();
    } catch (error: any) {
      console.error('Save hostel error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save hostel',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomForm.roomNumber || !roomForm.capacity || !roomForm.floor) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingRoom ? `/api/hostel/rooms/${editingRoom.id}` : '/api/hostel/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...roomForm,
          hostelId: selectedHostel?.id,
          floor: parseInt(roomForm.floor),
          capacity: parseInt(roomForm.capacity),
          monthlyRent: parseInt(roomForm.monthlyRent) || 0,
          facilities: roomForm.facilities ? roomForm.facilities.split(',').map(f => f.trim()) : [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save room');
      }

      toast({
        title: 'Success',
        description: `Room ${editingRoom ? 'updated' : 'created'} successfully`,
      });

      setIsRoomDialogOpen(false);
      resetRoomForm();
      if (selectedHostel) loadRooms(selectedHostel.id);
    } catch (error: any) {
      console.error('Save room error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save room',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHostel = async (hostelId: string) => {
    if (!confirm('Are you sure you want to delete this hostel?')) return;

    try {
      const response = await fetch(`/api/hostel/hostels/${hostelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete hostel');
      }

      toast({
        title: 'Success',
        description: 'Hostel deleted successfully',
      });

      loadData();
    } catch (error: any) {
      console.error('Delete hostel error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete hostel',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(`/api/hostel/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete room');
      }

      toast({
        title: 'Success',
        description: 'Room deleted successfully',
      });

      if (selectedHostel) loadRooms(selectedHostel.id);
    } catch (error: any) {
      console.error('Delete room error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete room',
        variant: 'destructive',
      });
    }
  };

  const openEditHostel = (hostel: Hostel) => {
    setEditingHostel(hostel);
    setHostelForm({
      name: hostel.name,
      type: hostel.type,
      totalCapacity: hostel.totalCapacity.toString(),
      address: hostel.address || '',
      wardenName: hostel.wardenName || '',
      wardenPhone: hostel.wardenPhone || '',
      facilities: hostel.facilities ? JSON.parse(hostel.facilities).join(', ') : '',
      description: hostel.description || '',
    });
    setIsHostelDialogOpen(true);
  };

  const openEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      hostelId: room.hostelId,
      roomNumber: room.roomNumber,
      floor: room.floor.toString(),
      capacity: room.capacity.toString(),
      type: room.type,
      facilities: room.facilities ? JSON.parse(room.facilities).join(', ') : '',
      monthlyRent: room.monthlyRent.toString(),
    });
    setIsRoomDialogOpen(true);
  };

  const resetHostelForm = () => {
    setHostelForm({
      name: '',
      type: 'boys',
      totalCapacity: '',
      address: '',
      wardenName: '',
      wardenPhone: '',
      facilities: '',
      description: '',
    });
    setEditingHostel(null);
  };

  const resetRoomForm = () => {
    setRoomForm({
      hostelId: '',
      roomNumber: '',
      floor: '',
      capacity: '',
      type: 'double',
      facilities: '',
      monthlyRent: '',
    });
    setEditingRoom(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hostel data...</p>
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
          <h1 className="text-3xl font-bold">Hostel Management</h1>
          <p className="text-muted-foreground">Manage hostels and rooms</p>
        </div>
        <Dialog open={isHostelDialogOpen} onOpenChange={setIsHostelDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetHostelForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hostel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingHostel ? 'Edit' : 'Add'} Hostel</DialogTitle>
              <DialogDescription>Enter hostel details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hostel Name *</Label>
                  <Input
                    id="name"
                    value={hostelForm.name}
                    onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={hostelForm.type} onValueChange={(value) => setHostelForm({ ...hostelForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boys">Boys</SelectItem>
                      <SelectItem value="girls">Girls</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Total Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={hostelForm.totalCapacity}
                    onChange={(e) => setHostelForm({ ...hostelForm, totalCapacity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={hostelForm.address}
                    onChange={(e) => setHostelForm({ ...hostelForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wardenName">Warden Name</Label>
                  <Input
                    id="wardenName"
                    value={hostelForm.wardenName}
                    onChange={(e) => setHostelForm({ ...hostelForm, wardenName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wardenPhone">Warden Phone</Label>
                  <Input
                    id="wardenPhone"
                    value={hostelForm.wardenPhone}
                    onChange={(e) => setHostelForm({ ...hostelForm, wardenPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facilities">Facilities (comma-separated)</Label>
                <Input
                  id="facilities"
                  placeholder="WiFi, Gym, Laundry"
                  value={hostelForm.facilities}
                  onChange={(e) => setHostelForm({ ...hostelForm, facilities: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={hostelForm.description}
                  onChange={(e) => setHostelForm({ ...hostelForm, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateHostel} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Saving...' : editingHostel ? 'Update' : 'Create'} Hostel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsHostelDialogOpen(false);
                    resetHostelForm();
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
              <CardTitle className="text-sm font-medium">Total Hostels</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_hostels || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_rooms || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_capacity || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.occupied_capacity || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.total_capacity > 0
                  ? `${((statistics.occupied_capacity / statistics.total_capacity) * 100).toFixed(1)}% occupancy`
                  : '0% occupancy'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hostels List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Hostels</CardTitle>
            <CardDescription>{hostels.length} hostels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hostels.map((hostel) => (
                <Card
                  key={hostel.id}
                  className={`cursor-pointer transition-all ${
                    selectedHostel?.id === hostel.id ? 'border-primary shadow-md' : 'hover:border-accent'
                  }`}
                  onClick={() => setSelectedHostel(hostel)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{hostel.name}</h4>
                      <Badge variant={hostel.type === 'boys' ? 'default' : hostel.type === 'girls' ? 'secondary' : 'outline'}>
                        {hostel.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Capacity: {hostel.occupiedCapacity}/{hostel.totalCapacity}</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(hostel.occupiedCapacity / hostel.totalCapacity) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditHostel(hostel); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteHostel(hostel.id); }}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rooms List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedHostel?.name || 'Select a Hostel'}</CardTitle>
                <CardDescription>{rooms.length} rooms</CardDescription>
              </div>
              {selectedHostel && (
                <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetRoomForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingRoom ? 'Edit' : 'Add'} Room</DialogTitle>
                      <DialogDescription>Enter room details for {selectedHostel.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="roomNumber">Room Number *</Label>
                          <Input
                            id="roomNumber"
                            value={roomForm.roomNumber}
                            onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="floor">Floor *</Label>
                          <Input
                            id="floor"
                            type="number"
                            value={roomForm.floor}
                            onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="capacity">Capacity *</Label>
                          <Input
                            id="capacity"
                            type="number"
                            value={roomForm.capacity}
                            onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="roomType">Room Type *</Label>
                          <Select value={roomForm.type} onValueChange={(value) => setRoomForm({ ...roomForm, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                              <SelectItem value="triple">Triple</SelectItem>
                              <SelectItem value="dormitory">Dormitory</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="monthlyRent">Monthly Rent</Label>
                        <Input
                          id="monthlyRent"
                          type="number"
                          value={roomForm.monthlyRent}
                          onChange={(e) => setRoomForm({ ...roomForm, monthlyRent: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="roomFacilities">Facilities (comma-separated)</Label>
                        <Input
                          id="roomFacilities"
                          placeholder="AC, Attached Bathroom"
                          value={roomForm.facilities}
                          onChange={(e) => setRoomForm({ ...roomForm, facilities: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleCreateRoom} disabled={isSubmitting} className="flex-1">
                          {isSubmitting ? 'Saving...' : editingRoom ? 'Update' : 'Create'} Room
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsRoomDialogOpen(false);
                            resetRoomForm();
                          }}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedHostel ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a hostel to view rooms</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DoorOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No rooms found</p>
                <p className="text-sm">Click "Add Room" to create one</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <Card key={room.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Room {room.roomNumber}</h4>
                        <Badge variant="outline">{room.type}</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Floor:</span>
                          <span>{room.floor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span>{room.occupiedCapacity}/{room.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rent:</span>
                          <span>${room.monthlyRent}/month</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="ghost" size="sm" onClick={() => openEditRoom(room)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRoom(room.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}