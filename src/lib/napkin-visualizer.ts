/**
 * Utility to generate Napkin AI prompts from JusticeHub content.
 * Designed to help users quickly create visuals for Case Studies.
 */

interface StoryData {
    title: string;
    excerpt?: string;
    category?: string;
    location?: string;
    metrics?: string;
    evidence_level?: string;
}

export function generateNapkinPrompt(story: StoryData): string {
    const { title, excerpt, category, location, metrics, evidence_level } = story;

    return `
Create a SIMPLE, HAND-DRAWN illustration for a REAL-WORLD case study: "${title}"

DATA ANCHORS (USE THESE TO DRAW REAL ELEMENTS):
- Location: ${location || 'Community-based'}
- Key Metric: ${metrics || 'Impact verified by community'}
- Evidence Level: ${evidence_level || 'Promising'}
- Summary: ${excerpt || 'A journey of transformation.'}

VISUAL STYLE (AUTHENTIC & SIMPLE):
- Style: AUTHENTIC FIELD SKETCH
- Execution: Minimalist hand-drawn lines on textured paper
- Color Palette: Soft Ochre, Sand, Sage Green
- Layout: A simple vertical "Drawn List" (1, 2, 3)

REAL ELEMENTS TO DRAW:
1. THE START: A simple sketch of ${location || 'the community'} context.
2. THE EVIDENCE: A hand-drawn representation of the ${evidence_level || 'verified'} data.
3. THE RESULT: A simple sketch showing the ${metrics || 'benefit'} achieved.

GOAL:
Avoid corporate icons. Every element should look like it was drawn by a human hand to represent a real person's journey. Use simple labels for the numbers and names.
`.trim();
}

/**
 * Copies the prompt to clipboard and provides feedback.
 */
export async function copyNapkinPrompt(story: any) {
    const prompt = generateNapkinPrompt(story);
    try {
        await navigator.clipboard.writeText(prompt);
        return true;
    } catch (err) {
        console.error('Failed to copy Napkin prompt:', err);
        return false;
    }
}
