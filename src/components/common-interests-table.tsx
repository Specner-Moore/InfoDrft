'use client'

//list of common interests
const SAMPLE_INTERESTS = [
  'Technology', 'Science', 'Business', 'Politics', 'Sports', 
  'Entertainment', 'Health', 'Education', 'Environment', 'Travel',
  'Food', 'Art', 'Music', 'Movies', 'Books', 'Gaming', 'Fitness',
  'Finance', 'Automotive', 'Fashion'
]

interface CommonInterestsTableProps {
  selectedInterests: string[]
  onToggleInterest: (interest: string) => void
  onAddCustomInterest: (interest: string) => void
  onRemoveInterest: (interest: string) => void
  customInterest: string
  setCustomInterest: (value: string) => void
  isSaving: boolean
}

//common interests table for adding interests
export function CommonInterestsTable({
  selectedInterests,
  onToggleInterest,
  onAddCustomInterest,
  onRemoveInterest,
  customInterest,
  setCustomInterest,
  isSaving
}: CommonInterestsTableProps) {
  
  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      onAddCustomInterest(customInterest.trim())
      setCustomInterest('')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Your Selected Interests ({selectedInterests.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
              >
                {interest}
                <button
                  onClick={() => onRemoveInterest(interest)}
                  className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  X
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sample Interests Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Popular Interests
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {SAMPLE_INTERESTS.map((interest) => (
            <button
              key={interest}
              onClick={() => onToggleInterest(interest)}
              disabled={isSaving}
              className={`p-3 rounded-lg border-2 transition-colors font-medium ${
                selectedInterests.includes(interest)
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Interest Input */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Add Custom Interest
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomInterest()}
            placeholder="Enter a custom interest..."
            disabled={isSaving}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <button
            onClick={handleAddCustomInterest}
            disabled={!customInterest.trim() || isSaving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
