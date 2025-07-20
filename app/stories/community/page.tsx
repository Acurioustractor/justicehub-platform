'use client'

import { useState } from 'react'
import { Users, Heart, Home, TrendingDown, MapPin, Calendar, Quote } from 'lucide-react'

interface CommunityStory {
  id: string
  title: string
  location: string
  familySize: number
  yearsAffected: number
  story: string
  impacts: string[]
  quote: string
  quotePerson: string
  tags: string[]
}

const communityStories: CommunityStory[] = [
  {
    id: '1',
    title: 'The Ripple Effect: One Arrest, Three Generations Destroyed',
    location: 'Cairns',
    familySize: 12,
    yearsAffected: 8,
    story: `When 14-year-old David was arrested for the third time, his grandmother Mary collapsed. She'd been raising him and his four siblings since their mother's death, working two jobs to keep them together.

David's arrests meant Mary had to take unpaid leave for court dates. She lost her cleaning job at the hospital. Without that income, they fell behind on rent. The stress triggered her diabetes, leading to hospitalization.

While Mary was in hospital, David's younger siblings were placed in different foster homes across Queensland. The family that had stayed together through death and poverty was torn apart by the justice system.

David's 16-year-old sister dropped out of school to work, trying to get stable housing so she could apply for custody of the younger ones. His 12-year-old brother, traumatized by the separation, began acting out in his foster placement.

What started as petty theft by one troubled teenager cascaded into family separation, job loss, housing instability, educational disruption, and health crises affecting 12 people across three generations.`,
    impacts: [
      'Grandmother lost employment and housing',
      '4 siblings separated into foster care',
      'Sister forced to leave education',
      'Extended family relationships severed',
      '$280,000 in foster care costs',
      'Intergenerational trauma created'
    ],
    quote: "They took my grandson for stealing food, and ended up destroying our whole family. We were poor but we were together. Now we have nothing.",
    quotePerson: "Mary, Grandmother",
    tags: ['Indigenous', 'Foster Care', 'Housing', 'Employment']
  },
  {
    id: '2',
    title: 'Small Town, Big Consequences: When Youth Detention Breaks Communities',
    location: 'Charleville',
    familySize: 8,
    yearsAffected: 5,
    story: `In a town of 3,000 people, everyone knows everyone. When three teenagers were sent to detention in Brisbane, 750km away, the impact rippled through Charleville like a shockwave.

The Williamson family couldn't afford weekly trips to Brisbane for visits. Their son Jake, 15, spent six months without seeing family. His mother fell into deep depression. His father, a truck driver, took on dangerous extra shifts trying to pay for occasional visits, leading to a serious accident.

Jake's girlfriend, pregnant at 16, was left alone. The stress triggered premature labor. Their baby spent weeks in NICU, creating medical debt the teenage mother couldn't pay.

The local football team, already struggling for numbers, lost three players. The team folded, taking with it one of the few positive youth activities in town. Other teenagers, now with even fewer options, began getting into trouble.

The family's small business, a mechanical workshop, lost customers as the stigma of having a 'criminal family' spread. They closed after 23 years of operation, putting three more people out of work in a town with few jobs.`,
    impacts: [
      'Father permanently disabled from accident',
      'Mother on depression medication',
      'Teen pregnancy without support',
      'Local sports team disbanded',
      'Family business closed',
      'Community cohesion destroyed'
    ],
    quote: "Detention didn't just punish our son - it punished our whole town. We're still paying the price five years later.",
    quotePerson: "James, Father",
    tags: ['Rural', 'Economic Impact', 'Mental Health', 'Community']
  },
  {
    id: '3',
    title: 'The Hidden Victims: Siblings Left Behind',
    location: 'Logan',
    familySize: 6,
    yearsAffected: 10,
    story: `When 13-year-old Tara went to detention, her parents thought they were protecting their other children by not talking about it. They were wrong.

Tara's 8-year-old sister Emma began having nightmares, convinced she'd be 'taken away' too. Her school performance plummeted. She developed severe anxiety requiring years of therapy the family couldn't afford.

Her 10-year-old brother Liam was bullied relentlessly at school - kids called his family 'criminals' and excluded him. He began fighting back, starting his own path toward the justice system.

The 5-year-old twins didn't understand where their sister went. They were told she was 'at a special school.' When she returned, changed and traumatized, they were terrified of her violent outbursts.

Both parents took on extra work to pay legal fees, meaning less supervision for the remaining children. The family that had been close-knit became strangers living in the same house.

Ten years later, all four siblings have criminal records. What began as one child's crisis became a family legacy of justice system involvement spanning a decade.`,
    impacts: [
      'All siblings developed trauma responses',
      '3 of 4 siblings entered justice system',
      'Combined legal fees exceeded $50,000',
      "Parents' marriage ended in divorce",
      'Years of therapy for entire family',
      'Educational failure across all children'
    ],
    quote: "We tried to save our other kids by not talking about it. Instead, the silence destroyed them too. The system doesn't just take one child - it takes them all.",
    quotePerson: "Sandra, Mother",
    tags: ['Sibling Impact', 'Mental Health', 'Family Breakdown', 'Intergenerational']
  }
]

