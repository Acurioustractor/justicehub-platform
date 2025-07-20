'use client'

import { useState } from 'react'
import { Mic, Quote, Heart, Share2, Shield, AlertCircle } from 'lucide-react'

interface Story {
  id: string
  title: string
  excerpt: string
  content: string
  age?: number
  tags: string[]
  date: string
  readTime: string
  reactions: {
    hearts: number
    shares: number
  }
  isProtected: boolean
}

const stories: Story[] = [
  {
    id: '1',
    title: 'They Treated Me Like a Criminal Before I Ever Was One',
    excerpt: 'At 12 years old, I was arrested for being in a stolen car. I didn\'t steal it - I just needed somewhere safe to sleep.',
    content: `I was 12 when they first put me in handcuffs. Not because I hurt anyone, not because I stole anything, but because I was sleeping in a car that turned out to be stolen. I didn't know it was stolen - I just knew it was warmer than the park bench.

The police didn't ask why a 12-year-old was sleeping in cars. They didn't ask about my mum's boyfriend who hit me, or why I couldn't go home. They just saw a kid in a stolen car and decided I was a criminal.

In the watch house, I met real criminals for the first time. Men who taught me things no kid should know. I went in scared and alone. I came out angry and connected to people who would lead me deeper into trouble.

The system that was supposed to protect me introduced me to crime. Now I'm 17, and I've been in and out more times than I can count. Each time, they act surprised that I'm back. But where else was I supposed to go?

They spent $500,000 locking me up over 5 years. Imagine if they'd spent even $50,000 helping my family when I was 12.`,
    age: 17,
    tags: ['First Contact', 'Watch House', 'System Failure'],
    date: '2024-02-15',
    readTime: '3 min',
    reactions: { hearts: 847, shares: 231 },
    isProtected: true
  },
  {
    id: '2',
    title: 'Education Saved Me When Detention Nearly Destroyed Me',
    excerpt: 'I spent 2 years in detention centers. The only thing that saved me was a teacher who saw more in me than a case number.',
    content: `Everyone in detention called me a lost cause. Aboriginal kid, no dad, mum with addiction issues - they'd seen my story before. The guards, the youth workers, even some of the counselors had already written my ending.

But Ms. Chen hadn't.

She was the education officer who came in twice a week. While everyone else saw my anger as defiance, she saw it as intelligence with nowhere to go. She started bringing me books - not kids' books, but real books about history, about my people, about justice.

"You're not here because you're bad," she told me. "You're here because the system failed you. But you can choose what happens next."

She helped me get my Year 10 certificate inside. Then Year 11. When I got out, she connected me with a program that helped me finish Year 12. Now I'm in my second year of a social work degree.

I want to be the person for other kids that Ms. Chen was for me. Someone who sees their potential when the whole world has given up on them.

Last month, I went back to visit the detention center as part of my placement. Same walls, same smell, same scared kids. But now I'm on the other side, reaching through the bars with hope instead of despair.`,
    age: 21,
    tags: ['Education', 'Mentorship', 'Success Story', 'Indigenous'],
    date: '2024-01-28',
    readTime: '4 min',
    reactions: { hearts: 1243, shares: 445 },
    isProtected: true
  },
  {
    id: '3',
    title: 'The Day They Took Me From My Nan Changed Everything',
    excerpt: 'I wasn\'t a criminal at 11. I was a kid who missed her nan. But missing her landed me in youth detention.',
    content: `My nan raised me from when I was a baby. She was my whole world - taught me our language, our stories, kept me safe and loved. Then the department decided she was "too old" to care for me properly.

They put me with a foster family three hours away. Nice people, but strangers. I lasted two weeks before I ran. I just wanted to go home to nan.

They caught me at the bus station. Because I'd "absconded from care" and stolen $20 for the bus ticket, suddenly I was in the criminal system. An 11-year-old Aboriginal girl, treated like a dangerous criminal for wanting to go home.

In detention, I met girls who taught me to fight, to steal properly, to trust no one. I learned that hurting myself got me attention, that anger kept people away. I learned to survive in a place no child should have to survive.

I'm 16 now. I've been in seven different placements, detained four times. My nan passed away last year while I was locked up. They wouldn't let me go to her funeral.

All of this because they thought they knew better than my nan how to raise me. All of this because I took $20 to try to go home.

The system stole my childhood, my culture, and my nan's last years. And they call it "child protection."`,
    age: 16,
    tags: ['Child Protection', 'Indigenous', 'Family Separation', 'Cultural Loss'],
    date: '2024-02-20',
    readTime: '4 min',
    reactions: { hearts: 2105, shares: 823 },
    isProtected: true
  }
]

