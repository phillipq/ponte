"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useRef, useState } from "react"
import { Button } from "components/Button"
import Navigation from "components/Navigation"

interface _Questionnaire {
  id: string
  name: string
  description?: string
  isDefault: boolean
}

interface QuestionImportResult {
  section: string
  question: string
  questionType: "text" | "ranking" | "yesno"
  order: number
  isNew: boolean
}

export default function QuestionImportPage() {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<unknown>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [results, setResults] = useState<QuestionImportResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState("")
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
      setError("")
    }
  }

  const validateQuestions = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setValidating(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/questionnaire/questions/validate", {
        method: "POST",
        body: formData,
      })

      const data = await response.json() as { error?: string, [key: string]: unknown }

      if (response.ok) {
        setValidationResults(data)
        setShowValidation(true)
      } else {
        setError(data.error || "Validation failed")
      }
    } catch {
      setError("Validation failed")
    } finally {
      setValidating(false)
    }
  }

  const importQuestions = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }


    setImporting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/questionnaire/questions/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json() as { error?: string, results?: QuestionImportResult[] }

      if (response.ok) {
        setResults(data.results || [])
        setShowResults(true)
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        setError(data.error || "Import failed")
      }
    } catch {
      setError("Import failed")
    } finally {
      setImporting(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setValidationResults(null)
    setShowValidation(false)
    setResults([])
    setShowResults(false)
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-ponte-cream">
      <Navigation />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/questionnaire")}
                className="mr-4 p-2 text-ponte-olive hover:text-ponte-black hover:bg-ponte-sand rounded-md"
              >
                ← Back to Questionnaires
              </button>
              <Image 
                src="/logos/icon-questionnaire.png" 
                alt="Questionnaire Icon" 
                width={32}
                height={32}
                className="w-8 h-8 mr-3"
              />
              <div>
                <h1 className="text-3xl font-bold text-ponte-black">Import Questionnaire Questions</h1>
                <p className="mt-2 text-ponte-olive">Import questionnaire questions from CSV file</p>
              </div>
            </div>
          </div>
        </div>


        {/* File Upload */}
        <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand mb-8">
          <h2 className="text-xl font-semibold text-ponte-black mb-4">Upload Questions CSV</h2>
          
          <div className="mb-4">
            <label htmlFor="file" className="block text-sm font-medium text-ponte-black mb-2">
              Select CSV File *
            </label>
            <div className="border-2 border-dashed border-ponte-sand rounded-lg p-6 text-center hover:border-ponte-terracotta transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-ponte-olive file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ponte-terracotta file:text-white hover:file:bg-accent-600"
              />
              <p className="mt-2 text-sm text-ponte-olive">
                Choose a CSV file with columns: section, question, questionType, order
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

          <div className="flex space-x-4">
            <Button
              onClick={validateQuestions}
              disabled={!file || validating}
              className="bg-ponte-olive hover:bg-accent-600 disabled:opacity-50"
            >
              {validating ? "Validating..." : "Validate Questions"}
            </Button>
            
            <Button
              onClick={importQuestions}
              disabled={!file || importing}
              className="bg-ponte-terracotta hover:bg-accent-600 disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import Questions"}
            </Button>

            <Button
              onClick={resetForm}
              intent="secondary"
              className="border-ponte-sand text-ponte-black hover:bg-ponte-sand"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* CSV Format Instructions */}
        <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand mb-8">
          <h2 className="text-xl font-semibold text-ponte-black mb-4">CSV Format Requirements</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-ponte-black mb-2">Required Columns:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-ponte-olive">
                <li><strong>section</strong> - Question section/category (e.g., "Basic Information", "Preferences")</li>
                <li><strong>question</strong> - The actual question text</li>
                <li><strong>questionType</strong> - Question type: "text", "ranking", or "yesno"</li>
                <li><strong>order</strong> - Display order within the section (number)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-ponte-black mb-2">Example CSV:</h3>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <div>section,question,questionType,order</div>
                <div>"Basic Information","What is your name?","text",1</div>
                <div>"Basic Information","What is your email?","text",2</div>
                <div>"Preferences","Rate your interest in this property (1-5)","ranking",1</div>
                <div>"Preferences","Do you need parking?","yesno",2</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-ponte-black mb-2">Tips:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-ponte-olive">
                <li>Use quotes around text that contains commas</li>
                <li>Section names will be created automatically if they don't exist</li>
                <li>Questions will be ordered by the 'order' column within each section</li>
                <li>Question types must be exactly: "text", "ranking", or "yesno"</li>
                <li>Duplicate questions will be skipped</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Validation Results */}
        {showValidation && validationResults && (
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand mb-8">
            <h2 className="text-xl font-semibold text-ponte-black mb-4">Validation Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-ponte-sand p-4 rounded-md">
                <h3 className="font-medium text-ponte-black">Total Questions</h3>
                <p className="text-2xl font-bold text-ponte-terracotta">{validationResults.totalQuestions}</p>
              </div>
              <div className="bg-ponte-sand p-4 rounded-md">
                <h3 className="font-medium text-ponte-black">Sections</h3>
                <p className="text-2xl font-bold text-ponte-terracotta">{validationResults.sections?.length || 0}</p>
              </div>
              <div className="bg-ponte-sand p-4 rounded-md">
                <h3 className="font-medium text-ponte-black">New Questions</h3>
                <p className="text-2xl font-bold text-ponte-terracotta">{validationResults.newQuestions || 0}</p>
              </div>
            </div>

            {validationResults.sections && (
              <div>
                <h3 className="text-lg font-medium text-ponte-black mb-3">Sections Found:</h3>
                <div className="space-y-2">
                  {validationResults.sections.map((section: unknown, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-ponte-sand rounded-md">
                      <span className="font-medium text-ponte-black">{(section as { name: string }).name}</span>
                      <span className="text-sm text-ponte-olive">{(section as { questionCount: number }).questionCount} questions</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Results */}
        {showResults && results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 border border-ponte-sand">
            <h2 className="text-xl font-semibold text-ponte-black mb-4">Import Results</h2>
            
            <div className="mb-4">
              <p className="text-sm text-ponte-olive">
                Successfully imported {results.length} questions
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-ponte-sand rounded-md">
                  <div>
                    <span className="font-medium text-ponte-black">{result.section}</span>
                    <p className="text-sm text-ponte-olive">{result.question}</p>
                    <span className="text-xs text-ponte-terracotta font-medium">
                      Type: {result.questionType}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    result.isNew 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.isNew ? 'New' : 'Updated'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
