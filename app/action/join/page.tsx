'use client'

import { useState } from 'react'
import { Users, Calendar, MapPin, Heart, Shield, Megaphone, Mail, Phone, Globe } from 'lucide-react'

interface Organization {
  id: string
  name: string
  logo?: string
  description: string
  focus: string[]
  website: string
  email?: string
  phone?: string
  volunteer?: boolean
  donate?: boolean
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  type: 'rally' | 'meeting' | 'training' | 'fundraiser'
  description: string
  organizer: string
}

const organizations: Organization[] = [
  {
    id: '1',
    name: 'Justice Reform Initiative',
    description: 'Leading evidence-based criminal justice reform across Australia',
    focus: ['Policy Reform', 'Research', 'Advocacy'],
    website: 'https://justicereforminitiative.org.au',
    email: 'info@justicereform.org.au',
    volunteer: true,
    donate: true
  },
  {
    id: '2',
    name: 'Aboriginal and Torres Strait Islander Legal Service (ATSILS)',
    description: 'Providing culturally safe legal services and advocating for Indigenous justice',
    focus: ['Indigenous Rights', 'Legal Support', 'Youth Advocacy'],
    website: 'https://atsils.org.au',
    phone: '1800 012 255',
    volunteer: true,
    donate: true
  },
  {
    id: '3',
    name: 'Queensland Council of Social Service (QCOSS)',
    description: 'Peak body for social services advocating for vulnerable Queenslanders',
    focus: ['Social Justice', 'Policy', 'Community Services'],
    website: 'https://qcoss.org.au',
    email: 'info@qcoss.org.au',
    phone: '07 3004 6900',
    volunteer: false,
    donate: true
  },
  {
    id: '4',
    name: 'Youth Advocacy Centre',
    description: 'Protecting and promoting the rights of young people in Queensland',
    focus: ['Youth Rights', 'Legal Education', 'System Reform'],
    website: 'https://yac.net.au',
    email: 'admin@yac.net.au',
    phone: '07 3356 1002',
    volunteer: true,
    donate: true
  },
  {
    id: '5',
    name: 'Sisters Inside',
    description: 'Supporting women and girls affected by the criminal justice system',
    focus: ['Women\'s Rights', 'Prison Reform', 'Family Support'],
    website: 'https://sistersinside.com.au',
    email: 'admin@sistersinside.com.au',
    phone: '07 3844 5066',
    volunteer: true,
    donate: true
  },
  {
    id: '6',
    name: 'Amnesty International Queensland',
    description: 'Human rights organization campaigning to raise the age of criminal responsibility',
    focus: ['Human Rights', 'International Advocacy', 'Campaigns'],
    website: 'https://amnesty.org.au',
    volunteer: true,
    donate: true
  }
]

const upcomingEvents: Event[] = [
  {
    id: '1',
    title: 'Rally to Raise the Age',
    date: '2024-03-15',
    time: '12:00 PM',
    location: 'Parliament House, Brisbane',
    type: 'rally',
    description: 'Join thousands demanding Queensland raises the age of criminal responsibility to 14',
    organizer: 'Raise the Age Coalition'
  },
  {
    id: '2',
    title: 'Community Forum: Youth Justice Solutions',
    date: '2024-03-20',
    time: '6:30 PM',
    location: 'Brisbane City Hall',
    type: 'meeting',
    description: 'Hear from experts and affected families about evidence-based alternatives',
    organizer: 'QCOSS'
  },
  {
    id: '3',
    title: 'Advocate Training Workshop',
    date: '2024-03-25',
    time: '10:00 AM',
    location: 'Online via Zoom',
    type: 'training',
    description: 'Learn effective advocacy skills and how to engage with media and politicians',
    organizer: 'Justice Reform Initiative'
  }
]

const volunteerRoles = [
  {
    title: 'Data Analyst',
    description: 'Help analyze government data and create compelling visualizations',
    skills: ['Excel/Python', 'Statistics', 'Report Writing'],
    commitment: '5-10 hours/week'
  },
  {
    title: 'Social Media Coordinator',
    description: 'Manage campaigns and spread awareness on social platforms',
    skills: ['Content Creation', 'Scheduling', 'Analytics'],
    commitment: '3-5 hours/week'
  },
  {
    title: 'Community Organizer',
    description: 'Coordinate local events and build grassroots support',
    skills: ['Event Planning', 'Communication', 'Leadership'],
    commitment: '10-15 hours/week'
  },
  {
    title: 'Research Assistant',
    description: 'Support evidence gathering and policy development',
    skills: ['Research', 'Writing', 'Critical Analysis'],
    commitment: '5-10 hours/week'
  }
]

export default function JoinPage() {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [volunteerInterest, setVolunteerInterest] = useState('')
  const [email, setEmail] = useState('')

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle volunteer signup
    alert('Thank you for your interest! We\'ll be in touch soon.')
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Join the Movement</h1>
        </div>
        <p className="text-xl text-gray-600">
          Connect with organizations fighting for youth justice reform in Queensland
        </p>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-900">15,000+</p>
          <p className="text-sm text-blue-700">Active Supporters</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <Heart className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-900">250+</p>
          <p className="text-sm text-green-700">Volunteers</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-900">12</p>
          <p className="text-sm text-purple-700">Partner Organizations</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <Megaphone className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-900">47</p>
          <p className="text-sm text-amber-700">Active Campaigns</p>
        </div>
      </div>

      {/* Partner Organizations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Partner Organizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">{org.name}</h3>
              <p className="text-gray-600 mb-4">{org.description}</p>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Focus Areas:</p>
                <div className="flex flex-wrap gap-2">
                  {org.focus.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-qld-maroon hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                  </a>
                )}
                {org.email && (
                  <a
                    href={`mailto:${org.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Mail className="w-4 h-4" />
                    {org.email}
                  </a>
                )}
                {org.phone && (
                  <a
                    href={`tel:${org.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Phone className="w-4 h-4" />
                    {org.phone}
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                {org.volunteer && (
                  <button className="flex-1 px-4 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition">
                    Volunteer
                  </button>
                )}
                {org.donate && (
                  <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    Donate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.type === 'rally' ? 'bg-red-100 text-red-700' :
                      event.type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                      event.type === 'training' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {event.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{event.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString('en-AU', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span>{event.time}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Organized by {event.organizer}</p>
                </div>
                <button className="px-4 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition">
                  RSVP
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Volunteer Opportunities */}
      <section className="bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6">Volunteer Opportunities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {volunteerRoles.map((role, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">{role.title}</h3>
              <p className="text-sm opacity-90 mb-3">{role.description}</p>
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Skills Needed:</p>
                <div className="flex flex-wrap gap-2">
                  {role.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-white/20 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm opacity-75">Time: {role.commitment}</p>
            </div>
          ))}
        </div>

        {/* Volunteer Form */}
        <form onSubmit={handleVolunteerSubmit} className="max-w-md mx-auto">
          <h3 className="font-bold text-lg mb-4 text-center">Express Your Interest</h3>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg text-gray-900"
            />
            <select
              value={volunteerInterest}
              onChange={(e) => setVolunteerInterest(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-gray-900"
              required
            >
              <option value="">Select volunteer role...</option>
              {volunteerRoles.map((role, idx) => (
                <option key={idx} value={role.title}>{role.title}</option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-white text-qld-maroon rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Sign Me Up
            </button>
          </div>
        </form>
      </section>

      {/* Call to Action */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Every Voice Counts in the Fight for Justice
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Whether you have 5 minutes or 5 hours, there's a way for you to contribute. 
          Join thousands of Queenslanders demanding better for our youth.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="px-6 py-3 bg-qld-maroon text-white rounded-lg font-medium hover:bg-qld-maroon/90 transition">
            Sign the Petition
          </button>
          <button className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition">
            Share Your Story
          </button>
          <button className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition">
            Monthly Donation
          </button>
        </div>
      </div>
    </div>
  )
}