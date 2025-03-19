'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SheetData } from '../lib/google-sheets'

interface GoogleSheetsImportProps {
  onDataImport: (data: {
    maxLiftsData: Array<{ date: string; [key: string]: any }>;
    volumeData: Array<{ week: string; volume: number; tonnage: number }>;
    rawData: SheetData[];
  }) => void;
}

export function GoogleSheetsImport({ onDataImport }: GoogleSheetsImportProps) {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('https://docs.google.com/spreadsheets/d/1A_oxZqTqsEfJ0fqANXn3DL9ctLtdTAm4T5V3d-VuBVg/edit?usp=sharing')
  const [range, setRange] = useState('Sheet1!A1:F')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractSpreadsheetId = (url: string): string | null => {
    // Handle both full URLs and direct IDs
    if (url.includes('docs.google.com/spreadsheets/d/')) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
      return match ? match[1] : null
    }
    // If it's already an ID, return it
    return url
  }

  // Ensure range format is correct
  const formatRange = (rangeInput: string): string => {
    // Check if range already has a colon
    if (rangeInput.includes(':')) {
      return rangeInput;
    }
    
    // Check for patterns like 'Sheet1!A1F8' that need to be fixed
    const match = rangeInput.match(/^(.+!)([A-Z]+\d+)([A-Z]+\d+)$/);
    if (match) {
      return `${match[1]}${match[2]}:${match[3]}`;
    }
    
    // For simpler cases like 'Sheet1!A1', append a suitable range
    if (rangeInput.match(/^.+![A-Z]+\d+$/)) {
      return `${rangeInput}:${rangeInput[rangeInput.length-2]}50`;
    }
    
    return rangeInput;
  }

  const handleImport = async () => {
    if (!spreadsheetUrl) {
      setError('Please enter a Google Sheets URL or ID')
      return
    }

    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl)
    if (!spreadsheetId) {
      setError('Invalid Google Sheets URL or ID')
      return
    }

    // Format the range correctly
    const formattedRange = formatRange(range);
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spreadsheetId, range: formattedRange }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import data')
      }

      const data = await response.json()
      onDataImport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Data</CardTitle>
        <CardDescription>Import your training data from Google Sheets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="spreadsheetUrl" className="text-sm font-medium">
              Google Sheets URL or ID
            </label>
            <Input
              id="spreadsheetUrl"
              placeholder="Paste your Google Sheets URL or ID here"
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Example URL: https://docs.google.com/spreadsheets/d/1234567890abcdef/edit
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="range" className="text-sm font-medium">
              Range
            </label>
            <Input
              id="range"
              placeholder="e.g., Sheet1!A2:F"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Make sure to include a colon in your range (e.g., A1:F10)
            </p>
          </div>
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          <Button 
            onClick={handleImport} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Importing...' : 'Import Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 