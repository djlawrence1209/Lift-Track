import { google } from 'googleapis';

// Initialize the Google Sheets API
const sheets = google.sheets('v4');

// Your API key
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

export interface SheetData {
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  prescribedRPE: number;
  actualRPE: number;
  // Add optional fields for extended data
  fullRow?: any[];
  rowLength?: number;
}

export async function fetchSheetData(spreadsheetId: string, range: string): Promise<SheetData[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      key: API_KEY,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in spreadsheet');
    }

    // Skip header row and map data
    return rows.slice(1).map((row) => ({
      exercise: row[0],
      sets: parseInt(row[1]),
      reps: parseInt(row[2]),
      weight: parseFloat(row[3]),
      prescribedRPE: parseFloat(row[4]),
      actualRPE: parseFloat(row[5]),
      fullRow: row,
      rowLength: row.length
    }));
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

export function processSheetData(data: SheetData[]) {
  // Check if we have the extended rowLength data
  const hasExtendedData = data.length > 0 && data[0].fullRow !== undefined;
  
  // Get the maximum number of columns in the dataset
  const maxColumns = hasExtendedData ? 
    Math.max(...data.map(entry => entry.rowLength || 6), 6) : 6;
  
  console.log(`Maximum columns in dataset: ${maxColumns}`);
  
  // Calculate how many weeks we have (assuming each week is a 6-column block)
  const possibleWeeks = Math.ceil(maxColumns / 6);
  console.log(`Detected ${possibleWeeks} possible weeks in data`);

  // Group data by exercise first
  const exerciseGroups = data.reduce((acc, entry) => {
    if (!acc[entry.exercise]) {
      acc[entry.exercise] = [];
    }
    acc[entry.exercise].push(entry);
    return acc;
  }, {} as Record<string, SheetData[]>);

  // Filter for competition lifts and create entries for each
  const competitionEntries: Record<string, SheetData[]> = {};
  const isCompetitionLift = (exercise: string) => {
    if (!exercise) return false;
    const lowerExercise = exercise.toLowerCase();
    return lowerExercise.includes('competition') && 
           (lowerExercise.includes('squat') || 
            lowerExercise.includes('bench') || 
            lowerExercise.includes('deadlift'));
  };

  Object.entries(exerciseGroups).forEach(([exercise, entries]) => {
    if (isCompetitionLift(exercise)) {
      // Extract lift type (squat, bench, deadlift)
      let liftType = '';
      if (exercise.toLowerCase().includes('squat')) {
        liftType = 'squat';
      } else if (exercise.toLowerCase().includes('bench')) {
        liftType = 'bench';
      } else if (exercise.toLowerCase().includes('deadlift')) {
        liftType = 'deadlift';
      }
      
      if (liftType) {
        competitionEntries[liftType] = entries;
      }
    }
  });

  // Create max lifts data points based on competition lifts
  const maxLiftsData: Array<Record<string, any>> = [];
  
  // Determine the max number of entries across all lift types
  const maxEntries = Math.max(
    ...Object.values(competitionEntries).map(entries => entries.length),
    0 // Fallback if there are no entries
  );
  
  for (let i = 0; i < maxEntries; i++) {
    const dataPoint: Record<string, any> = {
      date: `Week ${i + 1}`
    };
    
    // Add each lift type's weight for this entry index if it exists
    Object.entries(competitionEntries).forEach(([liftType, entries]) => {
      if (entries[i]) {
        dataPoint[liftType] = entries[i].weight;
      }
    });
    
    // Only add the data point if it has at least one lift weight
    if (Object.keys(dataPoint).length > 1) {
      maxLiftsData.push(dataPoint);
    }
  }

  // Process volume data across multiple weeks
  // Initialize volume by week
  const volumeByWeek: Record<string, { volume: number; tonnage: number }> = {};
  
  // Initialize all potential weeks with zero values
  for (let i = 1; i <= possibleWeeks; i++) {
    volumeByWeek[`Week ${i}`] = { volume: 0, tonnage: 0 };
  }
  
  // If we have extended data with full rows, process volume differently
  if (hasExtendedData) {
    console.log(`Processing with extended data format`);
    
    // Keep track of which rows contain competition lifts for each week
    const weeklyCompetitionRows: SheetData[][] = Array(possibleWeeks).fill(null).map(() => []);
    
    // Go through each row and distribute to the appropriate week
    data.forEach(entry => {
      if (!entry.exercise || !entry.fullRow) return;
      
      // Look for competition lifts in all 6-column segments
      for (let weekIdx = 0; weekIdx < possibleWeeks; weekIdx++) {
        const colOffset = weekIdx * 6;
        
        // Check if this block has data
        if (entry.fullRow.length > colOffset) {
          const exerciseCol = entry.fullRow[colOffset];
          const setsCol = parseInt(entry.fullRow[colOffset + 1]) || 0;
          const repsCol = parseInt(entry.fullRow[colOffset + 2]) || 0;
          const weightCol = parseFloat(entry.fullRow[colOffset + 3]) || 0;
          
          // If this is a competition lift in this week's columns
          if (exerciseCol && isCompetitionLift(exerciseCol) && setsCol && repsCol && weightCol) {
            // Calculate volume for this exercise in this week
            const volume = setsCol * repsCol;
            const tonnage = setsCol * repsCol * weightCol;
            
            // Add to the appropriate week
            const weekKey = `Week ${weekIdx + 1}`;
            volumeByWeek[weekKey].volume += volume;
            volumeByWeek[weekKey].tonnage += tonnage;
            
            console.log(`Adding to ${weekKey} - Exercise: ${exerciseCol}, Sets: ${setsCol}, Reps: ${repsCol}, Weight: ${weightCol}, Tonnage: ${tonnage}`);
          }
        }
      }
    });
  } else {
    // Fallback to original logic if no extended data
    console.log(`Processing with standard data format`);
    
    // Function to estimate week based on entry index
    const getWeekFromIndex = (index: number) => `Week ${Math.floor(index / 6) + 1}`;
    
    // Process competition lifts only for volume calculation
    let index = 0;
    Object.values(competitionEntries).forEach(entries => {
      entries.forEach(entry => {
        const weekKey = getWeekFromIndex(index);
        
        // Volume calculations
        const volume = entry.sets * entry.reps;
        const tonnage = entry.sets * entry.reps * entry.weight;
        
        // Add to weekly totals
        volumeByWeek[weekKey].volume += volume;
        volumeByWeek[weekKey].tonnage += tonnage;
        
        console.log(`Adding to ${weekKey} - Exercise: ${entry.exercise}, Tonnage: ${tonnage}`);
        
        index++;
      });
    });
  }
  
  // Remove weeks with zero volume/tonnage
  Object.keys(volumeByWeek).forEach(week => {
    if (volumeByWeek[week].volume === 0 && volumeByWeek[week].tonnage === 0) {
      delete volumeByWeek[week];
    }
  });
  
  // Convert to array format for the chart
  const volumeData = Object.entries(volumeByWeek)
    .map(([week, data]) => ({
      week,
      volume: data.volume,
      tonnage: data.tonnage,
    }))
    // Sort by week number
    .sort((a, b) => {
      const weekNumA = parseInt(a.week.split(' ')[1]);
      const weekNumB = parseInt(b.week.split(' ')[1]);
      return weekNumA - weekNumB;
    });
  
  console.log(`Generated ${volumeData.length} volume data points:`, volumeData);

  return {
    maxLiftsData,
    volumeData,
    rawData: data,
  };
} 