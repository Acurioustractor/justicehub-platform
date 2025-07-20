'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { importStoriesFromEmpathyLedger, exportStoriesToEmpathyLedger } from '@/lib/empathy-ledger/integration'

export default function EmpathyLedgerSettings() {
  const [organization, setOrganization] = useState<any>(null)
  const [empathyLedgerConfig, setEmpathyLedgerConfig] = useState({
    apiKey: '',
    baseUrl: 'https://api.empathyledger.org',
    projectId: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth/login')
          return
        }
        
        // Get user data
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (!userData || (userData.role !== 'org_admin' && userData.role !== 'platform_admin')) {
          router.push('/dashboard')
          return
        }
        
        // Get user's organization
        const { data: membership } = await supabase
          .from('org_memberships')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .single()
        
        if (!membership) {
          setError('You are not a member of any organization')
          setLoading(false)
          return
        }
        
        // Get organization data
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membership.organization_id)
          .single()
        
        if (!orgData) {
          setError('Organization not found')
          setLoading(false)
          return
        }
        
        setOrganization(orgData)
        
        // Set Empathy Ledger config if exists
        if (orgData.settings?.empathyLedger) {
          setEmpathyLedgerConfig({
            apiKey: orgData.settings.empathyLedger.apiKey || '',
            baseUrl: orgData.settings.empathyLedger.baseUrl || 'https://api.empathyledger.org',
            projectId: orgData.settings.empathyLedger.projectId || ''
          })
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('An error occurred while loading organization data')
        setLoading(false)
      }
    }
    
    fetchData()
  }, [router])
  
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSaving(true)
    
    try {
      const settings = {
        ...(organization.settings || {}),
        empathyLedger: empathyLedgerConfig
      }
      
      const { error } = await supabase
        .from('organizations')
        .update({
          settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id)
      
      if (error) {
        throw error
      }
      
      setMessage('Empathy Ledger configuration saved successfully')
    } catch (err: any) {
      console.error('Error saving config:', err)
      setError(err.message || 'An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }
  
  const handleImport = async () => {
    setError(null)
    setMessage(null)
    setImporting(true)
    
    try {
      const result = await importStoriesFromEmpathyLedger(organization.id)
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      setMessage(result.message)
    } catch (err: any) {
      console.error('Error importing:', err)
      setError(err.message || 'An error occurred during import')
    } finally {
      setImporting(false)
    }
  }
  
  const handleExport = async () => {
    setError(null)
    setMessage(null)
    setExporting(true)
    
    try {
      const result = await exportStoriesToEmpathyLedger(organization.id)
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      setMessage(result.message)
    } catch (err: any) {
      console.error('Error exporting:', err)
      setError(err.message || 'An error occurred during export')
    } finally {
      setExporting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Empathy Ledger settings...</p>
      </div>
    )
  }
  
  if (error && !organization) {
    return (
      <Card>
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600 mb-6">{error}</p>
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </Card>
    )
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Empathy Ledger Integration</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">What is Empathy Ledger?</h2>
        <p className="text-gray-600 mb-4">
          Empathy Ledger is a centralized system that aggregates storytelling data across multiple projects and organizations. 
          It provides analytics, insights, and a shared repository for stories, enabling cross-project collaboration and research.
        </p>
        <p className="text-gray-600">
          By connecting JusticeHub to Empathy Ledger, you can import stories from other projects and export your stories to the shared repository,
          contributing to a broader understanding of youth experiences and needs.
        </p>
      </Card>
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={empathyLedgerConfig.apiKey}
              onChange={(e) => setEmpathyLedgerConfig({ ...empathyLedgerConfig, apiKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-1">
              API Base URL
            </label>
            <input
              id="baseUrl"
              type="text"
              value={empathyLedgerConfig.baseUrl}
              onChange={(e) => setEmpathyLedgerConfig({ ...empathyLedgerConfig, baseUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
              Project ID
            </label>
            <input
              id="projectId"
              type="text"
              value={empathyLedgerConfig.projectId}
              onChange={(e) => setEmpathyLedgerConfig({ ...empathyLedgerConfig, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </form>
        
        {organization?.settings?.empathyLedger?.last_sync && (
          <div className="mt-4 text-sm text-gray-600">
            Last import: {new Date(organization.settings.empathyLedger.last_sync).toLocaleString()}
          </div>
        )}
        
        {organization?.settings?.empathyLedger?.last_export && (
          <div className="mt-1 text-sm text-gray-600">
            Last export: {new Date(organization.settings.empathyLedger.last_export).toLocaleString()}
          </div>
        )}
      </Card>
      
      <Card>
        <h2 className="text-xl font-semibold mb-4">Data Synchronization</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Import Stories</h3>
            <p className="text-gray-600 mb-3">
              Import stories from the Empathy Ledger repository into your JusticeHub organization.
            </p>
            <Button 
              onClick={handleImport} 
              disabled={importing || !empathyLedgerConfig.apiKey || !empathyLedgerConfig.projectId}
            >
              {importing ? 'Importing...' : 'Import Stories'}
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Export Stories</h3>
            <p className="text-gray-600 mb-3">
              Export your organization's stories to the Empathy Ledger repository.
            </p>
            <Button 
              onClick={handleExport} 
              disabled={exporting || !empathyLedgerConfig.apiKey || !empathyLedgerConfig.projectId}
            >
              {exporting ? 'Exporting...' : 'Export Stories'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}