---
name: log-meeting
description: Log a Notion meeting to GHL — extracts attendees, outcomes, action items, then updates CRM contact with tags, notes, and follow-up tasks
user_invocable: true
---

# /log-meeting <notion-url>

Syncs a Notion meeting page to GHL CRM. Extracts the AI summary, identifies the contact, and updates their GHL record automatically.

## Usage

```
/log-meeting https://www.notion.so/acurioustractor/Meeting-Page-32cebcf981cf80cb8758c2f86dc08b09
```

Or just the page ID:
```
/log-meeting 32cebcf9-81cf-80cb-8758-c2f86dc08b09
```

## Steps

### 1. Fetch the Notion meeting page

Use the `mcp__claude_ai_Notion__notion-fetch` tool with the provided URL or page ID.

Extract from the page content:
- **Meeting title** — from the page title
- **Date** — from the `Date` property
- **AI Summary** — look for `<summary>` tag inside `<meeting-notes>`. This contains:
  - Action items (checklist)
  - Key discussion points (organized by topic)
- **Attendee info** — look for mentioned names, emails, organizations in the content

### 2. Identify the GHL contact

From the meeting content, identify the external contact (not Ben). Look for:
- Email addresses mentioned
- Organization names that map to known contacts
- Names in the meeting title

Then find them in GHL using the script pattern:

```bash
node --env-file=.env.local -e "
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;

async function main() {
  const res = await fetch(
    GHL_API_BASE + '/contacts/search/duplicate?locationId=' + locationId + '&email=' + encodeURIComponent('EMAIL_HERE'),
    { headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', Version: '2021-07-28' } }
  );
  const data = await res.json();
  console.log(JSON.stringify(data.contact ? { id: data.contact.id, name: data.contact.firstName + ' ' + data.contact.lastName, tags: data.contact.tags } : { error: 'not found' }));
}
main();
"
```

If the contact is NOT found in GHL, ask the user if they want to create them.

### 3. Build the meeting note

Condense the AI summary into a concise GHL note. Format:

```
Meeting [DATE] — [TITLE]

Key outcomes:
- [bullet 1]
- [bullet 2]
- [bullet 3]

Next action: [first action item from AI summary] by [date if available]
```

Keep it under 500 words. GHL notes should be scannable, not comprehensive — the full notes live in Notion.

### 4. Determine tags to add

Based on meeting content, add relevant tags. Choose from:
- `meeting-held` — always add this
- `venue-partner` — if they discussed hosting the container
- `brisbane` / `adelaide` / `perth` / `tennant-creek` / `sydney` — city-specific
- `funder` — if funding was discussed
- `co-design` — if they discussed co-designing content/rooms
- `media` — if media coverage was discussed
- `legal` — if legal sector engagement was discussed
- `indigenous-led` — if Indigenous-led programs/orgs discussed

Present the proposed tags to the user for approval before adding.

### 5. Update GHL

Run this script to add tags and note:

```bash
node --env-file=.env.local -e "
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const apiKey = process.env.GHL_API_KEY;
const contactId = 'CONTACT_ID_HERE';

async function main() {
  // Add tags
  const tagRes = await fetch(GHL_API_BASE + '/contacts/' + contactId + '/tags', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', Version: '2021-07-28' },
    body: JSON.stringify({ tags: [TAGS_ARRAY_HERE] })
  });
  console.log('Tags:', tagRes.ok);

  // Add note
  const noteRes = await fetch(GHL_API_BASE + '/contacts/' + contactId + '/notes', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', Version: '2021-07-28' },
    body: JSON.stringify({ body: 'NOTE_BODY_HERE' })
  });
  console.log('Note:', noteRes.ok);

  // Create follow-up task (7 days from meeting)
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const taskRes = await fetch(GHL_API_BASE + '/contacts/' + contactId + '/tasks', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', Version: '2021-07-28' },
    body: JSON.stringify({
      title: 'TASK_TITLE_HERE',
      dueDate: dueDate,
      completed: false
    })
  });
  console.log('Task:', taskRes.ok);
}
main();
"
```

### 6. Confirm to user

Report back:
- Contact found/updated: [name] ([email])
- Tags added: [list]
- Note logged: [first line]
- Follow-up task: [title] due [date]
- Link to full meeting notes in Notion

## Rules

- **Never send emails** from this skill. Only update CRM data.
- **Always show proposed tags** before adding them. Let the user confirm.
- **Keep GHL notes concise** — the full transcript stays in Notion.
- **Default follow-up: 7 days** unless the meeting notes specify a different timeline.
- If multiple external contacts attended, update ALL of them (confirm with user).
- If contact not in GHL, offer to create them with: name, email, tags `contained`, `justicehub`, `meeting-held`.
