import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import Card from "@/components/ui/Card"
import CardContent from "@/components/ui/Card/CardContent"

const accessoryData = [
  {
    week: "Week 1",
    // Bench accessories
    "Incline Press": 2500,
    "Dumbbell Press": 1800,
    "Close Grip": 1500,
    // Squat accessories
    "Front Squat": 3000,
    "Bulgarian Split": 1200,
    "Leg Press": 4000,
    // Deadlift accessories
    "Romanian Deadlift": 3500,
    "Good Morning": 1800,
    "Back Extension": 1000,
  },
  {
    week: "Week 2",
    "Incline Press": 2700,
    "Dumbbell Press": 2000,
    "Close Grip": 1600,
    "Front Squat": 3200,
    "Bulgarian Split": 1400,
    "Leg Press": 4200,
    "Romanian Deadlift": 3700,
    "Good Morning": 2000,
    "Back Extension": 1200,
  },
  {
    week: "Week 3",
    "Incline Press": 2900,
    "Dumbbell Press": 2200,
    "Close Grip": 1700,
    "Front Squat": 3400,
    "Bulgarian Split": 1600,
    "Leg Press": 4400,
    "Romanian Deadlift": 3900,
    "Good Morning": 2200,
    "Back Extension": 1400,
  },
  {
    week: "Week 4",
    "Incline Press": 3100,
    "Dumbbell Press": 2400,
    "Close Grip": 1800,
    "Front Squat": 3600,
    "Bulgarian Split": 1800,
    "Leg Press": 4600,
    "Romanian Deadlift": 4100,
    "Good Morning": 2400,
    "Back Extension": 1600,
  },
]

export function AccessoryVolume() {
  return (
    <div className="space-y-6">
      {/* Bench Accessories */}
      <div className="space-y-4">
        <h3 className="font-semibold">Bench Press Accessories</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accessoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Incline Press" stroke="#000000" strokeWidth={2} />
              <Line type="monotone" dataKey="Dumbbell Press" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="Close Grip" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Squat Accessories */}
      <div className="space-y-4">
        <h3 className="font-semibold">Squat Accessories</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accessoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Front Squat" stroke="#000000" strokeWidth={2} />
              <Line type="monotone" dataKey="Bulgarian Split" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="Leg Press" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deadlift Accessories */}
      <div className="space-y-4">
        <h3 className="font-semibold">Deadlift Accessories</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accessoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Romanian Deadlift" stroke="#000000" strokeWidth={2} />
              <Line type="monotone" dataKey="Good Morning" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="Back Extension" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="text-sm font-medium">Total Bench Accessories</div>
            <div className="text-2xl font-bold">7,300 lbs</div>
            <div className="text-xs text-green-600">+600 lbs from last week</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="text-sm font-medium">Total Squat Accessories</div>
            <div className="text-2xl font-bold">10,000 lbs</div>
            <div className="text-xs text-green-600">+800 lbs from last week</div>
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
    </div>
  )
}

