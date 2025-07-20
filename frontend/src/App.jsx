import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'))
const SearchPage = React.lazy(() => import('./pages/SearchPage'))
const ServiceDetailPage = React.lazy(() => import('./pages/ServiceDetailPage'))
const AboutPage = React.lazy(() => import('./pages/AboutPage'))
const DataDownloadPage = React.lazy(() => import('./pages/DataDownloadPage'))
const SpendingAnalysisPage = React.lazy(() => import('./pages/SpendingAnalysisPage'))
const BudgetDashboard = React.lazy(() => import('./pages/BudgetDashboard'))

function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/data" element={<DataDownloadPage />} />
          <Route path="/spending" element={<SpendingAnalysisPage />} />
          <Route path="/budget" element={<BudgetDashboard />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App