#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createAppointmentsTable() {
  console.log('Creating appointments table...');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'create-appointments-table.sql'),
      'utf8'
    );

    // Split SQL commands and execute them
    const commands = sqlContent
      .split(';')
      .filter(cmd => cmd.trim().length > 0)
      .map(cmd => cmd.trim() + ';');

    for (const command of commands) {
      if (command.trim() === ';') continue;

      console.log(`Executing: ${command.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(command);
    }

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