export default function CommunityPage() {
  const [selectedStory, setSelectedStory] = useState<CommunityStory | null>(null)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Community Impact</h1>
        </div>
        <p className="text-xl text-gray-600">
          When we lock up a child, we devastate a family and fracture a community
        </p>
      </div>

      {/* Impact Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <Heart className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">26</p>
          <p className="text-sm text-red-700">Average family members affected</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <Home className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-600">73%</p>
          <p className="text-sm text-amber-700">Families lose stable housing</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <TrendingDown className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">$84K</p>
          <p className="text-sm text-blue-700">Average family debt incurred</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600">4.2</p>
          <p className="text-sm text-purple-700">Siblings affected per youth detained</p>
        </div>
      </div>

      {/* Story Cards */}
      <div className="space-y-8">
        {communityStories.map((story) => (
          <div
            key={story.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
          >
            <div className="md:flex">
              <div className="md:flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{story.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {story.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {story.familySize} family members
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {story.yearsAffected} years affected
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-4">
                  {story.story}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Quote className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 italic mb-2">"{story.quote}"</p>
                      <p className="text-sm text-gray-600">— {story.quotePerson}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {story.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedStory(story)}
                  className="px-6 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
                >
                  Read Full Story
                </button>
              </div>

              <div className="md:w-80 bg-red-50 p-6 border-l border-red-200">
                <h4 className="font-bold text-red-900 mb-3">Ripple Effects</h4>
                <ul className="space-y-2">
                  {story.impacts.map((impact, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span className="text-red-700">{impact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Story Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedStory.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedStory.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {selectedStory.familySize} affected
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedStory.yearsAffected} years
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="prose prose-lg max-w-none mb-6">
                {selectedStory.story.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-red-900 mb-3">Community Impact Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedStory.impacts.map((impact, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span className="text-red-700">{impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <Quote className="w-8 h-8 text-gray-400 mb-3" />
                <p className="text-lg text-gray-700 italic mb-3">"{selectedStory.quote}"</p>
                <p className="text-gray-600">— {selectedStory.quotePerson}</p>
              </div>

              <button
                onClick={() => setSelectedStory(null)}
                className="w-full px-6 py-3 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
              >
                Close Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Communities Are Crying Out for Change</h2>
        <p className="mb-6 max-w-2xl mx-auto">
          Every youth detention destroys families, fractures communities, and perpetuates cycles of trauma. 
          The damage extends far beyond the individual child to entire neighborhoods and generations.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="px-6 py-3 bg-white text-qld-maroon rounded-lg font-medium hover:bg-gray-100 transition">
            Share These Stories
          </button>
          <button className="px-6 py-3 bg-white/20 text-white border border-white rounded-lg font-medium hover:bg-white/30 transition">
            Support Communities
          </button>
        </div>
      </div>
    </div>
  )
}