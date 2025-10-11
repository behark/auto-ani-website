#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAppointmentsTable() {
  console.log('Creating appointments table...');

  try {
    // Create the table with basic structure
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "vehicleId" TEXT,
        "customerName" TEXT NOT NULL,
        "customerEmail" TEXT NOT NULL,
        "customerPhone" TEXT NOT NULL,
        type TEXT NOT NULL,
        "scheduledDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "scheduledTime" TEXT NOT NULL,
        duration INTEGER DEFAULT 60,
        status TEXT DEFAULT 'SCHEDULED',
        notes TEXT,
        "reminderMethod" TEXT,
        "reminderSent" BOOLEAN DEFAULT false,
        "confirmationSent" BOOLEAN DEFAULT false,
        location TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('✓ Basic table created');

    // Add indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "appointments_vehicleId_status_idx" ON appointments("vehicleId", status)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "appointments_scheduledDate_status_idx" ON appointments("scheduledDate", status)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "appointments_customerEmail_idx" ON appointments("customerEmail")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "appointments_scheduledDate_scheduledTime_idx" ON appointments("scheduledDate", "scheduledTime")
    `;

    console.log('✓ Indexes created');

    // Verify the table was created
    const result = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'appointments'
    `;

    if (result.length > 0) {
      console.log('✓ Appointments table created successfully!');

      // Check if we have any appointments
      const count = await prisma.appointment.count();
      console.log(`✓ Appointments table has ${count} records`);

      // Test the appointments API
      console.log('Testing appointments API...');
      const testAppointments = await prisma.appointment.findMany({
        take: 5
      });
      console.log(`✓ Successfully queried ${testAppointments.length} appointments`);

    } else {
      console.log('✗ Failed to create appointments table');
    }

  } catch (error) {
    console.error('Error creating appointments table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAppointmentsTable();