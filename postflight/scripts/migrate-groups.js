import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const prisma = new PrismaClient();

async function migrateFlightGroups() {
  try {
    console.log('Starting flight group migration...');

    // Read and parse the CSV file
    const csvPath = 'E:\\jarvis\\Downloads\\FlightGroup_export.csv';
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
        // Parse JSON strings
        const members = JSON.parse(record.members || '[]');
        const pendingMembers = JSON.parse(record.pending_members || '[]');

        // Convert CSV data to match your schema
        const flightGroup = await prisma.flightGroup.create({
          data: {
            name: record.name || '',
            description: record.description || '',
            idCode: record.id_code || '',
            adminEmail: record.admin_email || '',
            createdByName: record.created_by_name || '',
            members: members,
            pendingMembers: pendingMembers,
            createdById: record.created_by_id || '',
            createdAt: new Date(record.created_date),
            updatedAt: new Date(record.updated_date),
          },
        });
        
        count++;
        console.log(`Processed flight group: ${flightGroup.name}`);
      } catch (error) {
        console.error('Error processing record:', record);
        console.error('Error:', error);
        errors++;
        continue;
      }
    }

    console.log(`Migration completed successfully! Imported ${count} flight groups with ${errors} errors.`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateFlightGroups().catch(console.error);