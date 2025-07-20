interface RecentActivityProps {
  documents: {
    total: number
    recent: Array<{
      title: string
      date: string
      type: string
    }>
  }
}

export default function RecentActivity({ documents }: RecentActivityProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hansard':
        return 'bg-blue-100 text-blue-800'
      case 'committee_report':
        return 'bg-green-100 text-green-800'
      case 'question_on_notice':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6">Recent Parliamentary Activity</h2>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-600">
            <span className="font-semibold text-2xl text-qld-maroon">{documents.total}</span> documents mentioning youth justice
          </p>
        </div>

        {documents.recent.length > 0 ? (
          <div className="space-y-4">
            {documents.recent.map((doc, index) => (
              <div key={index} className="border-l-4 border-qld-maroon pl-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg mb-1">{doc.title}</h4>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600">{doc.date}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
                        {formatType(doc.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent documents available</p>
        )}
      </div>
    </section>
  )
}