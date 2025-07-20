import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icon for services
const createServiceIcon = (category) => {
  const colors = {
    legal_aid: '#dc2626',
    mental_health: '#059669',
    housing: '#7c3aed',
    crisis_support: '#ea580c',
    education_training: '#2563eb',
    substance_abuse: '#be185d',
    family_support: '#0891b2',
    default: '#6b7280'
  }

  const color = colors[category] || colors.default

  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 12px;
          height: 12px;
          background-color: white;
          border-radius: 50%;
          position: absolute;
          top: 4px;
          left: 4px;
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  })
}

// Component to fit map bounds to markers
function MapBounds({ services }) {
  const map = useMap()

  useEffect(() => {
    if (services.length > 0) {
      const validServices = services.filter(service => 
        service.location?.coordinates?.lat && service.location?.coordinates?.lng
      )

      if (validServices.length > 0) {
        const bounds = L.latLngBounds(
          validServices.map(service => [
            service.location.coordinates.lat,
            service.location.coordinates.lng
          ])
        )
        
        if (validServices.length === 1) {
          // If only one service, center on it with a reasonable zoom
          const service = validServices[0]
          map.setView([service.location.coordinates.lat, service.location.coordinates.lng], 13)
        } else {
          // Fit bounds with padding
          map.fitBounds(bounds, { padding: [20, 20] })
        }
      }
    }
  }, [services, map])

  return null
}

export default function ServiceMap({ services = [], onServiceSelect, className = "" }) {
  const mapRef = useRef()

  // Queensland default center
  const defaultCenter = [-27.4698, 153.0251] // Brisbane
  const defaultZoom = 7

  const formatPhoneNumber = (phone) => {
    if (!phone) return null
    if (Array.isArray(phone) && phone.length > 0) {
      return phone[0].number || phone[0]
    }
    return phone
  }

  const getCategoryBadgeColor = (categories) => {
    if (!categories || categories.length === 0) return 'bg-gray-100 text-gray-800'
    
    const category = categories[0]
    const colors = {
      legal_aid: 'bg-red-100 text-red-800',
      mental_health: 'bg-green-100 text-green-800',
      housing: 'bg-purple-100 text-purple-800',
      crisis_support: 'bg-orange-100 text-orange-800',
      education_training: 'bg-blue-100 text-blue-800',
      substance_abuse: 'bg-pink-100 text-pink-800',
      family_support: 'bg-cyan-100 text-cyan-800'
    }
    
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const validServices = services.filter(service => 
    service.location?.coordinates?.lat && service.location?.coordinates?.lng
  ).map(service => ({
    ...service,
    location: {
      ...service.location,
      coordinates: {
        lat: parseFloat(service.location.coordinates.lat),
        lng: parseFloat(service.location.coordinates.lng)
      }
    }
  }))

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        ref={mapRef}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds services={validServices} />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount()
            let size = 'small'
            if (count >= 100) size = 'large'
            else if (count >= 10) size = 'medium'
            
            return L.divIcon({
              html: `<div><span>${count}</span></div>`,
              className: `marker-cluster marker-cluster-${size}`,
              iconSize: L.point(40, 40, true)
            })
          }}
        >
          {validServices.map((service) => (
            <Marker
              key={service.id}
              position={[service.location.coordinates.lat, service.location.coordinates.lng]}
              icon={createServiceIcon(service.categories?.[0])}
              eventHandlers={{
                click: () => {
                  if (onServiceSelect) {
                    onServiceSelect(service)
                  }
                },
              }}
            >
            <Popup className="service-popup" maxWidth={300}>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900 mb-2 leading-tight">
                  {service.name}
                </h3>
                
                {service.categories && service.categories.length > 0 && (
                  <div className="mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(service.categories)}`}>
                      {service.categories[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                )}

                {service.organization?.name && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Organization:</strong> {service.organization.name}
                  </p>
                )}

                {service.location?.address && (
                  <p className="text-sm text-gray-600 mb-2 flex items-start space-x-1">
                    <MapPin className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span>{service.location.address}</span>
                  </p>
                )}

                {service.contact && (
                  <div className="space-y-1 mb-2">
                    {formatPhoneNumber(service.contact.phone) && (
                      <p className="text-sm text-gray-600 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <a 
                          href={`tel:${formatPhoneNumber(service.contact.phone)}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {formatPhoneNumber(service.contact.phone)}
                        </a>
                      </p>
                    )}
                    
                    {service.contact.email && (
                      <p className="text-sm text-gray-600 flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <a 
                          href={`mailto:${service.contact.email}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {service.contact.email}
                        </a>
                      </p>
                    )}
                  </div>
                )}

                {service.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {service.description.length > 100 
                      ? `${service.description.substring(0, 100)}...` 
                      : service.description
                    }
                  </p>
                )}

                <button
                  onClick={() => window.open(`/service/${service.id}`, '_blank')}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-3 rounded flex items-center justify-center space-x-1 transition-colors duration-200"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-xs">
        <h4 className="font-medium text-gray-900 mb-2 text-sm">Service Types</h4>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {[
            { category: 'legal_aid', label: 'Legal Aid', color: '#dc2626' },
            { category: 'mental_health', label: 'Mental Health', color: '#059669' },
            { category: 'housing', label: 'Housing', color: '#7c3aed' },
            { category: 'crisis_support', label: 'Crisis Support', color: '#ea580c' },
            { category: 'education_training', label: 'Education', color: '#2563eb' },
            { category: 'family_support', label: 'Family Support', color: '#0891b2' }
          ].map(({ category, label, color }) => (
            <div key={category} className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2 z-10">
        <span className="text-sm font-medium text-gray-900">
          {validServices.length} service{validServices.length !== 1 ? 's' : ''} on map
        </span>
      </div>
    </div>
  )
}