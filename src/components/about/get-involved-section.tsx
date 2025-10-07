"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/section-heading";

const involvementOptions = [
  {
    id: "experience",
    title: "Experience the Containers",
    description: "Walk through all three containers and feel the transformation yourself",
    icon: "🚪",
    action: "Book Experience",
    commitment: "30 minutes",
    impact: "Personal transformation"
  },
  {
    id: "volunteer",
    title: "Volunteer Your Skills",
    description: "Support operations, facilitation, research, or community outreach",
    icon: "🤝",
    action: "Join Volunteers",
    commitment: "Flexible",
    impact: "Direct support"
  },
  {
    id: "invest",
    title: "Invest in Change",
    description: "Financial partnership to scale transformation globally",
    icon: "💰",
    action: "Explore Investment",
    commitment: "$50k+",
    impact: "Systemic change"
  },
  {
    id: "partner",
    title: "Organizational Partnership",
    description: "Bring CONTAINED to your community, organization, or jurisdiction",
    icon: "🏢",
    action: "Become Partner",
    commitment: "Long-term",
    impact: "Community transformation"
  },
  {
    id: "advocate",
    title: "Spread the Word",
    description: "Share the story, challenge the system, demand transformation",
    icon: "📢",
    action: "Start Advocating",
    commitment: "Your voice",
    impact: "Awareness building"
  },
  {
    id: "research",
    title: "Research Collaboration",
    description: "Academic partnerships to study and validate transformation outcomes",
    icon: "📊",
    action: "Collaborate",
    commitment: "Academic",
    impact: "Evidence base"
  }
];

