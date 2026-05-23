import { callBackgroundLLM } from './model-router';

const PROMPT_TEMPLATE = `
You are an expert political rhetoric analyst specializing in Australian Youth Justice discourse.
Analyze the following excerpt from a parliamentary speech and classify its primary rhetoric stance into ONE of three categories:
1. "stance:punitive" - The speech emphasizes punishment, detention, being "tough on crime", cracking down on offenders, or increasing penalties.
2. "stance:rehabilitative" - The speech emphasizes alternatives to detention, diversion, community-based solutions, early intervention, or the root causes of crime.
3. "stance:neutral" - The speech is purely procedural or discusses youth justice without a strong punitive or rehabilitative leaning.

In addition to the stance, identify up to 3 core topics explicitly mentioned, formatted as "topic:word". For example: "topic:bail", "topic:detention", "topic:diversion".

Speech Title: "{title}"
Speech Text: "{text}"

Return ONLY a JSON array of strings containing the stance and the topics. Do not include markdown formatting or explanations.
Example output: ["stance:punitive", "topic:bail", "topic:detention"]
`;

export async function tagRhetoric(title: string, text: string): Promise<string[]> {
  try {
    const prompt = PROMPT_TEMPLATE.replace('{title}', title).replace('{text}', text);
    const rawMatch = await callBackgroundLLM(prompt, { maxTokens: 200 });
    
    // Attempt to parse JSON array from raw text
    const cleanRaw = rawMatch.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanRaw);
    if (Array.isArray(parsed)) {
      return parsed.map((t) => String(t).toLowerCase());
    }
  } catch (err) {
    console.warn('[RhetoricTagger] Failed to tag speech.', err instanceof Error ? err.message : String(err));
  }
  
  return [];
}
