import { db } from '../index';
import { hostels, rooms, books } from '../schema';

export async function seedHostelAndLibrary() {
  console.log('🏨 Seeding hostel data...');

  // Seed Hostels
  const hostelData = [
    {
      name: "Boys' Hostel A",
      type: 'boys',
      totalCapacity: 100,
      address: '123 Campus Road, University Area',
      wardenName: 'Mr. John Smith',
      wardenPhone: '+1234567890',
      facilities: JSON.stringify(['WiFi', 'Gym', 'Common Room', 'Laundry', 'Cafeteria']),
      description: 'Modern hostel facility for male students with all amenities',
    },
    {
      name: "Girls' Hostel B",
      type: 'girls',
      totalCapacity: 80,
      address: '456 Campus Road, University Area',
      wardenName: 'Ms. Sarah Johnson',
      wardenPhone: '+1234567891',
      facilities: JSON.stringify(['WiFi', 'Gym', 'Common Room', 'Laundry', 'Cafeteria', '24/7 Security']),
      description: 'Safe and comfortable hostel for female students',
    },
    {
      name: 'International Hostel',
      type: 'mixed',
      totalCapacity: 60,
      address: '789 Campus Road, University Area',
      wardenName: 'Dr. Michael Brown',
      wardenPhone: '+1234567892',
      facilities: JSON.stringify(['WiFi', 'Study Room', 'Recreation Area', 'Kitchen']),
      description: 'Hostel for international and exchange students',
    },
  ];

  const createdHostels = await db.insert(hostels).values(hostelData).returning();
  console.log(`✅ Created ${createdHostels.length} hostels`);

  // Seed Rooms for each hostel
  const roomData = [];
  
  // Boys Hostel A - 20 rooms
  for (let floor = 1; floor <= 4; floor++) {
    for (let roomNum = 1; roomNum <= 5; roomNum++) {
      roomData.push({
        hostelId: createdHostels[0].id,
        roomNumber: `${floor}0${roomNum}`,
        floor,
        capacity: floor === 1 ? 2 : 3, // Ground floor: double, others: triple
        type: floor === 1 ? 'double' : 'triple',
        facilities: JSON.stringify(['Attached Bathroom', 'Study Table', 'Wardrobe', 'Fan']),
        monthlyRent: floor === 1 ? 3000 : 2500,
      });
    }
  }

  // Girls Hostel B - 16 rooms
  for (let floor = 1; floor <= 4; floor++) {
    for (let roomNum = 1; roomNum <= 4; roomNum++) {
      roomData.push({
        hostelId: createdHostels[1].id,
        roomNumber: `${floor}0${roomNum}`,
        floor,
        capacity: 2,
        type: 'double',
        facilities: JSON.stringify(['Attached Bathroom', 'AC', 'Study Table', 'Wardrobe']),
        monthlyRent: 3500,
      });
    }
  }

  // International Hostel - 15 rooms
  for (let floor = 1; floor <= 3; floor++) {
    for (let roomNum = 1; roomNum <= 5; roomNum++) {
      roomData.push({
        hostelId: createdHostels[2].id,
        roomNumber: `${floor}0${roomNum}`,
        floor,
        capacity: roomNum <= 2 ? 1 : 2, // First 2 rooms per floor: single, rest: double
        type: roomNum <= 2 ? 'single' : 'double',
        facilities: JSON.stringify(['Attached Bathroom', 'AC', 'WiFi', 'Study Table']),
        monthlyRent: roomNum <= 2 ? 4000 : 3000,
      });
    }
  }

  const createdRooms = await db.insert(rooms).values(roomData).returning();
  console.log(`✅ Created ${createdRooms.length} rooms`);

  console.log('📚 Seeding library data...');

  // Seed Books
  const bookData = [
    // Fiction
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      publisher: 'J.B. Lippincott & Co.',
      publicationYear: 1960,
      category: 'Fiction',
      language: 'English',
      edition: '50th Anniversary Edition',
      pages: 324,
      totalQuantity: 5,
      availableQuantity: 5,
      shelfLocation: 'A-101',
      description: 'A classic novel of a lawyer in the Depression-era South defending a black man charged with rape',
      price: 1500,
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0-452-28423-4',
      publisher: 'Secker & Warburg',
      publicationYear: 1949,
      category: 'Fiction',
      language: 'English',
      pages: 328,
      totalQuantity: 4,
      availableQuantity: 4,
      shelfLocation: 'A-102',
      description: 'A dystopian social science fiction novel and cautionary tale',
      price: 1200,
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0-14-143951-8',
      publisher: 'T. Egerton',
      publicationYear: 1813,
      category: 'Fiction',
      language: 'English',
      pages: 432,
      totalQuantity: 3,
      availableQuantity: 3,
      shelfLocation: 'A-103',
      description: 'A romantic novel of manners',
      price: 1000,
    },

    // Science
    {
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '978-0-553-38016-3',
      publisher: 'Bantam Books',
      publicationYear: 1988,
      category: 'Science',
      language: 'English',
      pages: 256,
      totalQuantity: 6,
      availableQuantity: 6,
      shelfLocation: 'B-201',
      description: 'A landmark volume in science writing',
      price: 1800,
    },
    {
      title: 'The Selfish Gene',
      author: 'Richard Dawkins',
      isbn: '978-0-19-286092-7',
      publisher: 'Oxford University Press',
      publicationYear: 1976,
      category: 'Science',
      language: 'English',
      pages: 360,
      totalQuantity: 4,
      availableQuantity: 4,
      shelfLocation: 'B-202',
      description: 'A gene-centered view of evolution',
      price: 1600,
    },

    // Mathematics
    {
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '978-0-262-03384-8',
      publisher: 'MIT Press',
      publicationYear: 2009,
      category: 'Mathematics',
      language: 'English',
      edition: '3rd Edition',
      pages: 1312,
      totalQuantity: 8,
      availableQuantity: 8,
      shelfLocation: 'C-301',
      description: 'Comprehensive textbook on algorithms',
      price: 3500,
    },
    {
      title: 'Calculus: Early Transcendentals',
      author: 'James Stewart',
      isbn: '978-1-285-74155-0',
      publisher: 'Cengage Learning',
      publicationYear: 2015,
      category: 'Mathematics',
      language: 'English',
      edition: '8th Edition',
      pages: 1368,
      totalQuantity: 10,
      availableQuantity: 10,
      shelfLocation: 'C-302',
      description: 'Comprehensive calculus textbook',
      price: 4000,
    },

    // Computer Science
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '978-0-13-235088-4',
      publisher: 'Prentice Hall',
      publicationYear: 2008,
      category: 'Computer Science',
      language: 'English',
      pages: 464,
      totalQuantity: 7,
      availableQuantity: 7,
      shelfLocation: 'D-401',
      description: 'A handbook of agile software craftsmanship',
      price: 2500,
    },
    {
      title: 'Design Patterns',
      author: 'Erich Gamma',
      isbn: '978-0-201-63361-0',
      publisher: 'Addison-Wesley',
      publicationYear: 1994,
      category: 'Computer Science',
      language: 'English',
      pages: 416,
      totalQuantity: 5,
      availableQuantity: 5,
      shelfLocation: 'D-402',
      description: 'Elements of reusable object-oriented software',
      price: 2800,
    },

    // History
    {
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      isbn: '978-0-06-231609-7',
      publisher: 'Harper',
      publicationYear: 2014,
      category: 'History',
      language: 'English',
      pages: 443,
      totalQuantity: 6,
      availableQuantity: 6,
      shelfLocation: 'E-501',
      description: 'A narrative history of humanity',
      price: 2000,
    },

    // Philosophy
    {
      title: 'Meditations',
      author: 'Marcus Aurelius',
      isbn: '978-0-14-044933-4',
      publisher: 'Penguin Classics',
      publicationYear: 180,
      category: 'Philosophy',
      language: 'English',
      pages: 304,
      totalQuantity: 4,
      availableQuantity: 4,
      shelfLocation: 'F-601',
      description: 'Personal writings by the Roman Emperor',
      price: 800,
    },

    // Business
    {
      title: 'The Lean Startup',
      author: 'Eric Ries',
      isbn: '978-0-307-88789-4',
      publisher: 'Crown Business',
      publicationYear: 2011,
      category: 'Business',
      language: 'English',
      pages: 336,
      totalQuantity: 5,
      availableQuantity: 5,
      shelfLocation: 'G-701',
      description: 'How constant innovation creates radically successful businesses',
      price: 1800,
    },
  ];

  const createdBooks = await db.insert(books).values(bookData).returning();
  console.log(`✅ Created ${createdBooks.length} books`);

  console.log('✅ Hostel and Library seeding completed!');
}

// Run if called directly
seedHostelAndLibrary()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });