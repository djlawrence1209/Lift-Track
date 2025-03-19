import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { processSheetData } from '@/app/lib/google-sheets';

const sheets = google.sheets('v4');
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

export async function POST(request: Request) {
  try {
    const { spreadsheetId, range } = await request.json();

    if (!spreadsheetId || !range) {
      return NextResponse.json(
        { error: 'Spreadsheet ID and range are required' },
        { status: 400 }
      );
    }

    // Validate range format (should contain a colon for A1:B2 format)
    if (!range.includes(':')) {
      return NextResponse.json(
        { error: 'Range must include a colon (e.g., Sheet1!A1:F10)' },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Google Sheets API key is not configured' },
        { status: 500 }
      );
    }

    console.log(`Fetching spreadsheet data - ID: ${spreadsheetId}, Range: ${range}`);

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        key: API_KEY,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return NextResponse.json(
          { error: 'No data found in spreadsheet' },
          { status: 404 }
        );
      }

      console.log(`Found ${rows.length} rows of data`);

      // Get the header row to understand column structure
      const headerRow = rows[0] || [];
      console.log(`Header row has ${headerRow.length} columns`);

      // Process the data rows
      const rawData = rows.slice(1).map((row) => {
        // Add safety check for row length
        if (row.length < 6) {
          console.warn(`Row has fewer than 6 columns: ${JSON.stringify(row)}`);
          // Add empty values for missing columns
          while (row.length < 6) {
            row.push('');
          }
        }
        
        // Keep track of the full row data rather than just mapping to the first 6 columns
        return {
          exercise: String(row[0] || ''),
          sets: parseInt(row[1]) || 0,
          reps: parseInt(row[2]) || 0,
          weight: parseFloat(row[3]) || 0,
          prescribedRPE: parseFloat(row[4]) || 0,
          actualRPE: parseFloat(row[5]) || 0,
          // Store the full row to preserve all column data
          fullRow: row,
          // Store the row length to help with week detection
          rowLength: row.length
        };
      });

      const processedData = processSheetData(rawData);
      console.log(`Processed data: ${processedData.maxLiftsData.length} lift entries, ${processedData.volumeData.length} volume entries`);

      return NextResponse.json(processedData);
    } catch (error: any) {
      console.error('Google Sheets API error:', error);
      
      // More detailed error messages
      if (error.code === 404) {
        return NextResponse.json(
          { error: 'Spreadsheet not found. Please check the URL and make sure the spreadsheet is accessible.' },
          { status: 404 }
        );
      }
      
      if (error.code === 403) {
        return NextResponse.json(
          { error: 'Access denied. Please make sure the spreadsheet is public or you have the right permissions.' },
          { status: 403 }
        );
      }
      
      if (error.code === 400) {
        // Check for range-related errors in the error message
        if (error.message && (
          error.message.includes('range') || 
          error.message.includes('parse') || 
          error.message.includes('format')
        )) {
          return NextResponse.json(
            { error: `Invalid range format. Please use a valid range like "Sheet1!A1:F10". Error: ${error.message}` },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: `Bad request: ${error.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch spreadsheet data. Please check the URL and try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 