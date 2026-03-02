'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, X, Users, Award, Calendar } from 'lucide-react';

// --- Types ---

interface Session {
  id: string;
  program_name: string;
  session_type: string;
  session_date: string;
  location: string | null;
  duration_hours: number | null;
  staff_count: number | null;
  elder_present: boolean;
  participant_count: number | null;
  outcome_summary: string | null;
  photo_urls: string[] | null;
  grant_id: string | null;
}

interface Participant {
  id: string;
  participant_ref: string;
  age_range: string | null;
  gender_category: string | null;
  referral_source: string | null;
  engagement_status: string | null;
  consent_status: string | null;
}

interface Milestone {
  id: string;
  participant_ref: string | null;
  milestone_type: string;
  milestone_date: string;
  description: string | null;
  evidence: string | null;
}

interface Grant {
  id: string;
  grant_name: string;
}

// --- Constants ---

const SESSION_TYPES = [
  { value: 'gym', label: 'Gym' },
  { value: 'camp', label: 'Camp' },
  { value: 'school_visit', label: 'School Visit' },
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const AGE_RANGES = [
  { value: '0-12', label: '0-12' },
  { value: '13-17', label: '13-17' },
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45+', label: '45+' },
];

const GENDER_CATEGORIES = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'prefer_not_to_say', label: 'Prefer Not to Say' },
];

const REFERRAL_SOURCES = [
  { value: 'self', label: 'Self' },
  { value: 'school', label: 'School' },
  { value: 'community', label: 'Community' },
  { value: 'court', label: 'Court' },
  { value: 'police', label: 'Police' },
  { value: 'family', label: 'Family' },
  { value: 'health', label: 'Health Service' },
  { value: 'other', label: 'Other' },
];

