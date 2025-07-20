import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, X, DollarSign } from 'lucide-react'
import { governmentSpending } from '../lib/spendingData'

export default function SearchFilters({ filters, onFiltersChange, loading }) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    location: true,
    demographics: true,
    populations: false,
    funding: true
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
      offset: 0 // Reset to first page when filters change
    }
    onFiltersChange(newFilters)
  }

  const clearFilter = (key) => {
    handleFilterChange(key, key.includes('_specific') ? false : '')
  }

  const categoryOptions = [
    { value: 'legal_aid', label: 'Legal Aid' },
    { value: 'mental_health', label: 'Mental Health' },
    { value: 'housing', label: 'Housing & Accommodation' },
    { value: 'crisis_support', label: 'Crisis Support' },
    { value: 'education_support', label: 'Education & Training' },
    { value: 'drug_alcohol', label: 'Drug & Alcohol Support' },
    { value: 'family_support', label: 'Family Support' },
    { value: 'cultural_support', label: 'Cultural Support' },
    { value: 'community_service', label: 'Community Services' },
    { value: 'court_support', label: 'Court Support' },
    { value: 'mentoring', label: 'Mentoring' },
    { value: 'health_services', label: 'Health Services' },
    { value: 'employment', label: 'Employment Support' },
    { value: 'counselling', label: 'Counselling' },
    { value: 'psychology', label: 'Psychology' },
    { value: 'parenting', label: 'Parenting Support' },
    { value: 'vocational_education', label: 'Vocational Education' },
    { value: 'youth_development', label: 'Youth Development' }
  ]

  const regionOptions = [
    // Queensland (Primary)
    { value: 'brisbane_major', label: 'Brisbane' },
    { value: 'gold coast_regional', label: 'Gold Coast' },
    { value: 'cairns_regional', label: 'Cairns' },
    { value: 'townsville', label: 'Townsville' },
    { value: 'toowoomba_regional', label: 'Toowoomba' },
    { value: 'mackay', label: 'Mackay' },
    { value: 'ipswich', label: 'Ipswich' },
    { value: 'logan', label: 'Logan' },
    { value: 'queensland', label: 'Queensland (Statewide)' },
    
    // National Cities
    { value: 'sydney_major', label: 'Sydney' },
    { value: 'melbourne_major', label: 'Melbourne' },
    { value: 'perth_major', label: 'Perth' },
    { value: 'adelaide_major', label: 'Adelaide' },
    { value: 'canberra_major', label: 'Canberra' },
    { value: 'hobart_major', label: 'Hobart' },
    { value: 'darwin_major', label: 'Darwin' },
    
    // Regional Areas
    { value: 'newcastle_regional', label: 'Newcastle' },
    { value: 'geelong_regional', label: 'Geelong' },
    { value: 'fremantle_regional', label: 'Fremantle' },
    { value: 'launceston_regional', label: 'Launceston' },
    { value: 'statewide', label: 'Multiple Locations' }
  ]

  const FilterSection = ({ title, children, sectionKey }) => (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="touch-target flex items-center justify-between w-full text-left"
      >
        <h3 className="text-mobile-sm font-medium text-gray-900">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="filter-group-mobile">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="filter-mobile">
      <div className="mobile-stack mb-6">
        <h2 className="text-mobile-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={() => onFiltersChange({
            categories: '',
            regions: '',
            min_age: '',
            max_age: '',
            youth_specific: false,
            indigenous_specific: false,
            funding_level: '',
            funded_only: false,
            limit: 20,
            offset: 0
          })}
          className="touch-target text-mobile-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
        >
          <X className="w-4 h-4" />
          <span>Clear all</span>
        </button>
      </div>

      <div className="form-mobile">
        {/* Categories */}
        <FilterSection title="Service Categories" sectionKey="categories">
          <div className="form-group-mobile">
            <label className="block text-mobile-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              value={filters.categories}
              onChange={(e) => handleFilterChange('categories', e.target.value)}
              className="input-field"
              disabled={loading}
            >
              <option value="">All service types</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {filters.categories && (
            <button
              onClick={() => clearFilter('categories')}
              className="touch-target text-mobile-xs text-primary-600 hover:text-primary-700"
            >
              Clear category
            </button>
          )}
        </FilterSection>

        {/* Location */}
        <FilterSection title="Location" sectionKey="location">
          <div className="form-group-mobile">
            <label className="block text-mobile-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              value={filters.regions}
              onChange={(e) => handleFilterChange('regions', e.target.value)}
              className="input-field"
              disabled={loading}
            >
              <option value="">All regions</option>
              {regionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {filters.regions && (
            <button
              onClick={() => clearFilter('regions')}
              className="touch-target text-mobile-xs text-primary-600 hover:text-primary-700"
            >
              Clear region
            </button>
          )}
        </FilterSection>

        {/* Demographics */}
        <FilterSection title="Age Range" sectionKey="demographics">
          <div className="form-row-mobile">
            <div className="form-group-mobile">
              <label className="block text-mobile-sm font-medium text-gray-700 mb-1">
                Min Age
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={filters.min_age}
                onChange={(e) => handleFilterChange('min_age', e.target.value)}
                placeholder="10"
                className="input-field"
                disabled={loading}
              />
            </div>
            <div className="form-group-mobile">
              <label className="block text-mobile-sm font-medium text-gray-700 mb-1">
                Max Age
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={filters.max_age}
                onChange={(e) => handleFilterChange('max_age', e.target.value)}
                placeholder="25"
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          {(filters.min_age || filters.max_age) && (
            <button
              onClick={() => {
                clearFilter('min_age')
                clearFilter('max_age')
              }}
              className="touch-target text-mobile-xs text-primary-600 hover:text-primary-700"
            >
              Clear age range
            </button>
          )}
        </FilterSection>

        {/* Special Populations */}
        <FilterSection title="Special Populations" sectionKey="populations">
          <div className="filter-group-mobile">
            <label className="touch-target flex items-center">
              <input
                type="checkbox"
                checked={filters.youth_specific}
                onChange={(e) => handleFilterChange('youth_specific', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={loading}
              />
              <span className="ml-3 text-mobile-sm text-gray-700">
                Youth-specific services only
              </span>
            </label>

            <label className="touch-target flex items-center">
              <input
                type="checkbox"
                checked={filters.indigenous_specific}
                onChange={(e) => handleFilterChange('indigenous_specific', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={loading}
              />
              <span className="ml-3 text-mobile-sm text-gray-700">
                Indigenous-specific services only
              </span>
            </label>
          </div>

          {(filters.youth_specific || filters.indigenous_specific) && (
            <button
              onClick={() => {
                clearFilter('youth_specific')
                clearFilter('indigenous_specific')
              }}
              className="touch-target text-mobile-xs text-primary-600 hover:text-primary-700"
            >
              Clear population filters
            </button>
          )}
        </FilterSection>

        {/* Government Funding */}
        <FilterSection title="Government Funding" sectionKey="funding" icon={DollarSign}>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.funded_only}
                onChange={(e) => handleFilterChange('funded_only', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">
                Government funded services only
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Level
              </label>
              <select
                value={filters.funding_level}
                onChange={(e) => handleFilterChange('funding_level', e.target.value)}
                className="input-field text-sm"
                disabled={loading}
              >
                <option value="">All funding levels</option>
                {Object.entries(governmentSpending.fundingLevels).map(([key, level]) => (
                  <option key={key} value={key}>
                    {level.label} ({key === 'major' ? '$5M+' : 
                     key === 'significant' ? '$1M+' : 
                     key === 'moderate' ? '$500K+' : 
                     key === 'limited' ? '$100K+' : 'Under $100K'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(filters.funded_only || filters.funding_level) && (
            <button
              onClick={() => {
                clearFilter('funded_only')
                clearFilter('funding_level')
              }}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Clear funding filters
            </button>
          )}
        </FilterSection>
      </div>

      {/* Apply Button for Mobile */}
      <div className="mt-6 lg:hidden">
        <button
          onClick={() => {
            // Trigger search on mobile
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="w-full btn-primary"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  )
}