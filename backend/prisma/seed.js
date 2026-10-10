const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CampusSwap Database Seeding...');

  // Clear existing data safely
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.savedItem.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();
  await prisma.studentRoster.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // Password hashes
  const adminPassword = await bcrypt.hash('Swap@482223', 10);
  const p1 = await bcrypt.hash('9823456789', 10);
  const p2 = await bcrypt.hash('9811122233', 10);
  const p3 = await bcrypt.hash('9777788899', 10);
  const p4 = await bcrypt.hash('9900011223', 10);
  const p5 = await bcrypt.hash('9866655544', 10);

  // 1. Create Pre-Approved Student Roster
  const rosterStudents = [
    { name: 'Atharva Patil', email: '20241042.dit@dypvp.edu.in', collegeId: '20241042', phone: '9823456789', department: 'Computer Engineering', year: '3rd Year' },
    { name: 'Rahul Sharma', email: '20231108.dit@dypvp.edu.in', collegeId: '20231108', phone: '9811122233', department: 'Mechanical Engineering', year: '4th Year' },
    { name: 'Priya Mehta', email: '20241019.dit@dypvp.edu.in', collegeId: '20241019', phone: '9777788899', department: 'Electronics & Telecommunication', year: '3rd Year' },
    { name: 'Sneha Kulkarni', email: '20251077.dit@dypvp.edu.in', collegeId: '20251077', phone: '9900011223', department: 'Artificial Intelligence & Data Science', year: '2nd Year' },
    { name: 'Rohan Deshmukh', email: '20241099.dit@dypvp.edu.in', collegeId: '20241099', phone: '9866655544', department: 'Information Technology', year: '3rd Year' },
    { name: 'Test Student 1062', email: '20241062.dit@dypvp.edu.in', collegeId: '20241062', phone: '9823456780', department: 'Computer Engineering', year: '3rd Year' },
  ];

  for (const s of rosterStudents) {
    await prisma.studentRoster.create({ data: s });
  }
  console.log('📋 Seeded Official Student Roster entries.');

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Campus Administrator',
      email: 'admin482223@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      collegeId: 'ADMIN-482223',
      campus: 'North Campus Admin Complex',
      phone: '9876543210',
      bio: 'Campus safety and marketplace moderator.',
      avatar: null,
      hasChangedPassword: true,
    },
  });

  const atharva = await prisma.user.create({
    data: {
      name: 'Atharva Patil',
      email: '20241042.dit@dypvp.edu.in',
      password: p1,
      role: 'STUDENT',
      collegeId: '20241042',
      campus: 'Engineering Block 3',
      phone: '9823456789',
      bio: '3rd Year CS Student | Building full-stack apps & selling tech gear & textbooks.',
      avatar: null,
      hasChangedPassword: false,
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: '20231108.dit@dypvp.edu.in',
      password: p2,
      role: 'STUDENT',
      collegeId: '20231108',
      campus: 'Hostel Block B',
      phone: '9811122233',
      bio: 'Mechanical Engineering Senior. Cycling enthusiast and gadget geek.',
      avatar: null,
      hasChangedPassword: false,
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Mehta',
      email: '20241019.dit@dypvp.edu.in',
      password: p3,
      role: 'STUDENT',
      collegeId: '20241019',
      campus: 'Girls Hostel A',
      phone: '9777788899',
      bio: 'Electronics & Communication. Love reading novels, sharing exam notes, and eco-friendly swaps.',
      avatar: null,
      hasChangedPassword: false,
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: 'Sneha Kulkarni',
      email: '20251077.dit@dypvp.edu.in',
      password: p4,
      role: 'STUDENT',
      collegeId: '20251077',
      campus: 'Science Complex',
      phone: '9900011223',
      bio: 'Biotech Junior. Always looking to rent lab manuals or swap semester course packs.',
      avatar: null,
      hasChangedPassword: false,
    },
  });

  console.log('✅ Created Seed Users (Admin + 4 Students).');

  // 2. Create Categories
  const categoriesData = [
    { name: 'Books & Textbooks', slug: 'books', icon: 'BookOpen', description: 'Course textbooks, reference books, fiction, and entrance prep guides.' },
    { name: 'Electronics & Gadgets', slug: 'electronics', icon: 'Laptop', description: 'Calculators, headphones, monitors, keyboards, adapters, and chargers.' },
    { name: 'Bicycles & Transport', slug: 'bicycles', icon: 'Bike', description: 'Campus cycles, skateboards, helmets, and locks.' },
    { name: 'Hostel & Room Essentials', slug: 'hostel', icon: 'Home', description: 'Study lamps, mini kettles, mattresses, hangers, and storage racks.' },
    { name: 'Notes & Study Material', slug: 'notes', icon: 'FileText', description: 'Handwritten toppers notes, lab files, and formula sheets.' },
    { name: 'Sports & Fitness', slug: 'sports', icon: 'Dumbbell', description: 'Badminton rackets, cricket kits, yoga mats, and gym accessories.' },
    { name: 'Clothing & Campus Merch', slug: 'clothing', icon: 'Shirt', description: 'College lab coats, formal blazers, hoodies, and club tees.' },
    { name: 'Furniture & Decor', slug: 'furniture', icon: 'Armchair', description: 'Study tables, bean bags, chairs, and whiteboard easel.' },
    { name: 'Other Items', slug: 'other', icon: 'Tag', description: 'Musical instruments, art supplies, and general campus utilities.' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created;
  }
  console.log('✅ Created 9 Categories.');

  // 3. Create Marketplace Listings
  const listingsData = [
    {
      sellerId: atharva.id,
      categoryId: categories['electronics'].id,
      title: 'Casio fx-991EX ClassWiz Scientific Calculator',
      description: 'Used for only 2 semesters. In pristine condition with all 552 functions working perfectly. Comes with hard slide-on case and fresh battery.',
      price: 650,
      originalPrice: 1450,
      condition: 'LIKE_NEW',
      type: 'SELL',
      status: 'AVAILABLE',
      imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=600',
      pickupLocation: 'Computer Science Dept / Library Ground Floor',
      views: 142,
      isFeatured: true,
    },
    {
      sellerId: rahul.id,
      categoryId: categories['bicycles'].id,
      title: 'Hercules Roadeo 21-Speed Gear Bicycle',
      description: 'Perfect bike for commuting across campus. Front suspension, dual disc brakes, and comfortable seat. Serviced last month.',
      price: 3200,
      originalPrice: 9500,
      condition: 'GOOD',
      type: 'SELL',
      status: 'AVAILABLE',
      imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600',
      pickupLocation: 'Hostel Block B Cycle Stand',
      views: 310,
      isFeatured: true,
    },
    {
      sellerId: priya.id,
      categoryId: categories['books'].id,
      title: 'CLRS Introduction to Algorithms 4th Edition',
      description: 'The definitive algorithms book! Hardcover in mint condition without markings or highlights. Ready for immediate swap or purchase.',
      price: 450,
      originalPrice: 1200,
      condition: 'BRAND_NEW',
      type: 'SWAP',
      status: 'AVAILABLE',
      swapPreferences: 'Looking to swap for Operating Systems by Silberschatz or Computer Networks by Tanenbaum',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      pickupLocation: 'Main Library 2nd Floor Reference Section',
      views: 228,
      isFeatured: true,
    },
    {
      sellerId: atharva.id,
      categoryId: categories['electronics'].id,
      title: 'Dell 24-inch 1080p IPS Monitor (HDMI/VGA)',
      description: 'Great secondary monitor for coding and multitasking in hostel. Available for rent per semester or month.',
      price: 300,
      originalPrice: 11000,
      condition: 'LIKE_NEW',
      type: 'RENT',
      rentDuration: 'per month',
      status: 'AVAILABLE',
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=600',
      pickupLocation: 'Engineering Block 3 / Main Gate',
      views: 189,
      isFeatured: true,
    },
    {
      sellerId: sneha.id,
      categoryId: categories['notes'].id,
      title: 'Complete Data Structures & Algorithms Handwritten Notes',
      description: 'Color-coded, comprehensive notes containing Trees, Graphs, DP, Sorting algorithms with dry-run diagrams and practice interview questions.',
      price: 150,
      originalPrice: 400,
      condition: 'LIKE_NEW',
      type: 'SELL',
      status: 'AVAILABLE',
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600',
      pickupLocation: 'Science Complex Reading Hall',
      views: 95,
      isFeatured: false,
    },
    {
      sellerId: rahul.id,
      categoryId: categories['hostel'].id,
      title: 'Havells 1.2L Cordless Electric Kettle',
      description: 'Hostel savior for late night study sessions, tea, coffee, and instant noodles. Auto cut-off feature works great.',
      price: 350,
      originalPrice: 1100,
      condition: 'GOOD',
      type: 'SELL',
      status: 'AVAILABLE',
      imageUrl: 'https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&q=80&w=600',
      pickupLocation: 'Hostel B Gate',
      views: 74,
      isFeatured: false,
    },
    {
      sellerId: priya.id,
      categoryId: categories['sports'].id,
      title: 'Yonex Muscle Power 29 Light Badminton Racket + Cover',
      description: 'Lightweight graphite racket strung with BG65 at 24lbs. Perfect for campus gym badminton courts. Willing to swap for a basketball.',
      price: 600,
      originalPrice: 1900,
      condition: 'GOOD',
      type: 'SWAP',
      swapPreferences: 'Looking to swap for Spalding Basketball or Table Tennis Bat set',
      status: 'AVAILABLE',
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
      pickupLocation: 'Campus Sports Complex',
      views: 112,
      isFeatured: false,
    },
    {
      sellerId: sneha.id,
      categoryId: categories['clothing'].id,
      title: 'Official College Chemistry / Biotech White Lab Coat (Size M)',
      description: '100% cotton lab coat required for 1st & 2nd year chemistry and bio labs. Washed, ironed, and in good condition.',
      price: 120,
      originalPrice: 450,
      condition: 'GOOD',
      type: 'SELL',
      status: 'AVAILABLE',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
      pickupLocation: 'Biotech Dept / Canteen',
      views: 65,
      isFeatured: false,
    },
    {
      sellerId: atharva.id,
      categoryId: categories['furniture'].id,
      title: 'Foldable Bed Table / Laptop Desk with Cup Holder',
      description: 'Solid wood finish bed desk with slot for tablet and cup holder. Very comfortable for studying on bed or floor.',
      price: 250,
      originalPrice: 800,
      condition: 'LIKE_NEW',
      type: 'SELL',
      status: 'AVAILABLE',
      imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600',
      pickupLocation: 'Hostel 3 Common Room',
      views: 130,
      isFeatured: false,
    }
  ];

  const createdListings = [];
  for (const item of listingsData) {
    const listing = await prisma.listing.create({ data: item });
    createdListings.push(listing);
  }
  console.log(`✅ Created ${createdListings.length} Campus Listings.`);

  // 4. Create Sample Transactions
  const tx1 = await prisma.transaction.create({
    data: {
      listingId: createdListings[0].id, // Calculator
      buyerId: rahul.id,
      sellerId: atharva.id,
      type: 'BUY',
      amount: 650,
      meetLocation: 'Library Ground Floor',
      status: 'COMPLETED',
      note: 'Need it for tomorrow mid-semester exam!',
    },
  });

  // Review for tx1
  await prisma.review.create({
    data: {
      reviewerId: rahul.id,
      revieweeId: atharva.id,
      transactionId: tx1.id,
      rating: 5,
      comment: 'Atharva was super prompt! Met right on time outside library. Calculator was spotless and working great.',
    },
  });

  const tx2 = await prisma.transaction.create({
    data: {
      listingId: createdListings[2].id, // CLRS Swap
      buyerId: atharva.id,
      sellerId: priya.id,
      type: 'SWAP',
      amount: 0,
      swapItemDetails: 'Offering Operating Systems 10th Ed in exchange.',
      meetLocation: 'Main Library 2nd Floor',
      status: 'PENDING',
      note: 'Hey Priya, I have the Silberschatz OS book you asked for!',
    },
  });

  // 5. Create Sample Notifications
  await prisma.notification.create({
    data: {
      userId: atharva.id,
      title: '5 Star Review Received! ⭐',
      message: 'Rahul Sharma left you a 5-star review for the Casio Calculator deal.',
      type: 'REVIEW',
      link: '/transactions',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: priya.id,
      title: 'New Swap Proposal! 🔄',
      message: 'Atharva Patil proposed a book swap for your CLRS Algorithms textbook.',
      type: 'TRANSACTION',
      link: '/transactions',
      isRead: false,
    },
  });

  // 6. Create Sample Chat Messages
  await prisma.message.create({
    data: {
      senderId: atharva.id,
      receiverId: priya.id,
      listingId: createdListings[2].id,
      content: 'Hi Priya! Is your CLRS book still available for the Operating Systems swap?',
      isRead: true,
    },
  });

  await prisma.message.create({
    data: {
      senderId: priya.id,
      receiverId: atharva.id,
      listingId: createdListings[2].id,
      content: 'Yes Atharva! What edition is your OS book? We can meet by the library steps tomorrow around 2 PM.',
      isRead: false,
    },
  });

  // 7. Create Sample Report
  await prisma.report.create({
    data: {
      reporterId: rahul.id,
      listingId: createdListings[5].id,
      reason: 'DUPLICATE_CHECK',
      description: 'Verifying kettle wattage for hostel safety guidelines.',
      status: 'PENDING',
    },
  });

  console.log('🎉 CampusSwap Database Seed Complete!');
  console.log('----------------------------------------------------');
  console.log('🔑 Test Credentials:');
  console.log('   Admin:   admin@college.edu   / admin123');
  console.log('   Student: atharva@college.edu / password123');
  console.log('   Student: rahul@college.edu   / password123');
  console.log('   Student: priya@college.edu   / password123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
