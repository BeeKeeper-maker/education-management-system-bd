import { Request, Response } from 'express';
import { db } from '../db';
import { hostels, rooms, roomAllocations } from '../db/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

// Get all hostels
export const getHostels = async (req: Request, res: Response) => {
  try {
    const { type, isActive } = req.query;

    let query = db.select().from(hostels);

    // Apply filters
    const conditions = [];
    if (type) conditions.push(eq(hostels.type, type as string));
    if (isActive !== undefined) conditions.push(eq(hostels.isActive, isActive === 'true'));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const hostelsList = await query.orderBy(asc(hostels.name));

    res.json({
      success: true,
      hostels: hostelsList,
    });
  } catch (error) {
    console.error('Get hostels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hostels',
    });
  }
};

// Get hostel by ID with rooms
export const getHostelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hostel = await db.select().from(hostels).where(eq(hostels.id, id)).limit(1);

    if (!hostel.length) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found',
      });
    }

    // Get rooms for this hostel
    const hostelRooms = await db.select().from(rooms).where(eq(rooms.hostelId, id));

    res.json({
      success: true,
      hostel: {
        ...hostel[0],
        rooms: hostelRooms,
      },
    });
  } catch (error) {
    console.error('Get hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hostel',
    });
  }
};

// Create hostel
export const createHostel = async (req: Request, res: Response) => {
  try {
    const {
      name,
      type,
      totalCapacity,
      address,
      wardenId,
      wardenName,
      wardenPhone,
      facilities,
      description,
    } = req.body;

    const newHostel = await db
      .insert(hostels)
      .values({
        name,
        type,
        totalCapacity,
        address,
        wardenId,
        wardenName,
        wardenPhone,
        facilities: facilities ? JSON.stringify(facilities) : null,
        description,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Hostel created successfully',
      hostel: newHostel[0],
    });
  } catch (error) {
    console.error('Create hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hostel',
    });
  }
};

// Update hostel
export const updateHostel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.facilities) {
      updateData.facilities = JSON.stringify(updateData.facilities);
    }

    const updated = await db
      .update(hostels)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(hostels.id, id))
      .returning();

    if (!updated.length) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found',
      });
    }

    res.json({
      success: true,
      message: 'Hostel updated successfully',
      hostel: updated[0],
    });
  } catch (error) {
    console.error('Update hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hostel',
    });
  }
};

// Delete hostel
export const deleteHostel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if hostel has active allocations
    const activeAllocations = await db
      .select()
      .from(roomAllocations)
      .innerJoin(rooms, eq(roomAllocations.roomId, rooms.id))
      .where(and(eq(rooms.hostelId, id), eq(roomAllocations.status, 'active')));

    if (activeAllocations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete hostel with active room allocations',
      });
    }

    await db.delete(hostels).where(eq(hostels.id, id));

    res.json({
      success: true,
      message: 'Hostel deleted successfully',
    });
  } catch (error) {
    console.error('Delete hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hostel',
    });
  }
};

// Get rooms by hostel
export const getRoomsByHostel = async (req: Request, res: Response) => {
  try {
    const { hostelId } = req.params;
    const { isActive, type } = req.query;

    let query = db.select().from(rooms).where(eq(rooms.hostelId, hostelId));

    const conditions = [eq(rooms.hostelId, hostelId)];
    if (isActive !== undefined) conditions.push(eq(rooms.isActive, isActive === 'true'));
    if (type) conditions.push(eq(rooms.type, type as string));

    const roomsList = await db
      .select()
      .from(rooms)
      .where(and(...conditions))
      .orderBy(asc(rooms.floor), asc(rooms.roomNumber));

    res.json({
      success: true,
      rooms: roomsList,
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
    });
  }
};

// Create room
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { hostelId, roomNumber, floor, capacity, type, facilities, monthlyRent } = req.body;

    const newRoom = await db
      .insert(rooms)
      .values({
        hostelId,
        roomNumber,
        floor,
        capacity,
        type,
        facilities: facilities ? JSON.stringify(facilities) : null,
        monthlyRent,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: newRoom[0],
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
    });
  }
};

// Update room
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.facilities) {
      updateData.facilities = JSON.stringify(updateData.facilities);
    }

    const updated = await db
      .update(rooms)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();

    if (!updated.length) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    res.json({
      success: true,
      message: 'Room updated successfully',
      room: updated[0],
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room',
    });
  }
};

// Delete room
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if room has active allocations
    const activeAllocations = await db
      .select()
      .from(roomAllocations)
      .where(and(eq(roomAllocations.roomId, id), eq(roomAllocations.status, 'active')));

    if (activeAllocations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with active allocations',
      });
    }

    await db.delete(rooms).where(eq(rooms.id, id));

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
    });
  }
};

// Allocate room to student
export const allocateRoom = async (req: Request, res: Response) => {
  try {
    const { roomId, studentId, allocationDate, bedNumber, monthlyRent, remarks } = req.body;
    const userId = (req as any).user.id;

    // Check if room exists and has capacity
    const room = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);

    if (!room.length) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    if (room[0].occupiedCapacity >= room[0].capacity) {
      return res.status(400).json({
        success: false,
        message: 'Room is full',
      });
    }

    // Check if student already has active allocation
    const existingAllocation = await db
      .select()
      .from(roomAllocations)
      .where(and(eq(roomAllocations.studentId, studentId), eq(roomAllocations.status, 'active')));

    if (existingAllocation.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Student already has an active room allocation',
      });
    }

    // Create allocation
    const allocation = await db
      .insert(roomAllocations)
      .values({
        roomId,
        studentId,
        allocationDate: new Date(allocationDate),
        bedNumber,
        monthlyRent: monthlyRent || room[0].monthlyRent,
        remarks,
        allocatedBy: userId,
      })
      .returning();

    // Update room occupied capacity
    await db
      .update(rooms)
      .set({
        occupiedCapacity: room[0].occupiedCapacity + 1,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, roomId));

    // Update hostel occupied capacity
    await db.execute(sql`
      UPDATE hostels 
      SET occupied_capacity = occupied_capacity + 1,
          updated_at = NOW()
      WHERE id = ${room[0].hostelId}
    `);

    res.status(201).json({
      success: true,
      message: 'Room allocated successfully',
      allocation: allocation[0],
    });
  } catch (error) {
    console.error('Allocate room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate room',
    });
  }
};

// Vacate room
export const vacateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vacateDate, remarks } = req.body;

    const allocation = await db
      .select()
      .from(roomAllocations)
      .where(eq(roomAllocations.id, id))
      .limit(1);

    if (!allocation.length) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found',
      });
    }

    if (allocation[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Allocation is not active',
      });
    }

    // Update allocation
    await db
      .update(roomAllocations)
      .set({
        status: 'vacated',
        vacateDate: new Date(vacateDate),
        remarks: remarks || allocation[0].remarks,
        updatedAt: new Date(),
      })
      .where(eq(roomAllocations.id, id));

    // Get room details
    const room = await db.select().from(rooms).where(eq(rooms.id, allocation[0].roomId)).limit(1);

    if (room.length) {
      // Update room occupied capacity
      await db
        .update(rooms)
        .set({
          occupiedCapacity: Math.max(0, room[0].occupiedCapacity - 1),
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, allocation[0].roomId));

      // Update hostel occupied capacity
      await db.execute(sql`
        UPDATE hostels 
        SET occupied_capacity = GREATEST(0, occupied_capacity - 1),
            updated_at = NOW()
        WHERE id = ${room[0].hostelId}
      `);
    }

    res.json({
      success: true,
      message: 'Room vacated successfully',
    });
  } catch (error) {
    console.error('Vacate room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vacate room',
    });
  }
};

// Get allocations with details
export const getAllocations = async (req: Request, res: Response) => {
  try {
    const { hostelId, roomId, studentId, status } = req.query;

    const conditions = [];
    if (status) conditions.push(eq(roomAllocations.status, status as string));
    if (studentId) conditions.push(eq(roomAllocations.studentId, studentId as string));
    if (roomId) conditions.push(eq(roomAllocations.roomId, roomId as string));

    let query = db
      .select({
        allocation: roomAllocations,
        room: rooms,
        hostel: hostels,
        student: {
          id: sql`students.id`,
          studentId: sql`students.student_id`,
          firstName: sql`students.first_name`,
          lastName: sql`students.last_name`,
          email: sql`students.email`,
        },
      })
      .from(roomAllocations)
      .innerJoin(rooms, eq(roomAllocations.roomId, rooms.id))
      .innerJoin(hostels, eq(rooms.hostelId, hostels.id))
      .innerJoin(sql`students`, eq(roomAllocations.studentId, sql`students.id`));

    if (hostelId) {
      conditions.push(eq(rooms.hostelId, hostelId as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const allocations = await query.orderBy(desc(roomAllocations.allocationDate));

    res.json({
      success: true,
      allocations,
    });
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch allocations',
    });
  }
};

// Get student's hostel info
export const getStudentHostel = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const allocation = await db
      .select({
        allocation: roomAllocations,
        room: rooms,
        hostel: hostels,
      })
      .from(roomAllocations)
      .innerJoin(rooms, eq(roomAllocations.roomId, rooms.id))
      .innerJoin(hostels, eq(rooms.hostelId, hostels.id))
      .where(and(eq(roomAllocations.studentId, studentId), eq(roomAllocations.status, 'active')))
      .limit(1);

    if (!allocation.length) {
      return res.json({
        success: true,
        allocation: null,
        message: 'No active hostel allocation found',
      });
    }

    res.json({
      success: true,
      allocation: allocation[0],
    });
  } catch (error) {
    console.error('Get student hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student hostel info',
    });
  }
};

// Get hostel statistics
export const getHostelStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT h.id) as total_hostels,
        COUNT(DISTINCT r.id) as total_rooms,
        SUM(h.total_capacity) as total_capacity,
        SUM(h.occupied_capacity) as occupied_capacity,
        COUNT(DISTINCT CASE WHEN ra.status = 'active' THEN ra.id END) as active_allocations
      FROM hostels h
      LEFT JOIN rooms r ON h.id = r.hostel_id
      LEFT JOIN room_allocations ra ON r.id = ra.room_id
      WHERE h.is_active = true
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