'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
} from "recharts"

interface ChartProps {
  benchData: any[]
  maxLiftsData: Array<{ date: string; [key: string]: any }>
  liftData: any[]
  volumeData: any[]
  fatigueData: any[]
  optimalRepData: any[]
  performanceData: any[]
  activeTab?: string
  deadliftData?: any[]
  squatAccessoryData?: any[]
  benchAccessoryData?: any[]
  deadliftAccessoryData?: any[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"]

const CustomTooltip = ({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ 
    name: string; 
    value: number; 
    color: string; 
  }>; 
  label?: string; 
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-sm">
        <p className="font-semibold">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}${
              entry.name === "RPE (Actual Exertion)" || 
              entry.name === "Recovery Score" || 
              entry.name === "Fatigue Threshold" 
                ? "" 
                : "lbs"
            }`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function Charts({ 
  benchData, 
  maxLiftsData, 
  liftData, 
  volumeData, 
  fatigueData, 
  optimalRepData, 
  performanceData,
  activeTab = "bench",
  deadliftData,
  squatAccessoryData,
  benchAccessoryData,
  deadliftAccessoryData
}: ChartProps) {
  const renderChart = () => {
    // Always render the bench chart first, regardless of activeTab
    if (activeTab === "bench" || !activeTab) {
      return (
        <div className="h-[300px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={benchData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="date" />
              <YAxis domain={["dataMin - 20", "dataMax + 20"]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="weight"
                name="Weight"
                stroke="#000000"
                fillOpacity={1}
                fill="url(#colorWeight)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="goal"
                name="Goal"
                stroke="#8884d8"
                fillOpacity={0.3}
                fill="url(#colorGoal)"
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="rpe" 
                name="RPE" 
                stroke="#ff7300" 
                yAxisId={1} 
                hide={true} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )
    }

    switch (activeTab) {
      case "maxLifts":
        // Process data to ensure lines span the entire graph
        const processedMaxLiftsData = (() => {
          // Return original data if empty
          if (!maxLiftsData || maxLiftsData.length === 0) {
            return maxLiftsData;
          }
          
          // Find the maximum week number in the dataset
          const maxWeekNumber = Math.max(...maxLiftsData.map(entry => {
            const weekMatch = entry.date.match(/Week\s+(\d+)/i);
            return weekMatch ? parseInt(weekMatch[1]) : 0;
          }));
          
          // Define min week as 1
          const minWeek = 1;
          
          // Identify which lifts have data
          const hasSquat = maxLiftsData.some(entry => entry.squat !== undefined);
          const hasBench = maxLiftsData.some(entry => entry.bench !== undefined);
          const hasDeadlift = maxLiftsData.some(entry => entry.deadlift !== undefined);
          
          // Get the last available values for each lift
          const lastSquat = hasSquat 
            ? maxLiftsData.filter(entry => entry.squat !== undefined).pop()?.squat 
            : undefined;
          const lastBench = hasBench 
            ? maxLiftsData.filter(entry => entry.bench !== undefined).pop()?.bench 
            : undefined;
          const lastDeadlift = hasDeadlift 
            ? maxLiftsData.filter(entry => entry.deadlift !== undefined).pop()?.deadlift 
            : undefined;
          
          // Create a complete set of weeks from 1 to maxWeekNumber
          const completeData: Array<{ date: string; [key: string]: any }> = [];
          
          // Add existing data points
          maxLiftsData.forEach(entry => {
            completeData.push({...entry});
          });
          
          // Ensure we have entries for weeks 1 through maxWeekNumber
          for (let week = minWeek; week <= maxWeekNumber; week++) {
            const weekString = `Week ${week}`;
            // Check if this week exists in our data
            if (!completeData.some(entry => entry.date === weekString)) {
              // Add a point for this missing week
              completeData.push({
                date: weekString,
                ...(hasSquat ? { squat: lastSquat } : {}),
                ...(hasBench ? { bench: lastBench } : {}),
                ...(hasDeadlift ? { deadlift: lastDeadlift } : {})
              });
            }
          }
          
          // Sort by week number to ensure proper ordering
          return completeData.sort((a, b) => {
            const weekA = parseInt(a.date.split(' ')[1]);
            const weekB = parseInt(b.date.split(' ')[1]);
            return weekA - weekB;
          });
        })();
        
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedMaxLiftsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {processedMaxLiftsData.length > 0 && processedMaxLiftsData.some(entry => entry.squat !== undefined) && (
                  <Line 
                    type="monotone" 
                    dataKey="squat" 
                    name="Squat" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                    connectNulls={true}
                  />
                )}
                {processedMaxLiftsData.length > 0 && processedMaxLiftsData.some(entry => entry.bench !== undefined) && (
                  <Line 
                    type="monotone" 
                    dataKey="bench" 
                    name="Bench" 
                    stroke="#82ca9d" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                    connectNulls={true}
                  />
                )}
                {processedMaxLiftsData.length > 0 && processedMaxLiftsData.some(entry => entry.deadlift !== undefined) && (
                  <Line 
                    type="monotone" 
                    dataKey="deadlift" 
                    name="Deadlift" 
                    stroke="#ff7300" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                    connectNulls={true}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      case "volume":
        return (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tonnage" name="Total Tonnage (Sets × Reps × Weight)" fill="#000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      case "fatigue":
        return (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fatigueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rpe"
                  name="RPE (Actual Exertion)"
                  stroke="#000000"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="recovery"
                  name="Recovery Score"
                  stroke="#00c49f"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      case "optimal":
        return (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={optimalRepData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 12]} />
                <YAxis dataKey="lift" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="optimalReps" name="Optimal Reps" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      case "performance":
        return (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="performance"
                  name="Performance Score"
                  stroke="#000000"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      case "accessories":
        return (
          <div className="grid grid-cols-3 gap-6">
            {/* Squat Accessories */}
            <div>
              <h3 className="font-semibold mb-2">Squat Accessories</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={squatAccessoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[6000, 10000]} ticks={[6000, 7000, 8000, 9000, 10000]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Total Weight"
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bench Accessories */}
            <div>
              <h3 className="font-semibold mb-2">Bench Press Accessories</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={benchAccessoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[5000, 8000]} ticks={[5000, 6000, 7000, 8000]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Total Weight"
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Deadlift Accessories */}
            <div>
              <h3 className="font-semibold mb-2">Deadlift Accessories</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deadliftAccessoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[6000, 9000]} ticks={[6000, 7000, 8000, 9000]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Total Weight"
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      case "deadlift":
        return (
          <div className="h-[300px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deadliftData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeadliftWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff7300" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorDeadliftGoal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" />
                <YAxis domain={["dataMin - 20", "dataMax + 20"]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  name="Weight" 
                  stroke="#ff7300" 
                  fillOpacity={1}
                  fill="url(#colorDeadliftWeight)" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="goal"
                  name="Goal"
                  stroke="#8884d8"
                  fillOpacity={0.3}
                  fill="url(#colorDeadliftGoal)"
                  strokeDasharray="5 5"
                />
                {deadliftData && deadliftData[0]?.rpe && (
                  <Line 
                    type="monotone" 
                    dataKey="rpe" 
                    name="RPE" 
                    stroke="#8884d8" 
                    yAxisId={1}
                    hide={true}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )
      default:
        // Default to the bench chart (though this should be unreachable now)
        return (
          <div className="h-[300px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={benchData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" />
                <YAxis domain={["dataMin - 20", "dataMax + 20"]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="weight"
                  name="Weight"
                  stroke="#000000"
                  fillOpacity={1}
                  fill="url(#colorWeight)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="goal"
                  name="Goal"
                  stroke="#8884d8"
                  fillOpacity={0.3}
                  fill="url(#colorGoal)"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="rpe" 
                  name="RPE" 
                  stroke="#ff7300" 
                  yAxisId={1} 
                  hide={true} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )
    }
  }

  return (
    <div className="space-y-8">
      {renderChart()}
    </div>
  )
} 