export default function YouthVoicesPage() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [showSupportModal, setShowSupportModal] = useState(false)

  const handleShare = (story: Story) => {
    const text = `"${story.excerpt}" - A young person's story from Queensland's youth justice system. Read more:`
    
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: text,
        url: window.location.href
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Mic className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Youth Voices</h1>
        </div>
        <p className="text-xl text-gray-600">
          First-person accounts from young people who've experienced Queensland's youth justice system
        </p>
      </div>

      {/* Content Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800">
              <strong>Content Warning:</strong> These stories contain descriptions of trauma, 
              violence, and systemic abuse. Reader discretion advised.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              All stories are shared with permission. Names and identifying details have been 
              changed to protect the young people and their families.
            </p>
          </div>
        </div>
      </div>

      {/* Stories */}
      <div className="space-y-8">
        {stories.map((story) => (
          <article
            key={story.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {story.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {story.age && <span>Age: {story.age}</span>}
                    <span>{story.date}</span>
                    <span>{story.readTime} read</span>
                  </div>
                </div>
                <Quote className="w-8 h-8 text-gray-300" />
              </div>

              <p className="text-lg text-gray-700 italic mb-4">
                "{story.excerpt}"
              </p>

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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
                    onClick={() => {
                      // Handle heart reaction
                    }}
                  >
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">{story.reactions.hearts}</span>
                  </button>
                  <button
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                    onClick={() => handleShare(story)}
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">{story.reactions.shares}</span>
                  </button>
                </div>
                <button
                  onClick={() => setSelectedStory(story)}
                  className="px-4 py-2 text-qld-maroon font-medium hover:bg-gray-50 rounded-lg transition"
                >
                  Read Full Story
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Story Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedStory.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {selectedStory.age && <span>Age: {selectedStory.age}</span>}
                    <span>{selectedStory.readTime} read</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="prose prose-lg max-w-none">
                {selectedStory.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                      <Heart className="w-5 h-5" />
                      Support This Story
                    </button>
                    <button
                      onClick={() => handleShare(selectedStory)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>
                  </div>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="text-qld-maroon hover:underline"
                  >
                    How to Help
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How You Can Help</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-qld-maroon mt-0.5">•</span>
                <span className="text-gray-700">Share these stories to raise awareness</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-qld-maroon mt-0.5">•</span>
                <span className="text-gray-700">Contact your MP demanding reform</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-qld-maroon mt-0.5">•</span>
                <span className="text-gray-700">Support organizations working with youth</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-qld-maroon mt-0.5">•</span>
                <span className="text-gray-700">Advocate for raising the age to 14</span>
              </li>
            </ul>
            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full px-4 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Every Story Matters</h2>
        <p className="mb-6 max-w-2xl mx-auto">
          These young people have bravely shared their experiences to create change. 
          Their stories are evidence of a system that punishes children instead of protecting them.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="px-6 py-3 bg-white text-qld-maroon rounded-lg font-medium hover:bg-gray-100 transition">
            Share Your Story
          </button>
          <button className="px-6 py-3 bg-white/20 text-white border border-white rounded-lg font-medium hover:bg-white/30 transition">
            Take Action
          </button>
        </div>
      </div>
    </div>
  )
}