const CONSENT_STATUSES = [
  { value: 'obtained', label: 'Obtained' },
  { value: 'pending', label: 'Pending' },
  { value: 'declined', label: 'Declined' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const MILESTONE_TYPES = [
  { value: 'attendance', label: 'Attendance' },
  { value: 'behaviour', label: 'Behaviour' },
  { value: 'education', label: 'Education' },
  { value: 'employment', label: 'Employment' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'health', label: 'Health' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' },
];

const ENGAGEMENT_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  graduated: 'bg-blue-100 text-blue-800',
  disengaged: 'bg-red-100 text-red-800',
};

const SESSION_TYPE_COLORS: Record<string, string> = {
  gym: 'bg-blue-100 text-blue-800',
  camp: 'bg-green-100 text-green-800',
  school_visit: 'bg-purple-100 text-purple-800',
  mentoring: 'bg-ochre-100 text-ochre-800',
  workshop: 'bg-yellow-100 text-yellow-800',
  event: 'bg-pink-100 text-pink-800',
  other: 'bg-gray-100 text-gray-800',
};

const MILESTONE_TYPE_COLORS: Record<string, string> = {
  attendance: 'bg-blue-100 text-blue-800',
  behaviour: 'bg-green-100 text-green-800',
  education: 'bg-purple-100 text-purple-800',
  employment: 'bg-ochre-100 text-ochre-800',
  cultural: 'bg-yellow-100 text-yellow-800',
  health: 'bg-pink-100 text-pink-800',
  legal: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800',
};

// --- Empty forms ---

const EMPTY_SESSION = {
  program_name: '',
  session_type: 'gym',
  session_date: '',
  location: '',
  duration_hours: '',
  staff_count: '',
  elder_present: false,
  participant_count: '',
  outcome_summary: '',
  photo_urls: '',
  grant_id: '',
};

const EMPTY_PARTICIPANT = {
  participant_ref: '',
  age_range: '13-17',
  gender_category: 'prefer_not_to_say',
  referral_source: 'self',
  consent_status: 'pending',
};

const EMPTY_MILESTONE = {
  participant_ref: '',
  milestone_type: 'attendance',
  milestone_date: '',
  description: '',
  evidence: '',
};

type SubTab = 'sessions' | 'participants' | 'milestones';

// --- Component ---

export function SessionsTab({ orgId }: { orgId: string }) {
  const [subTab, setSubTab] = useState<SubTab>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION);
  const [participantForm, setParticipantForm] = useState(EMPTY_PARTICIPANT);
  const [milestoneForm, setMilestoneForm] = useState(EMPTY_MILESTONE);

  const fetchData = useCallback(async (section: string) => {
    try {
      const res = await fetch(`/api/org-hub/${orgId}?section=${section}`);
      if (res.ok) {
        const data = await res.json();
        return data.items || [];
      }
    } catch {
      // silently fail
    }
    return [];
  }, [orgId]);

  const loadSubTab = useCallback(async (tab: SubTab) => {
    setLoading(true);
    if (tab === 'sessions') {
      const [sessionsData, grantsData] = await Promise.all([
        fetchData('sessions'),
        fetchData('grants'),
      ]);
      setSessions(sessionsData);
      setGrants(grantsData);
    } else if (tab === 'participants') {
      const data = await fetchData('participants');
      setParticipants(data);
    } else {
      const data = await fetchData('milestones');
      setMilestones(data);
    }
    setLoading(false);
  }, [fetchData]);

  useEffect(() => {
    loadSubTab(subTab);
  }, [subTab, loadSubTab]);

  const handleSaveSession = async () => {
    setSaving(true);
    try {
      const photoArray = sessionForm.photo_urls
        ? sessionForm.photo_urls.split(',').map((u) => u.trim()).filter(Boolean)
        : null;
      const res = await fetch(`/api/org-hub/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'sessions',
          action: 'create',
          data: {
            program_name: sessionForm.program_name,
            session_type: sessionForm.session_type,
            session_date: sessionForm.session_date || null,
            location: sessionForm.location || null,
            duration_hours: sessionForm.duration_hours ? parseFloat(sessionForm.duration_hours) : null,
            staff_count: sessionForm.staff_count ? parseInt(sessionForm.staff_count, 10) : null,
            elder_present: sessionForm.elder_present,
            participant_count: sessionForm.participant_count ? parseInt(sessionForm.participant_count, 10) : null,
            outcome_summary: sessionForm.outcome_summary || null,
            photo_urls: photoArray,
            grant_id: sessionForm.grant_id || null,
          },
        }),
      });
      if (res.ok) {
        setShowSessionModal(false);
        setSessionForm(EMPTY_SESSION);
        loadSubTab('sessions');
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleSaveParticipant = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'participants',
          action: 'create',
          data: {
            participant_ref: participantForm.participant_ref,
            age_range: participantForm.age_range || null,
            gender_category: participantForm.gender_category || null,
            referral_source: participantForm.referral_source || null,
            consent_status: participantForm.consent_status || null,
          },
        }),
      });
      if (res.ok) {
        setShowParticipantModal(false);
        setParticipantForm(EMPTY_PARTICIPANT);
        loadSubTab('participants');
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMilestone = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'milestones',
          action: 'create',
          data: {
            participant_ref: milestoneForm.participant_ref || null,
            milestone_type: milestoneForm.milestone_type,
            milestone_date: milestoneForm.milestone_date || null,
            description: milestoneForm.description || null,
            evidence: milestoneForm.evidence || null,
          },
        }),
      });
      if (res.ok) {
        setShowMilestoneModal(false);
        setMilestoneForm(EMPTY_MILESTONE);
        loadSubTab('milestones');
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const SUB_TABS = [
    { key: 'sessions' as SubTab, label: 'Sessions', icon: Calendar },
    { key: 'participants' as SubTab, label: 'Participants', icon: Users },
    { key: 'milestones' as SubTab, label: 'Milestones', icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSubTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 font-bold text-sm transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'bg-white border-2 border-black text-black hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div>
          {subTab === 'sessions' && (
            <button
              onClick={() => setShowSessionModal(true)}
              className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Log Session
            </button>
          )}
          {subTab === 'participants' && (
            <button
              onClick={() => setShowParticipantModal(true)}
              className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Participant
            </button>
          )}
          {subTab === 'milestones' && (
            <button
              onClick={() => setShowMilestoneModal(true)}
              className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Milestone
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* ===== SESSIONS PANEL ===== */}
          {subTab === 'sessions' && (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No sessions logged yet</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold">{session.program_name}</h4>
                        <p className="text-sm text-gray-500">
                          {session.session_date
                            ? new Date(session.session_date).toLocaleDateString()
                            : 'No date'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-bold ${
                          SESSION_TYPE_COLORS[session.session_type] || SESSION_TYPE_COLORS.other
                        }`}
                      >
                        {session.session_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {session.participant_count != null && (
                        <span>
                          <span className="font-medium">Participants:</span> {session.participant_count}
                        </span>
                      )}
                      {session.location && (
                        <span>
                          <span className="font-medium">Location:</span> {session.location}
                        </span>
                      )}
                      {session.elder_present && (
                        <span className="px-2 py-0.5 bg-ochre-100 text-ochre-800 text-xs font-bold">
                          Elder Present
                        </span>
                      )}
                      {session.duration_hours != null && (
                        <span>
                          <span className="font-medium">Duration:</span> {session.duration_hours}h
                        </span>
                      )}
                    </div>
                    {session.outcome_summary && (
                      <p className="text-sm text-gray-600 mt-2">{session.outcome_summary}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===== PARTICIPANTS PANEL ===== */}
          {subTab === 'participants' && (
            <div>
              {participants.length === 0 ? (
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No participants added yet</p>
                </div>
              ) : (
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-black bg-gray-50">
                        <th className="text-left p-3 font-bold">Ref</th>
                        <th className="text-left p-3 font-bold">Age Range</th>
                        <th className="text-left p-3 font-bold">Gender</th>
                        <th className="text-left p-3 font-bold">Referral Source</th>
                        <th className="text-left p-3 font-bold">Engagement</th>
                        <th className="text-left p-3 font-bold">Consent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((p) => (
                        <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3 font-medium">{p.participant_ref}</td>
                          <td className="p-3">{p.age_range || '-'}</td>
                          <td className="p-3">{p.gender_category?.replace('_', ' ') || '-'}</td>
                          <td className="p-3">{p.referral_source || '-'}</td>
                          <td className="p-3">
                            {p.engagement_status ? (
                              <span
                                className={`px-2 py-1 text-xs font-bold ${
                                  ENGAGEMENT_COLORS[p.engagement_status] || ENGAGEMENT_COLORS.inactive
                                }`}
                              >
                                {p.engagement_status}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3">{p.consent_status || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== MILESTONES PANEL ===== */}
          {subTab === 'milestones' && (
            <div className="space-y-4">
              {milestones.length === 0 ? (
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No milestones recorded yet</p>
                </div>
              ) : (
                milestones.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-500">
                          {m.milestone_date
                            ? new Date(m.milestone_date).toLocaleDateString()
                            : 'No date'}
                        </p>
                        {m.participant_ref && (
                          <p className="text-sm font-medium text-gray-700">
                            Participant: {m.participant_ref}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-bold ${
                          MILESTONE_TYPE_COLORS[m.milestone_type] || MILESTONE_TYPE_COLORS.other
                        }`}
                      >
                        {m.milestone_type}
                      </span>
                    </div>
                    {m.description && <p className="text-sm text-gray-600">{m.description}</p>}
                    {m.evidence && (
                      <p className="text-xs text-gray-400 mt-1">Evidence: {m.evidence}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ===== LOG SESSION MODAL ===== */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b-2 border-black">
              <h3 className="text-lg font-black">Log Session</h3>
              <button onClick={() => setShowSessionModal(false)} className="p-1 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Program Name</label>
                <input
                  type="text"
                  value={sessionForm.program_name}
                  onChange={(e) => setSessionForm({ ...sessionForm, program_name: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Session Type</label>
                <select
                  value={sessionForm.session_type}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_type: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  {SESSION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Session Date</label>
                  <input
                    type="date"
                    value={sessionForm.session_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                    className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={sessionForm.duration_hours}
                    onChange={(e) => setSessionForm({ ...sessionForm, duration_hours: e.target.value })}
                    className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Location</label>
                <input
                  type="text"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Staff Count</label>
                  <input
                    type="number"
                    value={sessionForm.staff_count}
                    onChange={(e) => setSessionForm({ ...sessionForm, staff_count: e.target.value })}
                    className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Participant Count</label>
                  <input
                    type="number"
                    value={sessionForm.participant_count}
                    onChange={(e) => setSessionForm({ ...sessionForm, participant_count: e.target.value })}
                    className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="elder_present"
                  checked={sessionForm.elder_present}
                  onChange={(e) => setSessionForm({ ...sessionForm, elder_present: e.target.checked })}
                  className="w-5 h-5 border-2 border-black"
                />
                <label htmlFor="elder_present" className="text-sm font-bold">Elder Present</label>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Outcome Summary</label>
                <textarea
                  value={sessionForm.outcome_summary}
                  onChange={(e) => setSessionForm({ ...sessionForm, outcome_summary: e.target.value })}
                  rows={3}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Photo URLs (comma-separated)</label>
                <input
                  type="text"
                  value={sessionForm.photo_urls}
                  onChange={(e) => setSessionForm({ ...sessionForm, photo_urls: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  placeholder="https://..., https://..."
                />
              </div>
              {grants.length > 0 && (
                <div>
                  <label className="block text-sm font-bold mb-1">Grant (optional)</label>
                  <select
                    value={sessionForm.grant_id}
                    onChange={(e) => setSessionForm({ ...sessionForm, grant_id: e.target.value })}
                    className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  >
                    <option value="">None</option>
                    {grants.map((g) => (
                      <option key={g.id} value={g.id}>{g.grant_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t-2 border-black">
              <button
                onClick={() => setShowSessionModal(false)}
                className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                disabled={saving || !sessionForm.program_name}
                className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD PARTICIPANT MODAL ===== */}
      {showParticipantModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b-2 border-black">
              <h3 className="text-lg font-black">Add Participant</h3>
              <button onClick={() => setShowParticipantModal(false)} className="p-1 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Participant Reference</label>
                <input
                  type="text"
                  value={participantForm.participant_ref}
                  onChange={(e) => setParticipantForm({ ...participantForm, participant_ref: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  placeholder="e.g. P-001"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Age Range</label>
                <select
                  value={participantForm.age_range}
                  onChange={(e) => setParticipantForm({ ...participantForm, age_range: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  {AGE_RANGES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Gender Category</label>
                <select
                  value={participantForm.gender_category}
                  onChange={(e) => setParticipantForm({ ...participantForm, gender_category: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  {GENDER_CATEGORIES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Referral Source</label>
                <select
                  value={participantForm.referral_source}
                  onChange={(e) => setParticipantForm({ ...participantForm, referral_source: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  {REFERRAL_SOURCES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Consent Status</label>
                <select
                  value={participantForm.consent_status}
                  onChange={(e) => setParticipantForm({ ...participantForm, consent_status: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  {CONSENT_STATUSES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t-2 border-black">
              <button
                onClick={() => setShowParticipantModal(false)}
                className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveParticipant}
                disabled={saving || !participantForm.participant_ref}
                className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Participant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD MILESTONE MODAL ===== */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b-2 border-black">
              <h3 className="text-lg font-black">Add Milestone</h3>
              <button onClick={() => setShowMilestoneModal(false)} className="p-1 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Participant Reference</label>
                <input
                  type="text"
                  value={milestoneForm.participant_ref}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, participant_ref: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  placeholder="e.g. P-001"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Milestone Type</label>
                <select
                  value={milestoneForm.milestone_type}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_type: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  {MILESTONE_TYPES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Date</label>
                <input
                  type="date"
                  value={milestoneForm.milestone_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_date: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Description</label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  rows={3}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Evidence</label>
                <input
                  type="text"
                  value={milestoneForm.evidence}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, evidence: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                  placeholder="Link or description of evidence"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t-2 border-black">
              <button
                onClick={() => setShowMilestoneModal(false)}
                className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilestone}
                disabled={saving || !milestoneForm.milestone_type}
                className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
