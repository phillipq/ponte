"use client"

import { Button } from "components/Button"
import Navigation from "components/Navigation"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

interface ImportResult {
  email: string
  name?: string
  isNew: boolean
  responsesCount: number
  version: number
}

interface ValidationResults {
  csvAnalysis: {
    totalColumns: number
    questionColumns: number
    emptyColumns: string[]
    duplicateQuestions: string[]
  }
  comparison: {
    totalDbQuestions: number
    totalCsvQuestions: number
    matches: unknown[]
    missingInCsv: Array<{ section: string; question: string }>
    partialMatches: Array<{
      dbQuestion: string
      csvQuestion: string
      section: string
      similarity: number
    }>
    csvQuestions: string[]
  }
  clientAnalysis: Array<{
    email: string
    rowIndex: number
    totalResponses: number
    totalQuestions: number
    completeness: number
    missingResponses: number
  }>
}

export default function QuestionnaireImportPage() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [confirmedMatches, setConfirmedMatches] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<ImportResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ponte-terracotta mx-auto"></div>
          <p className="mt-2 text-ponte-olive">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResults([])
      setShowResults(false)
    }
  }


  const toggleConfirmedMatch = (matchKey: string) => {
    const newConfirmed = new Set(confirmedMatches)
    if (newConfirmed.has(matchKey)) {
      newConfirmed.delete(matchKey)
    } else {
      newConfirmed.add(matchKey)
    }
    setConfirmedMatches(newConfirmed)
  }

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    // Parse CSV properly handling quoted fields with commas
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0] || '')
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i] || '')
      const row: Record<string, string> = {}
      
      headers.forEach((header, index) => {
        // Remove surrounding quotes if present
        const cleanHeader = (header || '').replace(/^"(.*)"$/, '$1')
        const cleanValue = (values[index] || '').replace(/^"(.*)"$/, '$1')
        row[cleanHeader] = cleanValue
      })
      
      data.push(row)
    }

    return data
  }

  const handleValidate = async () => {
    if (!file) return

    setValidating(true)
    try {
      const csvText = await file.text()
      const csvData = parseCSV(csvText)

      // Validate questionnaire structure
      const response = await fetch('/api/questionnaire/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData })
      })

      if (response.ok) {
        const data = await response.json() as ValidationResults
        setValidationResults(data)
        setShowValidation(true)
      } else {
        throw new Error('Failed to validate questionnaire')
      }
    } catch (error) {
      console.error('Error validating questionnaire:', error)
      alert('Error validating questionnaire. Please check the format and try again.')
    } finally {
      setValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    try {
      const csvText = await file.text()
      const csvData = parseCSV(csvText)
      
      const importResults: ImportResult[] = []
      
      for (const row of csvData) {
        const email = row.email || row.Email || row.EMAIL || row['Email Address']
        const name = row.name || row.Name || row.NAME
        
        if (!email) {
          console.warn('Row missing email:', row)
          continue
        }

      // Extract responses (everything except email, name, and timestamp)
      const responses: Record<string, string> = {}
      Object.entries(row).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase()
        if (lowerKey !== 'email' && 
            lowerKey !== 'name' && 
            lowerKey !== 'timestamp' && 
            lowerKey !== 'email address' &&
            value && 
            value.toString().trim()) {
          responses[key] = value
        }
      })

        try {
          const response = await fetch('/api/questionnaire/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              name,
              responses,
              source: 'csv_import',
              confirmedMatches: Array.from(confirmedMatches)
            })
          })

          if (response.ok) {
            const data = await response.json() as { client: unknown, responseSet: unknown }
            importResults.push({
              email,
              name: (data.client as { name: string }).name,
              isNew: (data.client as { isNew: boolean }).isNew,
              responsesCount: (data.responseSet as { responsesCount: number }).responsesCount,
              version: (data.responseSet as { version: number }).version
            })
          } else {
            console.error('Import failed for:', email)
          }
        } catch (error) {
          console.error('Error importing row:', error)
        }
      }

      setResults(importResults)
      setShowResults(true)
    } catch (error) {
      console.error('Error processing import:', error)
      alert('Error processing import. Please check the format and try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            intent="secondary" 
            onClick={() => router.push("/questionnaire")}
            className="mb-4"
          >
            ← Back to Questionnaire
          </Button>
          <h1 className="text-3xl font-bold text-ponte-black font-header">Import Questionnaire Responses</h1>
          <p className="mt-2 text-ponte-olive font-body">
            Upload a CSV file with questionnaire responses. Email addresses will be used to match existing clients.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow border border-ponte-sand p-6">
          <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Import Questionnaire Responses</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-ponte-black mb-2">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-ponte-sand rounded-lg p-6 text-center hover:border-ponte-terracotta transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-ponte-olive file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ponte-terracotta file:text-white hover:file:bg-accent-600"
              />
              <p className="mt-2 text-sm text-ponte-olive">
                Choose a CSV file with client responses
              </p>
            </div>
          </div>

          {file && (
            <div className="mb-4 p-3 bg-ponte-sand rounded-md">
              <p className="text-sm text-ponte-black">
                <strong>Selected file:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2">CSV Format Requirements:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• First column must be "email" (required)</li>
              <li>• Second column can be "name" (optional)</li>
              <li>• Remaining columns should match your questionnaire questions</li>
              <li>• Use commas to separate values</li>
              <li>• Wrap text with quotes if it contains commas</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleValidate}
              disabled={!file || validating}
              intent="secondary"
              className="flex-1"
            >
              {validating ? "Validating..." : "Validate First"}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1"
            >
              {importing ? "Importing..." : "Import Responses"}
            </Button>
          </div>
        </div>

        {showValidation && validationResults && (
          <div className="mt-8 bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Questionnaire Validation Results</h2>
            
            {/* CSV Analysis */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-ponte-black mb-3 font-header">CSV Structure Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-1">Total Columns</h4>
                  <p className="text-xl font-bold text-gray-900">{validationResults.csvAnalysis.totalColumns}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Question Columns</h4>
                  <p className="text-xl font-bold text-blue-900">{validationResults.csvAnalysis.questionColumns}</p>
                </div>
              </div>
              {validationResults.csvAnalysis.emptyColumns.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>{validationResults.csvAnalysis.emptyColumns.length} empty columns</strong> found (no responses)
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {validationResults.csvAnalysis.emptyColumns.map((column: string, index: number) => (
                        <li key={index} className="truncate">• {column}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {validationResults.csvAnalysis.duplicateQuestions.length > 0 && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 mb-2">
                    <strong>{validationResults.csvAnalysis.duplicateQuestions.length} duplicate questions</strong> found
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="text-xs text-orange-700 space-y-1">
                      {validationResults.csvAnalysis.duplicateQuestions.map((question: string, index: number) => (
                        <li key={index} className="truncate">• {question}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* All CSV Columns */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-ponte-black mb-3 font-header">All CSV Columns</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {validationResults.comparison.csvQuestions.map((column: string, index: number) => (
                      <div key={index} className="p-1 bg-white rounded border text-gray-700 truncate">
                        {index + 1}. {column}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Showing {validationResults.comparison.csvQuestions.length} question columns (excluding timestamp, email, etc.)
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Database Questions</h3>
                <p className="text-2xl font-bold text-blue-900">{validationResults.comparison.totalDbQuestions}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800 mb-1">CSV Questions</h3>
                <p className="text-2xl font-bold text-green-900">{validationResults.comparison.totalCsvQuestions}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-800 mb-1">Exact Matches</h3>
                <p className="text-2xl font-bold text-purple-900">{validationResults.comparison.matches.length}</p>
              </div>
            </div>

            {/* Client Analysis */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-ponte-black mb-3 font-header">Client Response Analysis</h3>
              <div className="space-y-2">
                {validationResults.clientAnalysis.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-ponte-cream rounded-lg">
                    <div>
                      <p className="font-medium text-ponte-black">{client.email}</p>
                      <p className="text-sm text-ponte-olive">
                        Row {client.rowIndex} • {client.totalResponses}/{client.totalQuestions} responses
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.completeness === 100 ? 'bg-green-100 text-green-800' :
                        client.completeness > 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {client.completeness}% Complete
                      </span>
                      {client.missingResponses > 0 && (
                        <p className="text-xs text-ponte-olive mt-1">
                          {client.missingResponses} missing
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Matching */}
            {validationResults.comparison.missingInCsv.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-ponte-black mb-3 font-header text-red-700">
                  Questions Missing from CSV ({validationResults.comparison.missingInCsv.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {validationResults.comparison.missingInCsv.map((item, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <span className="font-medium text-red-800">{item.section}:</span> {item.question}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partial Matches */}
            {validationResults.comparison.partialMatches.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-ponte-black mb-3 font-header text-yellow-700">
                  Potential Matches ({validationResults.comparison.partialMatches.length})
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Review these potential matches and confirm which ones should be treated as exact matches:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationResults.comparison.partialMatches.map((item, index) => {
                    const matchKey = `${item.dbQuestion}-${item.csvQuestion}`
                    const isConfirmed = confirmedMatches.has(matchKey)
                    return (
                      <div key={index} className={`p-3 border rounded text-sm ${
                        isConfirmed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isConfirmed}
                            onChange={() => toggleConfirmedMatch(matchKey)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 mb-1">
                              <span className="text-blue-600">{item.section}:</span> {item.dbQuestion}
                            </div>
                            <div className="text-gray-600 mb-1">
                              <span className="text-green-600">CSV:</span> {item.csvQuestion}
                            </div>
                            <div className="text-xs text-gray-500">
                              Similarity: {Math.round(item.similarity * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {confirmedMatches.size > 0 && (
                  <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                    ✓ {confirmedMatches.size} potential match(es) confirmed as exact matches
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                intent="secondary"
                onClick={() => {
                  setShowValidation(false)
                  setValidationResults(null)
                }}
              >
                Close Validation
              </Button>
              <Button
                onClick={() => {
                  setShowValidation(false)
                  handleImport()
                }}
              >
                Proceed with Import
              </Button>
            </div>
          </div>
        )}

        {showResults && (
          <div className="mt-8 bg-white rounded-lg shadow border border-ponte-sand p-6">
            <h2 className="text-xl font-semibold text-ponte-black mb-4 font-header">Import Results</h2>
            
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="border border-ponte-sand rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ponte-black">{result.name}</p>
                      <p className="text-sm text-ponte-olive">{result.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.isNew 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {result.isNew ? 'New Client' : 'Existing Client'}
                      </span>
                      <p className="text-sm text-ponte-olive mt-1">
                        Version {result.version} • {result.responsesCount} responses
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                intent="secondary"
                onClick={() => {
                  setResults([])
                  setShowResults(false)
                  setFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                }}
              >
                Import Another File
              </Button>
              <Button
                onClick={() => router.push("/clients")}
              >
                View Clients
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
