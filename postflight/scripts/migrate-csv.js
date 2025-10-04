import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const prisma = new PrismaClient();

async function migrateFlightData() {
  try {
    console.log('Starting flight data migration...');
    
    // Create a default user if not exists
    const user = await prisma.user.upsert({
      where: {
        email: 'default@example.com',
      },
      update: {},
      create: {
        email: 'default@example.com',
        name: 'Default User',
      },
    });

    console.log('Default user created/found:', user.id);

    // Read and parse the CSV file
    const csvPath = 'E:\\jarvis\\Downloads\\Flight_export.csv';
    const parser = fs.createReadStream(csvPath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
      })
    );

    let count = 0;
    let errors = 0;

    for await (const record of parser) {
      try {
        // Skip if date is empty
        if (!record.date) {
          console.log('Skipping record with empty date');
          continue;
        }

        // Parse the hour_breakdown JSON string
        const hourBreakdown = JSON.parse(record.hour_breakdown || '[]');
        const totalDuration = hourBreakdown.reduce((sum, entry) => sum + (parseFloat(entry.duration) || 0), 0);
        
        // Parse destinations
        const destinations = JSON.parse(record.destinations || '[]');
        const lastDestination = destinations.length > 0 ? destinations[destinations.length - 1] : record.origin;

        // Convert CSV data to match your schema
        const flight = await prisma.flight.create({
          data: {
            date: new Date(record.date),
            aircraft: record.aircraft_type || 'Unknown',
            registration: record.tail_number || '',
            departure: record.origin || '',
            arrival: lastDestination || '',
            duration: totalDuration,
            landings: 1, // Default to 1 landing per flight
            type: record.mission_type || 'Day',
            remarks: record.remarks || '',
            userId: user.id, // Link to the default user
          },
        });
        
        count++;
        if (count % 10 === 0) {
          console.log(`Processed ${count} flights...`);
        }
      } catch (error) {
        console.error('Error processing record:', record);
        console.error('Error:', error);
        errors++;
        continue;
      }
    }

    console.log(`Migration completed successfully! Imported ${count} flights with ${errors} errors.`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateFlightData().catch(console.error);