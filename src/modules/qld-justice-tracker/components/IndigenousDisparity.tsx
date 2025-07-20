interface IndigenousDisparityProps {
  data: {
    detention_percentage: number
    population_percentage: number
    overrepresentation_factor: number
    min_factor: number
    max_factor: number
  }
}

export default function IndigenousDisparity({ data }: IndigenousDisparityProps) {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6">Indigenous Youth Overrepresentation</h2>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-1">Indigenous youth in Queensland</p>
                <div className="w-full bg-gray-200 rounded-full h-8 relative">
                  <div 
                    className="bg-blue-500 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ width: `${data.population_percentage}%` }}
                  >
                    {data.population_percentage}%
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-1">Indigenous youth in detention</p>
                <div className="w-full bg-gray-200 rounded-full h-8 relative">
                  <div 
                    className="bg-red-500 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ width: `${data.detention_percentage}%` }}
                  >
                    {data.detention_percentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-red-600 mb-2">
                {data.min_factor}-{data.max_factor}x
              </div>
              <p className="text-lg text-gray-600">
                Higher detention rate than population
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}