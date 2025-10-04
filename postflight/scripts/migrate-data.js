import { PrismaClient } from '@prisma/client';
import { base44 } from '../src/api/base44Client';

const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('Starting migration...');

    // Get all flights from base44
    const base44Flights = await base44.getFlights();
    console.log(`Found ${base44Flights.length} flights to migrate`);

    // Create a map to track user creation
    const userMap = new Map();

    // Migrate each flight
    for (const flight of base44Flights) {
      // Check if we need to create the user
      if (!userMap.has(flight.userId)) {
        const user = await prisma.user.create({
          data: {
            id: flight.userId, // Keep the same ID for reference
            email: `user_${flight.userId}@example.com`, // You'll need to update this with real emails
            name: `User ${flight.userId}` // You'll need to update this with real names
          }
        });
        userMap.set(flight.userId, user);
      }

      // Create the flight
      await prisma.flight.create({
        data: {
          date: new Date(flight.date),
          aircraft: flight.aircraft,
          registration: flight.registration || '',
          departure: flight.departure,
          arrival: flight.arrival,
          duration: flight.duration,
          landings: flight.landings || 1,
          type: flight.type || 'Day',
          remarks: flight.remarks,
          userId: flight.userId
        }
      });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateData();