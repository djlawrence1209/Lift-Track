'use client'

import Link from "next/link"
import { TrendingUp, AlertTriangle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Charts } from "./components/Charts"
import { GoogleSheetsImport } from "./components/GoogleSheetsImport"
import { SheetData } from "./lib/google-sheets"

export default function Home() {
  // Sample data for charts - Only bench data for bench progress chart
  const benchData = [
    { date: "Jan", weight: 185, goal: 200, rpe: 8 },
    { date: "Feb", weight: 195, goal: 205, rpe: 8.5 },
    { date: "Mar", weight: 200, goal: 210, rpe: 9 },
    { date: "Apr", weight: 205, goal: 215, rpe: 8 },
    { date: "May", weight: 215, goal: 220, rpe: 8.5 },
    { date: "Jun", weight: 225, goal: 225, rpe: 9.5 },
  ]

  const maxLiftsData = [
    { date: "Jan", bench: 185, squat: 275, deadlift: 315 },
    { date: "Feb", bench: 195, squat: 285, deadlift: 335 },
    { date: "Mar", bench: 200, squat: 295, deadlift: 355 },
    { date: "Apr", bench: 205, squat: 305, deadlift: 365 },
    { date: "May", bench: 215, squat: 315, deadlift: 385 },
    { date: "Jun", bench: 225, squat: 325, deadlift: 405 },
  ]

  const liftData = [
    { name: "Bench", value: 225 },
    { name: "Squat", value: 315 },
    { name: "Deadlift", value: 405 },
  ]

  const volumeData = [
    { week: "Week 1", volume: 10000, tonnage: 12500 },
    { week: "Week 2", volume: 12000, tonnage: 15000 },
    { week: "Week 3", volume: 9000, tonnage: 11250 },
    { week: "Week 4", volume: 15000, tonnage: 18750 },
  ]

  const fatigueData = [
    { day: "Mon", rpe: 7, recovery: 8 },
    { day: "Tue", rpe: 8, recovery: 7 },
    { day: "Wed", rpe: 9, recovery: 6 },
    { day: "Thu", rpe: 9.5, recovery: 4 },
    { day: "Fri", rpe: 9, recovery: 5 },
    { day: "Sat", rpe: 8, recovery: 6 },
    { day: "Sun", rpe: 7, recovery: 7 }
  ]

  const optimalRepData = [
    { lift: "Bench Press", optimalReps: 5, note: "Best strength gains seen in 3-6 rep range" },
    { lift: "Squat", optimalReps: 6, note: "Highest volume tolerance in 5-8 rep range" },
    { lift: "Deadlift", optimalReps: 4, note: "Optimal performance and recovery with lower reps" },
  ]

  const performanceData = [
    // Week 1
    { date: "Mon-W1", performance: 7, week: 1, day: "Monday" },
    { date: "Tue-W1", performance: 5, week: 1, day: "Tuesday" },
    { date: "Wed-W1", performance: 8, week: 1, day: "Wednesday" },
    { date: "Thu-W1", performance: 6, week: 1, day: "Thursday" },
    { date: "Fri-W1", performance: 9, week: 1, day: "Friday" },
    // Week 2
    { date: "Mon-W2", performance: 8, week: 2, day: "Monday" },
    { date: "Tue-W2", performance: 4, week: 2, day: "Tuesday" },
    { date: "Wed-W2", performance: 7, week: 2, day: "Wednesday" },
    { date: "Thu-W2", performance: 7, week: 2, day: "Thursday" },
    { date: "Fri-W2", performance: 8, week: 2, day: "Friday" },
    // Week 3
    { date: "Mon-W3", performance: 6, week: 3, day: "Monday" },
    { date: "Tue-W3", performance: 5, week: 3, day: "Tuesday" },
    { date: "Wed-W3", performance: 8, week: 3, day: "Wednesday" },
    { date: "Thu-W3", performance: 7, week: 3, day: "Thursday" },
    { date: "Fri-W3", performance: 9, week: 3, day: "Friday" },
    // Week 4
    { date: "Mon-W4", performance: 7, week: 4, day: "Monday" },
    { date: "Tue-W4", performance: 4, week: 4, day: "Tuesday" },
    { date: "Wed-W4", performance: 7, week: 4, day: "Wednesday" },
    { date: "Thu-W4", performance: 8, week: 4, day: "Thursday" },
    { date: "Fri-W4", performance: 9, week: 4, day: "Friday" },
  ]

  const dayAverages = {
    Monday: 7.0,
    Tuesday: 4.5,
    Wednesday: 7.5,
    Thursday: 7.0,
    Friday: 8.75,
  }

  const bestDays = [
    { date: "June 15, 2023", score: 9.5 },
    { date: "May 28, 2023", score: 9.2 },
    { date: "June 7, 2023", score: 9.0 },
  ]

  const worstDays = [
    { date: "June 2, 2023", score: 4.5 },
    { date: "May 20, 2023", score: 5.0 },
    { date: "June 10, 2023", score: 5.2 },
  ]

  const [importedData, setImportedData] = useState<{
    maxLiftsData: Array<{ date: string; [key: string]: any }>;
    volumeData: Array<{ week: string; volume: number; tonnage: number }>;
    rawData: SheetData[];
  } | null>(null);

  // Process fatigue data from imported sheet data
  const processFatigueData = (rawData: SheetData[] | undefined) => {
    if (!rawData || rawData.length === 0) {
      return fatigueData.map(item => ({
        day: item.day,
        rpe: item.rpe,
        recovery: item.recovery
      })); // Return sample data without threshold
    }
    
    try {
      // Create an array to hold the processed fatigue data
      const processedData: Array<{ day: string; rpe: number; recovery: number }> = [];
      
      // Track the current day
      let currentDay = 1;
      let lastNonEmptyRowIndex = -1;
      
      // Go through the data row by row
      rawData.forEach((entry, index) => {
        // Check if this is a competition lift
        const isCompetitionLift = entry.exercise && 
          entry.exercise.toLowerCase().includes('competition') &&
          (entry.exercise.toLowerCase().includes('squat') || 
           entry.exercise.toLowerCase().includes('bench') || 
           entry.exercise.toLowerCase().includes('deadlift'));
        
        // If it's a competition lift and has ActualRPE, process it
        if (isCompetitionLift && !isNaN(entry.actualRPE)) {
          // Check if we should increment the day (empty row between current and last non-empty row)
          if (lastNonEmptyRowIndex !== -1 && index > lastNonEmptyRowIndex + 1) {
            currentDay++; // Empty row detected, move to next day
          }
          
          // Update last non-empty row
          lastNonEmptyRowIndex = index;
          
          // Get day abbreviation
          const dayAbbrev = getDayAbbreviation(currentDay);
          
          // Get or create day entry
          let dayEntry = processedData.find(item => item.day === dayAbbrev);
          if (!dayEntry) {
            dayEntry = { 
              day: dayAbbrev, 
              rpe: 0, 
              recovery: 7 // Default recovery score
            };
            processedData.push(dayEntry);
          }
          
          // Update RPE if this one is higher (take the highest RPE of the day)
          if (entry.actualRPE > dayEntry.rpe) {
            dayEntry.rpe = entry.actualRPE;
            
            // Calculate recovery score as inverse relative to 7
            // If RPE is 7, recovery is 7
            // If RPE is 8, recovery is 6
            // If RPE is 9, recovery is 5
            dayEntry.recovery = Math.max(1, 14 - entry.actualRPE);
          }
        }
      });
      
      // If we didn't find any relevant data, return sample data
      if (processedData.length === 0) {
        // Create a modified version of the sample data without threshold property
        return fatigueData.map(item => ({
          day: item.day,
          rpe: item.rpe,
          recovery: item.recovery
        }));
      }
      
      return processedData;
    } catch (error) {
      console.error("Error processing fatigue data:", error);
      // Return sample data without threshold property
      return fatigueData.map(item => ({
        day: item.day,
        rpe: item.rpe,
        recovery: item.recovery
      }));
    }
  };
  
  // Helper function to get day abbreviation
  const getDayAbbreviation = (dayNum: number) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days[(dayNum - 1) % 7]; // Cycle through the week
  };

  // Process performance data from imported sheet data
  const processPerformanceData = (rawData: SheetData[] | undefined) => {
    if (!rawData || rawData.length === 0) {
      // Return sample data if no raw data
      return performanceData;
    }
    
    try {
      // Create an array to hold the processed performance data
      const processedData: Array<{ 
        date: string;
        performance: number;
        week: number;
        day: string;
      }> = [];
      
      // Track the current day and week
      let currentDay = 1; // Start with Monday
      let currentWeek = 1;
      let lastNonEmptyRowIndex = -1;
      
      // Day names for display
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      
      // Go through the data row by row
      rawData.forEach((entry, index) => {
        // Check if this is a competition lift
        const isCompetitionLift = entry.exercise && 
          entry.exercise.toLowerCase().includes('competition') &&
          (entry.exercise.toLowerCase().includes('squat') || 
           entry.exercise.toLowerCase().includes('bench') || 
           entry.exercise.toLowerCase().includes('deadlift'));
        
        // If it's a competition lift and has both prescribed and actual RPE, process it
        if (isCompetitionLift && 
            !isNaN(entry.prescribedRPE) && 
            !isNaN(entry.actualRPE)) {
          
          // Check if we should increment the day (empty row between current and last non-empty row)
          if (lastNonEmptyRowIndex !== -1 && index > lastNonEmptyRowIndex + 1) {
            currentDay++; // Empty row detected, move to next day
            if (currentDay > 7) {
              currentDay = 1; // Reset to Monday
              currentWeek++; // Move to next week
            }
          }
          
          // Update last non-empty row
          lastNonEmptyRowIndex = index;
          
          // Calculate performance score based on RPE difference
          // Baseline of 7/10 for matching RPEs
          let performanceScore = 7;
          
          // Calculate the difference between prescribed and actual RPE
          const rpeDifference = entry.actualRPE - entry.prescribedRPE;
          
          // Adjust score: +1 for every 0.5 below prescribed, -1 for every 0.5 above
          performanceScore -= Math.floor(rpeDifference / 0.5) * 1;
          
          // Cap the score between 1 and 10
          performanceScore = Math.max(1, Math.min(10, performanceScore));
          
          // Create day label for chart
          const dayLabel = `${days[currentDay - 1].slice(0, 3)}-W${currentWeek}`;
          
          // Check if we already have an entry for this day
          const existingEntryIndex = processedData.findIndex(item => 
            item.date === dayLabel && item.week === currentWeek);
          
          if (existingEntryIndex !== -1) {
            // If we have multiple competition lifts on the same day, use the average performance
            processedData[existingEntryIndex].performance = 
              (processedData[existingEntryIndex].performance + performanceScore) / 2;
          } else {
            // Add new performance data entry
            processedData.push({
              date: dayLabel,
              performance: performanceScore,
              week: currentWeek,
              day: days[currentDay - 1]
            });
          }
        }
      });
      
      // If we didn't find any relevant data, return sample data
      if (processedData.length === 0) {
        return performanceData;
      }
      
      return processedData;
    } catch (error) {
      console.error("Error processing performance data:", error);
      return performanceData;
    }
  };

  const handleDataImport = (data: {
    maxLiftsData: Array<{ date: string; [key: string]: any }>;
    volumeData: Array<{ week: string; volume: number; tonnage: number }>;
    rawData: SheetData[];
  }) => {
    setImportedData(data);
  };

  // Use imported data if available, otherwise use sample data
  const chartData = {
    // Create bench progress data from only the competition bench entries
    benchData: importedData?.rawData?.length ? 
      (() => {
        try {
          // Filter to only include "Competition Bench" entries with null/undefined checks
          const benchEntries = importedData.rawData.filter(
            (entry) => entry && entry.exercise && 
                     entry.exercise.toLowerCase().includes('competition') && 
                     entry.exercise.toLowerCase().includes('bench')
          );
          
          // If no bench entries found, return sample data
          if (benchEntries.length === 0) {
            return benchData;
          }
          
          // Map these entries to the format needed for the bench chart
          return benchEntries.map((entry, index) => {
            // Calculate a reasonable goal based on weight (e.g., 5-10% more than current weight)
            const currentWeight = entry.weight || 0;
            const goalWeight = Math.round(currentWeight * 1.07); // 7% more as a goal
            
            return {
              date: `Week ${Math.floor(index / 2) + 1}`,
              weight: currentWeight,
              goal: goalWeight, // Add a goal that's a bit higher than the current weight
              rpe: entry.actualRPE || 0,
            };
          });
        } catch (error) {
          console.error("Error processing bench data:", error);
          return benchData; // Fall back to sample data on error
        }
      })() : benchData,
      
    maxLiftsData: importedData?.maxLiftsData?.length ? importedData.maxLiftsData : maxLiftsData,
    liftData: importedData?.maxLiftsData?.length ? 
      (() => {
        // Get the latest values for each lift type
        const latestData = importedData.maxLiftsData[importedData.maxLiftsData.length - 1];
        
        // Create lift data entries for each lift type present in the data
        const result = [];
        
        if (latestData.squat) {
          result.push({
            name: 'Squat',
            value: latestData.squat
          });
        }
        
        if (latestData.bench) {
          result.push({
            name: 'Bench',
            value: latestData.bench
          });
        }
        
        if (latestData.deadlift) {
          result.push({
            name: 'Deadlift',
            value: latestData.deadlift
          });
        }
        
        return result.length > 0 ? result : liftData;
      })() : liftData,
    volumeData: importedData?.volumeData?.length ? importedData.volumeData : volumeData,
    fatigueData: importedData ? processFatigueData(importedData.rawData) : fatigueData,
    optimalRepData: optimalRepData,
    performanceData: importedData ? processPerformanceData(importedData.rawData) : performanceData,
  };

  // Add this function to calculate day averages from performance data
  const calculateDayAverages = (performanceData: any[]) => {
    if (!performanceData || performanceData.length === 0) {
      return dayAverages; // Return sample data if no performance data
    }
    
    // Group performances by day of week
    const performancesByDay: Record<string, number[]> = {};
    
    performanceData.forEach(entry => {
      if (!performancesByDay[entry.day]) {
        performancesByDay[entry.day] = [];
      }
      performancesByDay[entry.day].push(entry.performance);
    });
    
    // Calculate averages for each day
    const calculatedAverages: Record<string, number> = {};
    
    Object.entries(performancesByDay).forEach(([day, scores]) => {
      if (scores.length > 0) {
        const sum = scores.reduce((total, score) => total + score, 0);
        calculatedAverages[day] = parseFloat((sum / scores.length).toFixed(1));
      }
    });
    
    return Object.keys(calculatedAverages).length > 0 ? calculatedAverages : dayAverages;
  };

  // Find best and worst training days
  const findBestAndWorstDays = (performanceData: any[]) => {
    if (!performanceData || performanceData.length === 0) {
      return {
        best: { day: "Friday", score: 8.75 },
        worst: { day: "Tuesday", score: 4.5 }
      };
    }
    
    // Calculate day averages
    const averages = calculateDayAverages(performanceData);
    
    // Find best and worst days
    let bestDay = { day: "", score: 0 };
    let worstDay = { day: "", score: 10 };
    
    Object.entries(averages).forEach(([day, score]) => {
      if (score > bestDay.score) {
        bestDay = { day, score };
      }
      if (score < worstDay.score) {
        worstDay = { day, score };
      }
    });
    
    return {
      best: bestDay.day ? bestDay : { day: "Friday", score: 8.75 },
      worst: worstDay.day ? worstDay : { day: "Tuesday", score: 4.5 }
    };
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <TrendingUp className="h-6 w-6" />
              <span>LiftTrack</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="#" className="text-sm font-medium hover:underline">
                Dashboard
              </Link>
              <Link href="#" className="text-sm font-medium hover:underline">
                Trends
              </Link>
              <Link href="#" className="text-sm font-medium hover:underline">
                How It Works
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Removed sign in and sign up buttons */}
          </div>
        </div>
      </header>
      <div className="flex-1">
        <main className="flex-1 p-4 md:p-6">
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="overflow-hidden border-2">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Bench Progress</CardTitle>
                      <CardDescription>Your bench press journey</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-bold">
                      +40lbs in 6 months
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Charts 
                    benchData={chartData.benchData}
                    maxLiftsData={chartData.maxLiftsData}
                    liftData={chartData.liftData}
                    volumeData={chartData.volumeData}
                    fatigueData={chartData.fatigueData}
                    optimalRepData={chartData.optimalRepData}
                    performanceData={chartData.performanceData}
                    activeTab="bench"
                  />
                  <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t">
                    <div className="text-sm text-gray-500">
                      Current max: <span className="font-bold text-black">
                        {chartData.benchData.length ? 
                          chartData.benchData[chartData.benchData.length - 1].weight : 
                          225} lbs
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Next goal: <span className="font-bold text-black">
                        {chartData.benchData.length ? 
                          chartData.benchData[chartData.benchData.length - 1].goal : 
                          235} lbs
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Last RPE: <span className="font-bold text-black">
                        {chartData.benchData.length ? 
                          chartData.benchData[chartData.benchData.length - 1].rpe : 
                          9.5}/10
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Import Data</CardTitle>
                  <CardDescription>Import your training data from Google Sheets</CardDescription>
                </CardHeader>
                <CardContent>
                  <GoogleSheetsImport onDataImport={handleDataImport} />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Trends</CardTitle>
                <CardDescription>Your powerlifting progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="maxLifts">
                  <TabsList className="mb-4">
                    <TabsTrigger value="maxLifts">Max Lifts</TabsTrigger>
                    <TabsTrigger value="fatigue">Fatigue</TabsTrigger>
                    <TabsTrigger value="performance">Best/Worst Days</TabsTrigger>
                    <TabsTrigger value="volume">Volume</TabsTrigger>
                    <TabsTrigger value="accessories">Accessory Volume</TabsTrigger>
                    <TabsTrigger value="optimal">Optimal Reps</TabsTrigger>
                  </TabsList>

                  {/* Max Lifts Tab */}
                  <TabsContent value="maxLifts" className="space-y-4">
                    <Charts 
                      benchData={chartData.benchData}
                      maxLiftsData={chartData.maxLiftsData}
                      liftData={chartData.liftData}
                      volumeData={chartData.volumeData}
                      fatigueData={chartData.fatigueData}
                      optimalRepData={chartData.optimalRepData}
                      performanceData={chartData.performanceData}
                      activeTab="maxLifts"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium">Bench</div>
                          <div className="text-2xl font-bold">
                            {(() => {
                              // If we have max lifts data and the latest entry has a bench value
                              if (chartData.maxLiftsData.length && 
                                  chartData.maxLiftsData[chartData.maxLiftsData.length - 1].bench !== undefined) {
                                return chartData.maxLiftsData[chartData.maxLiftsData.length - 1].bench;
                              }
                              // Fallback to default
                              return 225;
                            })()} lbs
                          </div>
                          <div className="text-xs text-green-600">
                            +{(() => {
                              if (chartData.maxLiftsData.length > 1 && 
                                  chartData.maxLiftsData[chartData.maxLiftsData.length - 1].bench !== undefined &&
                                  chartData.maxLiftsData[0].bench !== undefined) {
                                return chartData.maxLiftsData[chartData.maxLiftsData.length - 1].bench - 
                                       chartData.maxLiftsData[0].bench;
                              }
                              return 40;
                            })()} lbs 
                            ({(() => {
                              if (chartData.maxLiftsData.length > 1 && 
                                  chartData.maxLiftsData[chartData.maxLiftsData.length - 1].bench !== undefined &&
                                  chartData.maxLiftsData[0].bench !== undefined && 
                                  chartData.maxLiftsData[0].bench > 0) {
                                return (Math.round((chartData.maxLiftsData[chartData.maxLiftsData.length - 1].bench - 
                                        chartData.maxLiftsData[0].bench) / 
                                        chartData.maxLiftsData[0].bench * 1000) / 10).toFixed(1);
                              }
                              return 21.6;
                            })()}%)
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium">Squat</div>
                          <div className="text-2xl font-bold">
                            {(() => {
                              // If we have max lifts data and the latest entry has a squat value
                              if (chartData.maxLiftsData.length && 
                                  chartData.maxLiftsData[chartData.maxLiftsData.length - 1].squat !== undefined) {
                                return chartData.maxLiftsData[chartData.maxLiftsData.length - 1].squat;
                              }
                              // Fallback to default
                              return 325;
                            })()} lbs
                          </div>
                          <div className="text-xs text-green-600">
                            +{(() => {
                              if (chartData.maxLiftsData.length > 1 && 
                                  chartData.maxLiftsData[chartData.maxLiftsData.length - 1].squat !== undefined &&
                                  chartData.maxLiftsData[0].squat !== undefined) {
                                return chartData.maxLiftsData[chartData.maxLiftsData.length - 1].squat - 
                                       chartData.maxLiftsData[0].squat;
                              }
                              return 50;
                            })()} lbs 
                            ({(() => {
                              if (chartData.maxLiftsData.length > 1 && 
                                  chartData.maxLiftsData[chartData.maxLiftsData.length - 1].squat !== undefined &&
                                  chartData.maxLiftsData[0].squat !== undefined && 
                                  chartData.maxLiftsData[0].squat > 0) {
                                return (Math.round((chartData.maxLiftsData[chartData.maxLiftsData.length - 1].squat - 
                                        chartData.maxLiftsData[0].squat) / 
                                        chartData.maxLiftsData[0].squat * 1000) / 10).toFixed(1);
                              }
                              return 18.2;
                            })()}%)
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium">Deadlift</div>
                          <div className="text-2xl font-bold">
                            {(() => {
                              // If we have max lifts data and the latest entry has a deadlift value
                              if (chartData.maxLiftsData.length && 
                                  chartData.maxLiftsData[chartData.maxLiftsData.length - 1].deadlift !== undefined) {
                                return chartData.maxLiftsData[chartData.maxLiftsData.length - 1].deadlift;
                              }
                              // Fallback to default
                              return 405;
                            })()} lbs
                          </div>
                          <div className="text-xs text-green-600">
                            +{(() => {
                              if (chartData.maxLiftsData.length > 1 && 
                                  chartData.maxLiftsData[chartData.maxLiftsData.length - 1].deadlift !== undefined &&
                                  chartData.maxLiftsData[0].deadlift !== undefined) {
                                return chartData.maxLiftsData[chartData.maxLiftsData.length - 1].deadlift - 
                                       chartData.maxLiftsData[0].deadlift;
                              }
                              return 90;
                            })()} lbs 
                            ({(() => {
                              if (chartData.maxLiftsData.length > 1 && 
                                  chartData.maxLiftsData[chartData.maxLiftsData.length - 1].deadlift !== undefined &&
                                  chartData.maxLiftsData[0].deadlift !== undefined && 
                                  chartData.maxLiftsData[0].deadlift > 0) {
                                return (Math.round((chartData.maxLiftsData[chartData.maxLiftsData.length - 1].deadlift - 
                                        chartData.maxLiftsData[0].deadlift) / 
                                        chartData.maxLiftsData[0].deadlift * 1000) / 10).toFixed(1);
                              }
                              return 28.6;
                            })()}%)
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Volume Tab */}
                  <TabsContent value="volume" className="space-y-4">
                    <Charts 
                      benchData={chartData.benchData}
                      maxLiftsData={chartData.maxLiftsData}
                      liftData={chartData.liftData}
                      volumeData={chartData.volumeData}
                      fatigueData={chartData.fatigueData}
                      optimalRepData={chartData.optimalRepData}
                      performanceData={chartData.performanceData}
                      activeTab="volume"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium">Weekly Average Tonnage</div>
                          <div className="text-2xl font-bold">14,375 lbs</div>
                          <div className="text-xs text-muted-foreground">Based on last 4 weeks</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium">Highest Volume Week</div>
                          <div className="text-2xl font-bold">Week 4: 18,750 lbs</div>
                          <div className="text-xs text-green-600">25% above average</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Fatigue Tab */}
                  <TabsContent value="fatigue" className="space-y-4">
                    <Charts 
                      benchData={chartData.benchData}
                      maxLiftsData={chartData.maxLiftsData}
                      liftData={chartData.liftData}
                      volumeData={chartData.volumeData}
                      fatigueData={chartData.fatigueData}
                      optimalRepData={chartData.optimalRepData}
                      performanceData={chartData.performanceData}
                      activeTab="fatigue"
                    />
                    
                    {/* RPE & Recovery Score Explanation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Understanding RPE & Recovery</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-3">
                            RPE (Rate of Perceived Exertion) measures how hard your workout felt on a scale of 1-10. 
                            Your Recovery Score is calculated relative to an RPE of 7:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="font-medium">RPE Scale:</div>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>RPE 7: Moderately hard</li>
                                <li>RPE 8: Hard but sustainable</li>
                                <li>RPE 9: Very challenging</li>
                                <li>RPE 10: Maximum effort</li>
                              </ul>
                            </div>
                            <div>
                              <div className="font-medium">Recovery Formula:</div>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>RPE 7 → Recovery 7</li>
                                <li>RPE 8 → Recovery 6</li>
                                <li>RPE 9 → Recovery 5</li>
                                <li>RPE 10 → Recovery 4</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Fatigue Alert Card */}
                      {(() => {
                        // Check for consecutive high RPE days
                        const highRpeDays = chartData.fatigueData
                          .filter(day => day.rpe >= 8.5)
                          .map(day => day.day);
                        
                        const hasConsecutiveHighRpe = highRpeDays.length >= 3;
                        
                        return hasConsecutiveHighRpe ? (
                          <Card className="border rounded-lg bg-red-50 border-red-200">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <CardTitle className="text-lg text-red-700">Fatigue Warning</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-red-700">
                                Your RPE has been higher than 8.5 for {highRpeDays.length} days
                                ({highRpeDays.join(", ")}). Consider a deload or
                                recovery day to prevent overtraining and injury.
                              </p>
                              <div className="mt-3 text-sm text-red-600">
                                <strong>Recommendation:</strong> Schedule a light recovery session or rest day followed by
                                a 10-15% reduction in volume for your next training session.
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="border rounded-lg bg-green-50 border-green-200">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                                  ✓
                                </div>
                                <CardTitle className="text-lg text-green-700">Recovery Status</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-green-700">
                                Your fatigue levels are currently manageable. Maintain your current training intensity and continue
                                monitoring your RPE scores to prevent overtraining.
                              </p>
                              <div className="mt-3 text-sm text-green-600">
                                <strong>Recommendation:</strong> Focus on quality nutrition and sleep to maintain your recovery capacity.
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </div>
                  </TabsContent>

                  {/* Accessory Volume Tab */}
                  <TabsContent value="accessories" className="space-y-4">
                    <Charts 
                      benchData={chartData.benchData}
                      maxLiftsData={chartData.maxLiftsData}
                      liftData={chartData.liftData}
                      volumeData={chartData.volumeData}
                      fatigueData={chartData.fatigueData}
                      optimalRepData={chartData.optimalRepData}
                      performanceData={chartData.performanceData}
                      activeTab="accessories"
                      squatAccessoryData={[
                        { week: "Week 1", weight: 8200 },
                        { week: "Week 2", weight: 8800 },
                        { week: "Week 3", weight: 8500 },
                        { week: "Week 4", weight: 9100 },
                      ]}
                      benchAccessoryData={[
                        { week: "Week 1", weight: 5800 },
                        { week: "Week 2", weight: 6300 },
                        { week: "Week 3", weight: 6000 },
                        { week: "Week 4", weight: 6500 },
                      ]}
                      deadliftAccessoryData={[
                        { week: "Week 1", weight: 6300 },
                        { week: "Week 2", weight: 6900 },
                        { week: "Week 3", weight: 6600 },
                        { week: "Week 4", weight: 8100 },
                      ]}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium">Total Squat Accessories</div>
                          <div className="text-2xl font-bold">8,200 lbs</div>
                          <div className="text-xs text-green-600">+900 lbs from last week</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium">Total Bench Accessories</div>
                          <div className="text-2xl font-bold">5,800 lbs</div>
                          <div className="text-xs text-green-600">+500 lbs from last week</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium">Total Deadlift Accessories</div>
                          <div className="text-2xl font-bold">8,100 lbs</div>
                          <div className="text-xs text-green-600">+700 lbs from last week</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Optimal Rep Scheme Tab */}
                  <TabsContent value="optimal" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Optimal Rep Schemes by Lift</h3>
                        <Charts 
                          benchData={chartData.benchData}
                          maxLiftsData={chartData.maxLiftsData}
                          liftData={chartData.liftData}
                          volumeData={chartData.volumeData}
                          fatigueData={chartData.fatigueData}
                          optimalRepData={chartData.optimalRepData}
                          performanceData={chartData.performanceData}
                          activeTab="optimal"
                        />
                      </div>
                      <div className="space-y-4">
                        <Card className="bg-gray-50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Your Optimal Rep Ranges</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {chartData.optimalRepData.map((item, index) => (
                                <div key={index}>
                                  <h4 className="font-medium">{item.lift}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Optimal reps: {item.optimalReps} (Based on your best performances)
                                  </p>
                                  <p className="text-xs text-muted-foreground">{item.note}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Best and Worst Days Tab */}
                  <TabsContent value="performance" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">4-Week Performance Pattern</h3>
                        <Charts 
                          benchData={chartData.benchData}
                          maxLiftsData={chartData.maxLiftsData}
                          liftData={chartData.liftData}
                          volumeData={chartData.volumeData}
                          fatigueData={chartData.fatigueData}
                          optimalRepData={chartData.optimalRepData}
                          performanceData={chartData.performanceData}
                          activeTab="performance"
                        />
                      </div>
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Day of Week Patterns</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {(() => {
                                const dynamicAverages = calculateDayAverages(chartData.performanceData);
                                return Object.entries(dynamicAverages).map(([day, score]) => (
                                  <div key={day} className="flex items-center justify-between">
                                    <span className="font-medium">{day}</span>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          score >= 7 ? "bg-green-500" : score >= 4 ? "bg-yellow-500" : "bg-red-500"
                                        }`}
                                        style={{ width: `${score * 10}px` }}
                                      />
                                      <span
                                        className={`
                                        ${
                                          score >= 7
                                            ? "text-green-700"
                                            : score >= 4
                                              ? "text-yellow-700"
                                              : "text-red-700"
                                        } font-medium
                                      `}
                                      >
                                        {score.toFixed(1)}/10
                                      </span>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                        {(() => {
                          const { best, worst } = findBestAndWorstDays(chartData.performanceData);
                          return (
                            <>
                              <Card className="bg-green-50">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg text-green-800">Best Training Day</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-green-700 font-medium">{best.day} ({best.score.toFixed(1)}/10 average)</p>
                                  <p className="text-sm text-green-600 mt-1">
                                    Highest average performance score across training weeks
                                  </p>
                                </CardContent>
                              </Card>
                              <Card className="bg-red-50">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg text-red-800">Worst Training Day</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-red-700 font-medium">{worst.day} ({worst.score.toFixed(1)}/10 average)</p>
                                  <p className="text-sm text-red-600 mt-1">
                                    Lowest average performance, consider adjusting {worst.day} workouts
                                  </p>
                                </CardContent>
                              </Card>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="overflow-hidden border-2">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Deadlift Progress</CardTitle>
                      <CardDescription>Your deadlift journey</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-bold">
                      +90lbs in 6 months
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Charts 
                    benchData={chartData.benchData}
                    maxLiftsData={chartData.maxLiftsData}
                    liftData={chartData.liftData}
                    volumeData={chartData.volumeData}
                    fatigueData={chartData.fatigueData}
                    optimalRepData={chartData.optimalRepData}
                    performanceData={chartData.performanceData}
                    activeTab="deadlift"
                    deadliftData={importedData?.rawData?.length ? 
                      importedData.rawData
                        .filter(entry => entry && entry.exercise && 
                                 entry.exercise.toLowerCase().includes('competition') && 
                                 entry.exercise.toLowerCase().includes('deadlift'))
                        .map((entry, index) => {
                          // Calculate a reasonable goal based on weight (e.g., 5-10% more than current weight)
                          const currentWeight = entry.weight || 0;
                          const goalWeight = Math.round(currentWeight * 1.07); // 7% more as a goal
                          
                          return {
                            date: `Week ${Math.floor(index / 2) + 1}`,
                            weight: currentWeight,
                            goal: goalWeight,
                            rpe: entry.actualRPE || 0
                          };
                        }) : [
                          { date: "Jan", weight: 315, goal: 325, rpe: 8 },
                          { date: "Feb", weight: 335, goal: 345, rpe: 8.5 },
                          { date: "Mar", weight: 355, goal: 365, rpe: 9 },
                          { date: "Apr", weight: 365, goal: 375, rpe: 9 },
                          { date: "May", weight: 385, goal: 395, rpe: 9.5 },
                          { date: "Jun", weight: 405, goal: 415, rpe: 10 }
                        ]
                    }
                  />
                  <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t">
                    <div className="text-sm text-gray-500">
                      Current max: <span className="font-bold text-black">
                        {(() => {
                          // Get the deadlift data that's being passed to the Charts component
                          const deadliftData = importedData?.rawData?.length ? 
                            importedData.rawData
                              .filter(entry => entry && entry.exercise && 
                                     entry.exercise.toLowerCase().includes('competition') && 
                                     entry.exercise.toLowerCase().includes('deadlift'))
                              .map(entry => ({
                                weight: entry.weight || 0
                              })) : null;
                          
                          // Return the highest weight if data exists, otherwise fallback to 405
                          return deadliftData && deadliftData.length ? 
                            Math.max(...deadliftData.map(entry => entry.weight)) : 405;
                        })()} lbs
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Next goal: <span className="font-bold text-black">
                        {(() => {
                          // Get the latest goal from sample data if no imported data
                          const sampleData = [
                            { date: "Jan", weight: 315, goal: 325, rpe: 8 },
                            { date: "Feb", weight: 335, goal: 345, rpe: 8.5 },
                            { date: "Mar", weight: 355, goal: 365, rpe: 9 },
                            { date: "Apr", weight: 365, goal: 375, rpe: 9 },
                            { date: "May", weight: 385, goal: 395, rpe: 9.5 },
                            { date: "Jun", weight: 405, goal: 415, rpe: 10 }
                          ];
                          
                          // Get current max
                          const currentMax = importedData?.rawData?.length ? 
                            Math.max(...importedData.rawData
                              .filter(entry => entry && entry.exercise && 
                                     entry.exercise.toLowerCase().includes('competition') && 
                                     entry.exercise.toLowerCase().includes('deadlift'))
                              .map(entry => entry.weight || 0)) : 405;
                              
                          // Calculate goal as 7% higher if using imported data
                          return importedData?.rawData?.length ? 
                            Math.round(currentMax * 1.07) : 415;
                        })()} lbs
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Last RPE: <span className="font-bold text-black">
                        {(() => {
                          // Get the deadlift data with RPE
                          const deadliftData = importedData?.rawData?.length ? 
                            importedData.rawData
                              .filter(entry => entry && entry.exercise && 
                                     entry.exercise.toLowerCase().includes('competition') && 
                                     entry.exercise.toLowerCase().includes('deadlift'))
                              .map(entry => ({
                                rpe: entry.actualRPE || 0
                              })) : null;
                          
                          // Return the last RPE if data exists, otherwise fallback to 10
                          return deadliftData && deadliftData.length ? 
                            deadliftData[deadliftData.length - 1].rpe : 10;
                        })()}/10
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>Understanding your powerlifting analytics</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm">
                  <h3>1. Track Your Progress</h3>
                  <p>Import your training data through Google Sheets or manual entry. We'll automatically analyze your lifts, volume, and patterns.</p>
                  
                  <h3>2. Analyze Performance</h3>
                  <p>View detailed breakdowns of your lifting progress, optimal rep ranges, and identify your best training days.</p>
                  
                  <h3>3. Optimize Training</h3>
                  <p>Use insights from your performance patterns to adjust your training schedule and rep schemes for maximum results.</p>
                </CardContent>
                <div className="px-6 pb-6 flex justify-center">
                  <Button className="w-full" variant="outline">Learn More</Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

