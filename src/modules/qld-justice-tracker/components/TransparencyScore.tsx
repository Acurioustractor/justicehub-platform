interface TransparencyScoreProps {
  data: {
    overall_score: number
    grade: string
    categories: {
      [key: string]: {
        weight: number
        score: number
        status: string
      }
    }
  }
}

export default function TransparencyScore({ data }: TransparencyScoreProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'partial':
        return 'text-yellow-600'
      case 'poor':
        return 'text-red-600'
      case 'none':
        return 'text-red-800'
      case 'limited':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-600'
      case 'B':
        return 'text-blue-600'
      case 'C':
        return 'text-yellow-600'
      case 'D':
        return 'text-orange-600'
      case 'F':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const categoryLabels = {
    budget_documents: 'Budget Documents',
    real_time_data: 'Real-time Data',
    hidden_costs: 'Hidden Costs Tracking',
    outcome_data: 'Outcome Reporting'
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6">Government Transparency Score</h2>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-40 h-40 mx-auto">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - data.overall_score / 100)}`}
                  className="text-qld-maroon transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{data.overall_score}</span>
                <span className={`text-3xl font-bold ${getGradeColor(data.grade)}`}>{data.grade}</span>
              </div>
            </div>
            <p className="mt-4 text-lg font-medium">Data Transparency Rating</p>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-4">
              {Object.entries(data.categories).map(([key, category]) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{categoryLabels[key as keyof typeof categoryLabels] || key}</span>
                    <span className={`text-sm font-semibold uppercase ${getStatusColor(category.status)}`}>
                      {category.status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-qld-maroon h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Queensland's youth justice data transparency lags behind best practices. 
                Real-time data and family cost tracking are almost non-existent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}