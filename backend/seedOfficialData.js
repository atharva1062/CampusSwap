const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing Official DIT Pimpri Campus Data...');

  // Ensure Admin user exists
  const adminPassword = await bcrypt.hash('Swap@482223', 10);
  let admin = await prisma.user.findFirst({
    where: { email: 'admin1062@gmail.com' }
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Campus Administrator',
        email: 'admin1062@gmail.com',
        password: adminPassword,
        role: 'ADMIN',
        collegeId: 'ADMIN-1062',
        campus: 'Central Admin Complex',
        phone: '9876543210',
        bio: 'DIT Pimpri Campus Safety & Moderator',
        avatar: null,
        isVerified: true,
        hasChangedPassword: true,
      }
    });
    console.log('✅ Created Admin Account (admin1062@gmail.com)');
  } else {
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: adminPassword, role: 'ADMIN' }
    });
    console.log('✅ Admin Account Verified');
  }

  // Categories Setup
  const categoriesData = [
    { name: 'Books & Textbooks', slug: 'books', icon: 'BookOpen', description: 'Course textbooks, reference books, and entrance prep guides.' },
    { name: 'Electronics & Gadgets', slug: 'electronics', icon: 'Laptop', description: 'Calculators, headphones, monitors, keyboards, adapters.' },
    { name: 'Bicycles & Transport', slug: 'bicycles', icon: 'Bike', description: 'Campus cycles, skateboards, helmets, and locks.' },
    { name: 'Hostel & Room Essentials', slug: 'hostel', icon: 'Home', description: 'Study lamps, mini kettles, mattresses, hangers, storage racks.' },
    { name: 'Notes & Study Material', slug: 'notes', icon: 'FileText', description: 'Handwritten notes, lab files, and formula sheets.' },
    { name: 'Sports & Fitness', slug: 'sports', icon: 'Dumbbell', description: 'Badminton rackets, cricket kits, yoga mats, gym accessories.' },
    { name: 'Clothing & Campus Merch', slug: 'clothing', icon: 'Shirt', description: 'College lab coats, formal blazers, hoodies, club tees.' },
    { name: 'Furniture & Decor', slug: 'furniture', icon: 'Armchair', description: 'Study tables, chairs, whiteboard easel.' },
    { name: 'Other Items', slug: 'other', icon: 'Tag', description: 'Musical instruments, art supplies, and general campus utilities.' },
  ];

  for (const cat of categoriesData) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }
  console.log('✅ Categories verified.');

  // Official Student Roster covering all 12 DIT Departments with 8-digit ERP IDs and {erpid}.dit@dypvp.edu.in format
  const officialRoster = [
    { name: 'Atharva Patil', email: '20241042.dit@dypvp.edu.in', collegeId: '20241042', phone: '9823456789', department: 'Computer Engineering', year: '3rd Year' },
    { name: 'Rahul Sharma', email: '20231108.dit@dypvp.edu.in', collegeId: '20231108', phone: '9811122233', department: 'Mechanical Engineering', year: '4th Year' },
    { name: 'Priya Mehta', email: '20241019.dit@dypvp.edu.in', collegeId: '20241019', phone: '9777788899', department: 'Electronics & Telecommunication', year: '3rd Year' },
    { name: 'Sneha Kulkarni', email: '20251077.dit@dypvp.edu.in', collegeId: '20251077', phone: '9900011223', department: 'Artificial Intelligence & Data Science', year: '2nd Year' },
    { name: 'Rohan Deshmukh', email: '20241099.dit@dypvp.edu.in', collegeId: '20241099', phone: '9866655544', department: 'Information Technology', year: '3rd Year' },
    { name: 'Tanmay Joshi', email: '20241015.dit@dypvp.edu.in', collegeId: '20241015', phone: '9833344455', department: 'Automation and Robotics', year: '2nd Year' },
    { name: 'Ananya Deshpande', email: '20231044.dit@dypvp.edu.in', collegeId: '20231044', phone: '9844455566', department: 'Civil Engineering', year: '3rd Year' },
    { name: 'Vikram Shinde', email: '20241022.dit@dypvp.edu.in', collegeId: '20241022', phone: '9855566677', department: 'Electrical Engineering', year: '2nd Year' },
    { name: 'Sakshi Jadhav', email: '20251031.dit@dypvp.edu.in', collegeId: '20251031', phone: '9877788811', department: 'Electronics and Computer Engineering', year: '1st Year' },
    { name: 'Aditya Pawar', email: '20261001.dit@dypvp.edu.in', collegeId: '20261001', phone: '9812345670', department: 'First Year Engineering', year: '1st Year' },
    { name: 'Pooja More', email: '20241012.dit@dypvp.edu.in', collegeId: '20241012', phone: '9822233344', department: 'Instrumentation Engineering', year: '3rd Year' },
    { name: 'Harsh Vardhan', email: '20231005.dit@dypvp.edu.in', collegeId: '20231005', phone: '9899988877', department: 'STR', year: '4th Year' },
    { name: 'Test Student 1062', email: '20241062.dit@dypvp.edu.in', collegeId: '20241062', phone: '9823456780', department: 'Computer Engineering', year: '3rd Year' },
  ];

  for (const s of officialRoster) {
    const existing = await prisma.studentRoster.findFirst({
      where: { OR: [{ collegeId: s.collegeId }, { email: s.email }] }
    });

    if (existing) {
      await prisma.studentRoster.update({
        where: { id: existing.id },
        data: s
      });
    } else {
      await prisma.studentRoster.create({ data: s });
    }
  }

  console.log(`📋 Verified ${officialRoster.length} student roster records across all 12 DIT departments.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(() => prisma.$disconnect());
