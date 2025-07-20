'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function OrganizationSettings() {
  const [organization, setOrganization] = useState<any>(null)
  const [airtableConfig, setAirtableConfig] = useState({
    apiKey: '',
    baseId: '',
    tableId: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
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
        
        // Set Airtable config if exists
        if (orgData.airtable_config) {
          setAirtableConfig({
            apiKey: orgData.airtable_config.apiKey || '',
            baseId: orgData.airtable_config.baseId || '',
            tableId: orgData.airtable_config.tableId || ''
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
  
  const handleSaveAirtableConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          airtable_config: airtableConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id)
      
      if (error) {
        throw error
      }
      
      setMessage('Airtable configuration saved successfully')
    } catch (err: any) {
      console.error('Error saving config:', err)
      setError(err.message || 'An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }
  
  const handleSyncAirtable = async () => {
    setError(null)
    setMessage(null)
    setSyncing(true)
    
    try {
      const response = await fetch('/api/airtable/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId: organization.id
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Sync failed')
      }
      
      setMessage(data.message || 'Sync completed successfully')
    } catch (err: any) {
      console.error('Error syncing:', err)
      setError(err.message || 'An error occurred during sync')
    } finally {
      setSyncing(false)
    }
  }
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading organization settings...</p>
      </div>
    )
  }
  
  if (error && !organization) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Organization Settings</h1>
      
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
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">Organization Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={organization?.name || ''}
              readOnly
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={organization?.slug || ''}
              readOnly
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">Airtable Integration</h2>
        
        <form onSubmit={handleSaveAirtableConfig} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={airtableConfig.apiKey}
              onChange={(e) => setAirtableConfig({ ...airtableConfig, apiKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="baseId" className="block text-sm font-medium text-gray-700 mb-1">
              Base ID
            </label>
            <input
              id="baseId"
              type="text"
              value={airtableConfig.baseId}
              onChange={(e) => setAirtableConfig({ ...airtableConfig, baseId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="tableId" className="block text-sm font-medium text-gray-700 mb-1">
              Table ID
            </label>
            <input
              id="tableId"
              type="text"
              value={airtableConfig.tableId}
              onChange={(e) => setAirtableConfig({ ...airtableConfig, tableId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex justify-between">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            
            <button
              type="button"
              onClick={handleSyncAirtable}
              disabled={syncing || !airtableConfig.apiKey || !airtableConfig.baseId || !airtableConfig.tableId}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Stories Now'}
            </button>
          </div>
        </form>
        
        {organization?.airtable_config?.last_sync && (
          <div className="mt-4 text-sm text-gray-600">
            Last sync: {new Date(organization.airtable_config.last_sync).toLocaleString()}
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">Empathy Ledger Integration</h2>
        <p className="text-gray-600 mb-4">
          Connect to the Empathy Ledger system to share and aggregate storytelling data across multiple projects.
        </p>
        <Link 
          href="/dashboard/organization/empathy-ledger" 
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 inline-block"
        >
          Configure Empathy Ledger
        </Link>
      </div>
    </div>
  )
}