export function GetInvolvedSection() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    role: "",
    message: "",
    involvementType: "",
    commitment: "",
    timeline: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // This would integrate with your Notion API or form handling system
    console.log("Form submitted:", { ...formData, involvementType: selectedOption });

    // Reset form
    setFormData({
      name: "",
      email: "",
      organization: "",
      role: "",
      message: "",
      involvementType: "",
      commitment: "",
      timeline: ""
    });
    setSelectedOption(null);

    // Show success message (you could use a toast notification here)
    alert("Thank you! We'll be in touch soon to discuss how you can be part of the transformation.");
  };

  const renderForm = () => {
    if (!selectedOption) return null;

    const option = involvementOptions.find(opt => opt.id === selectedOption);
    if (!option) return null;

    return (
      <div className="mt-8 p-8 rounded-3xl bg-gradient-to-br from-color-hope-green/10 to-color-warning-orange/10 border border-color-hope-green/30">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-3xl">{option.icon}</span>
            <h4 className="font-display text-xl uppercase tracking-tight text-color-hope-green">
              {option.title}
            </h4>
            <p className="text-white/80">
              {option.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-color-hope-green focus:outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-color-hope-green focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-white/80 mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-color-hope-green focus:outline-none"
                  placeholder="Your organization"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-white/80 mb-2">
                  Your Role
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-color-hope-green focus:outline-none"
                  placeholder="Your role or title"
                />
              </div>
            </div>

            {selectedOption === "volunteer" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="commitment" className="block text-sm font-medium text-white/80 mb-2">
                    Time Commitment
                  </label>
                  <select
                    id="commitment"
                    name="commitment"
                    value={formData.commitment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-color-hope-green focus:outline-none"
                  >
                    <option value="">Select availability</option>
                    <option value="1-2 hours/week">1-2 hours/week</option>
                    <option value="3-5 hours/week">3-5 hours/week</option>
                    <option value="5+ hours/week">5+ hours/week</option>
                    <option value="One-time project">One-time project</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium text-white/80 mb-2">
                    When can you start?
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-color-hope-green focus:outline-none"
                  >
                    <option value="">Select timeline</option>
                    <option value="Immediately">Immediately</option>
                    <option value="Within 2 weeks">Within 2 weeks</option>
                    <option value="Within a month">Within a month</option>
                    <option value="Within 3 months">Within 3 months</option>
                  </select>
                </div>
              </div>
            )}

            {selectedOption === "experience" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium text-white/80 mb-2">
                    Preferred Timing
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-color-hope-green focus:outline-none"
                  >
                    <option value="">Select preference</option>
                    <option value="Weekday morning">Weekday morning</option>
                    <option value="Weekday afternoon">Weekday afternoon</option>
                    <option value="Weekend">Weekend</option>
                    <option value="Evening">Evening</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="commitment" className="block text-sm font-medium text-white/80 mb-2">
                    Group Size
                  </label>
                  <select
                    id="commitment"
                    name="commitment"
                    value={formData.commitment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-color-hope-green focus:outline-none"
                  >
                    <option value="">Select group size</option>
                    <option value="Individual">Just me</option>
                    <option value="2-5 people">2-5 people</option>
                    <option value="6-15 people">6-15 people</option>
                    <option value="16+ people">16+ people</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-2">
                Tell us more about your interest
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-color-hope-green focus:outline-none resize-none"
                placeholder={
                  selectedOption === "experience"
                    ? "What draws you to experience CONTAINED? Any specific goals or questions?"
                    : selectedOption === "volunteer"
                    ? "What skills do you bring? What type of volunteer work interests you most?"
                    : selectedOption === "invest"
                    ? "Tell us about your investment interests and capacity."
                    : selectedOption === "partner"
                    ? "Describe your organization and how you envision partnership."
                    : selectedOption === "advocate"
                    ? "How do you plan to advocate? What platforms or communities do you have access to?"
                    : "Tell us about your research interests and institutional affiliation."
                }
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-lg bg-color-hope-green/20 text-color-hope-green border border-color-hope-green/30 hover:bg-color-hope-green/30 transition-colors font-semibold"
              >
                Submit Application
              </button>
              <button
                type="button"
                onClick={() => setSelectedOption(null)}
                className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <section id="get-involved" className="bg-color-container-steel py-24">
      <div className="mx-auto max-w-6xl px-6 space-y-12">
        <SectionHeading
          eyebrow="Join the Revolution"
          title="Get Involved"
          description="Revolution isn't a spectator sport. Whether you have 30 minutes or 30 years to give, there's a place for you in transforming how we treat young people."
          align="center"
        />

        {!selectedOption ? (
          <>
            {/* Involvement options grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {involvementOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-color-hope-green/30 transition-all text-left hover:scale-105"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{option.icon}</span>
                      <h3 className="font-semibold text-color-hope-green group-hover:text-color-warning-orange transition-colors">
                        {option.title}
                      </h3>
                    </div>

                    <p className="text-sm text-white/80 leading-relaxed">
                      {option.description}
                    </p>

                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <div className="space-y-1">
                        <div className="text-xs text-white/60">
                          <strong>Commitment:</strong> {option.commitment}
                        </div>
                        <div className="text-xs text-white/60">
                          <strong>Impact:</strong> {option.impact}
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-color-hope-green/20 text-color-hope-green text-xs font-semibold border border-color-hope-green/30 group-hover:bg-color-warning-orange/20 group-hover:text-color-warning-orange group-hover:border-color-warning-orange/30 transition-all">
                        {option.action}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Contact information */}
            <div className="grid gap-8 md:grid-cols-3 pt-12">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-color-hope-green/10 to-color-warning-orange/5 border border-color-hope-green/20">
                <div className="space-y-3">
                  <h4 className="font-semibold text-color-hope-green">
                    📧 General Inquiries
                  </h4>
                  <p className="text-sm text-white/80">
                    Questions about CONTAINED, booking experiences, or general information
                  </p>
                  <a
                    href="mailto:hello@acurioustractor.com"
                    className="inline-block text-sm text-color-hope-green hover:text-color-warning-orange transition-colors"
                  >
                    hello@acurioustractor.com
                  </a>
                </div>
              </div>

              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-color-warning-orange/10 to-color-hope-green/5 border border-color-warning-orange/20">
                <div className="space-y-3">
                  <h4 className="font-semibold text-color-warning-orange">
                    🤝 Partnerships
                  </h4>
                  <p className="text-sm text-white/80">
                    Organizational partnerships, sponsorships, and collaboration opportunities
                  </p>
                  <a
                    href="mailto:partnerships@acurioustractor.com"
                    className="inline-block text-sm text-color-warning-orange hover:text-color-hope-green transition-colors"
                  >
                    partnerships@acurioustractor.com
                  </a>
                </div>
              </div>

              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">
                    💰 Investment
                  </h4>
                  <p className="text-sm text-white/80">
                    Investment opportunities, funding discussions, and financial partnerships
                  </p>
                  <a
                    href="mailto:funding@acurioustractor.com"
                    className="inline-block text-sm text-white hover:text-color-hope-green transition-colors"
                  >
                    funding@acurioustractor.com
                  </a>
                </div>
              </div>
            </div>
          </>
        ) : (
          renderForm()
        )}

        {/* Call to action */}
        <div className="text-center space-y-4 pt-12">
          <h3 className="font-display text-xl uppercase tracking-tight text-color-hope-green">
            Ready to Change Everything?
          </h3>
          <p className="text-white/80 max-w-2xl mx-auto">
            Every revolution starts with people who refuse to accept that things have to stay the same.
            The question isn't whether change is possible - it's whether you'll be part of making it happen.
          </p>
        </div>
      </div>
    </section>
  );
}