import { NextResponse } from 'next/server';
import { SURFACES } from '@/lib/justice-matrix/surfaces';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

type Surface = 'all' | 'refugee' | 'youth';
type SourceKind = 'case' | 'campaign' | 'evidence';
type Audience = 'plain' | 'easy' | 'legal';
type Language = 'en' | 'es' | 'ar' | 'zh' | 'fr' | 'tok';

interface AskRequest {
  question?: string;
  surface?: Surface;
  history?: ChatMessage[];
  audience?: Audience;
  language?: Language;
}

interface ChatMessage {
  role?: 'user' | 'assistant';
  content?: string;
}

interface RawCase {
  kind: 'case';
  id: string;
  title: string;
  jurisdiction: string | null;
  year: number | null;
  court: string | null;
  excerpt: string | null;
  authoritative_link: string | null;
  verified: boolean | null;
  human_confirmed: boolean | null;
}

interface RawCampaign {
  kind: 'campaign';
  id: string;
  title: string;
  region: string | null;
  start_year: number | null;
  excerpt: string | null;
  lead_organizations: string | null;
  campaign_link: string | null;
}

interface RawEvidence {
  kind: 'evidence';
  id: string;
  title: string;
  jurisdiction: string | null;
  year: number | null;
  evidence_type: string | null;
  excerpt: string | null;
  organization: string | null;
  source_url: string | null;
  restricted: boolean;
}

type RawHit = RawCase | RawCampaign | RawEvidence;

interface Citation {
  id: string;
  label: string;
  kind: SourceKind;
  title: string;
  href: string;
  externalUrl: string | null;
  meta: string;
  excerpt: string | null;
  verified?: boolean | null;
  humanConfirmed?: boolean | null;
  restricted?: boolean;
}

interface SearchPayload {
  mode: 'keyword' | 'semantic';
  cases?: RawCase[];
  campaigns?: RawCampaign[];
  evidence?: RawEvidence[];
  total?: number;
}

interface ScoredHit {
  hit: RawHit;
  score: number;
  query: string;
  mode: string;
}

const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'against',
  'also',
  'another',
  'any',
  'are',
  'can',
  'could',
  'does',
  'for',
  'from',
  'have',
  'how',
  'into',
  'keep',
  'law',
  'legal',
  'people',
  'person',
  'should',
  'state',
  'states',
  'that',
  'the',
  'their',
  'them',
  'they',
  'this',
  'what',
  'when',
  'where',
  'which',
  'with',
  'would',
  'you',
]);

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  ar: 'Arabic',
  zh: 'Simplified Chinese',
  fr: 'French',
  tok: 'Tok Pisin',
};

const SHORT_ANSWER_LABELS: Record<Language, string> = {
  en: 'Short answer',
  es: 'Respuesta breve',
  ar: 'إجابة مختصرة',
  zh: '简短回答',
  fr: 'Réponse courte',
  tok: 'Sotpela bekim',
};

interface Provider {
  name: string;
  url: string;
  model: string;
  key: string;
}

const SYSTEM_PROMPT = `You are Ask the Matrix, a grounded research assistant for JusticeHub's Justice Matrix.

Use only the retrieved Matrix records provided by the API. Cite every substantive factual claim with bracket citations like [C1] or [C2]. If the records do not support an answer, say what is missing and suggest a better search.

Boundaries:
- This is research support and strategy orientation, not legal advice.
- Do not tell a user what legal action to take.
- Do not invent cases, campaigns, outcomes, holdings, source links, or facts.
- Treat dates before the current date as past. If a retrieved record describes a target date or expected reform that has already passed, say the record indicates that target date has passed and flag current legal status as something to verify from the linked source before relying on it.
- Prefer plain human language over policy abstractions.
- Treat each returned title, metadata block, source URL, and excerpt as a retrieved evidence chunk. Use only those chunks for factual claims.
- Do not start with "The provided records indicate" or "The records suggest". Start by answering the user's question.

Answer shape:
1. Start with the short-answer label requested in the answer plan and give a direct answer. For yes/no questions, begin with "Yes", "No", or "It depends", then explain the condition in one paragraph.
2. "Why" with 2-4 plain-language bullets, each cited.
3. "Useful records" with 3-6 bullets, each cited.
4. "What to check next" with practical research moves.
5. "Limits" with anything the corpus did not establish.`;

function currentDateLabel(): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function cleanQuestion(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, 500);
}

function cleanHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const role = (item as ChatMessage).role === 'assistant' ? 'assistant' : (item as ChatMessage).role === 'user' ? 'user' : null;
      const content = cleanQuestion((item as ChatMessage).content);
      return role && content ? { role, content: content.slice(0, 800) } : null;
    })
    .filter((item): item is ChatMessage => item !== null)
    .slice(-6);
}

function normaliseSurface(value: unknown): Surface {
  return value === 'refugee' || value === 'youth' ? value : 'all';
}

function normaliseAudience(value: unknown): Audience {
  return value === 'easy' || value === 'legal' ? value : 'plain';
}

function normaliseLanguage(value: unknown): Language {
  return value === 'es' || value === 'ar' || value === 'zh' || value === 'fr' || value === 'tok' ? value : 'en';
}

function audienceInstruction(audience: Audience): string {
  if (audience === 'easy') {
    return 'Use Easy English: short sentences, common words, one idea per sentence, explain legal words in brackets, and avoid long paragraphs.';
  }
  if (audience === 'legal') {
    return 'Use legally precise plain language: include jurisdiction limits, source limits, and key legal concepts, but keep the structure readable.';
  }
  return 'Use plain English for a general community audience: direct, practical, and not academic.';
}

function languageInstruction(language: Language): string {
  const label = LANGUAGE_LABELS[language];
  if (language === 'en') return 'Write in English.';
  return `Write the answer in ${label}. Keep citation labels like [C1] unchanged. Keep official case/report titles in their original language when needed, then explain them in ${label}.`;
}

function shortAnswerLabel(language: Language): string {
  return SHORT_ANSWER_LABELS[language] ?? SHORT_ANSWER_LABELS.en;
}

function addUnique(target: string[], value: string) {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length >= 3 && !target.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
    target.push(cleaned);
  }
}

function standaloneQuestion(question: string, history: ChatMessage[]): string {
  if (!history.length) return question;
  const lower = question.toLowerCase();
  const looksContextual =
    question.split(/\s+/).length <= 8 ||
    /\b(what about|and|that|those|there|same|it|they|them|this|which one|show me more|why)\b/.test(lower);
  if (!looksContextual) return question;
  const lastUser = [...history].reverse().find((item) => item.role === 'user')?.content;
  return lastUser ? `${lastUser} Follow-up: ${question}` : question;
}

function isYouthQuestion(value: string, surface: Surface): boolean {
  return (
    surface === 'youth' ||
    /\b(youth|child|children|boy|girl|juvenile|teen|remand|detention|watch\s*house|criminal responsibility|age of criminal)\b/i.test(
      value,
    )
  );
}

function isRefugeeQuestion(value: string, surface: Surface): boolean {
  return (
    surface === 'refugee' ||
    /\b(refugee|asylum|offshore|png|papua|third[-\s]?country|non[-\s]?refoulement|refoulement|deport|return|border|boat|immigration detention)\b/i.test(
      value,
    )
  );
}

function fallbackQueries(question: string, surface: Surface, history: ChatMessage[] = []): string[] {
  const combined = standaloneQuestion(question, history);
  const lower = combined.toLowerCase();
  const queries: string[] = [];

  if (isYouthQuestion(combined, surface)) {
    addUnique(queries, 'age of criminal responsibility');
    addUnique(queries, 'minimum age criminal responsibility');
    addUnique(queries, 'children remand');
    addUnique(queries, 'watch houses children');
    addUnique(queries, 'youth detention');
    addUnique(queries, 'raise the age');
    addUnique(queries, 'detention');
  }

  if (isRefugeeQuestion(combined, surface)) {
    addUnique(queries, 'non-refoulement');
    addUnique(queries, 'offshore detention');
    addUnique(queries, 'third country');
    addUnique(queries, 'third-country transfer');
    addUnique(queries, 'immigration detention');
    addUnique(queries, 'asylum');
    addUnique(queries, 'refugee');
  }

  const tokens = lower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));

  addUnique(queries, tokens.slice(0, 3).join(' '));
  for (const token of tokens.slice(0, 5)) addUnique(queries, token);

  return queries.slice(0, 10);
}

function textForHit(hit: RawHit): string {
  return [
    hit.title,
    hit.excerpt,
    hit.kind === 'case' ? hit.jurisdiction : null,
    hit.kind === 'case' ? hit.court : null,
    hit.kind === 'campaign' ? hit.region : null,
    hit.kind === 'campaign' ? hit.lead_organizations : null,
    hit.kind === 'evidence' ? hit.organization : null,
    hit.kind === 'evidence' ? hit.evidence_type : null,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function scoreHit(hit: RawHit, question: string, query: string, surface: Surface): number {
  const haystack = textForHit(hit);
  const q = question.toLowerCase();
  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
  let score = 0;

  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 3;
  }

  const boosts: Array<[RegExp, string[], number]> = [
    [/\b(10|ten|boy|girl|child|children)\b/, ['10', 'age', 'child', 'children', 'criminal responsibility'], 9],
    [/\bcriminal responsibility|age of criminal|minimum age\b/, ['criminal responsibility', 'age', 'minimum'], 9],
    [/\bwatch\s*house|watchhouse\b/, ['watch house', 'watch houses'], 8],
    [/\bremand\b/, ['remand'], 7],
    [/\byouth detention|detention\b/, ['youth detention', 'detention'], 5],
    [/\bnon[-\s]?refoulement|return|deport\b/, ['non-refoulement', 'return', 'deport'], 8],
    [/\boffshore|png|papua|third[-\s]?country\b/, ['offshore', 'png', 'papua', 'third country'], 8],
  ];

  for (const [questionPattern, terms, value] of boosts) {
    if (questionPattern.test(q) && terms.some((term) => haystack.includes(term))) score += value;
  }

  if (surface === 'youth' || isYouthQuestion(question, surface)) {
    if (hit.kind === 'case') score += 3;
    if (hit.kind === 'evidence') score += 2;
  }
  if (surface === 'refugee' || isRefugeeQuestion(question, surface)) {
    if (hit.kind === 'case') score += 3;
    if (hit.kind === 'campaign') score += 1;
  }
  if (hit.kind === 'case' && hit.verified) score += 2;
  return score;
}

function chooseProvider(): Provider | null {
  if (process.env.GEMINI_API_KEY) {
    return {
      name: 'gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-2.5-flash',
      key: process.env.GEMINI_API_KEY,
    };
  }
  if (process.env.GROQ_API_KEY) {
    return {
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      key: process.env.GROQ_API_KEY,
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      name: 'openai',
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      key: process.env.OPENAI_API_KEY,
    };
  }
  return null;
}

function hrefFor(hit: RawHit): string {
  if (hit.kind === 'case') return `/justice-matrix/cases/${hit.id}`;
  if (hit.kind === 'campaign') return `/justice-matrix/campaigns/${hit.id}`;
  return `/justice-matrix/evidence/${hit.id}`;
}

function metaFor(hit: RawHit): string {
  if (hit.kind === 'case') {
    return [hit.court, hit.jurisdiction, hit.year].filter(Boolean).join(' | ');
  }
  if (hit.kind === 'campaign') {
    return [hit.region, hit.start_year, hit.lead_organizations].filter(Boolean).join(' | ');
  }
  return [hit.jurisdiction ?? 'Australia', hit.year, hit.evidence_type, hit.organization].filter(Boolean).join(' | ');
}

function toCitation(hit: RawHit, index: number): Citation {
  const label = `C${index + 1}`;
  if (hit.kind === 'case') {
    return {
      id: hit.id,
      label,
      kind: 'case',
      title: hit.title,
      href: hrefFor(hit),
      externalUrl: hit.authoritative_link,
      meta: metaFor(hit),
      excerpt: hit.excerpt,
      verified: hit.verified,
      humanConfirmed: hit.human_confirmed,
    };
  }
  if (hit.kind === 'campaign') {
    return {
      id: hit.id,
      label,
      kind: 'campaign',
      title: hit.title,
      href: hrefFor(hit),
      externalUrl: hit.campaign_link,
      meta: metaFor(hit),
      excerpt: hit.excerpt,
    };
  }
  return {
    id: hit.id,
    label,
    kind: 'evidence',
    title: hit.title,
    href: hrefFor(hit),
    externalUrl: hit.source_url,
    meta: metaFor(hit),
    excerpt: hit.excerpt,
    restricted: hit.restricted,
  };
}

function orderedHits(payload: SearchPayload, surface: Surface): RawHit[] {
  const cases = payload.cases ?? [];
  const campaigns = payload.campaigns ?? [];
  const evidence = surface === 'refugee' ? [] : payload.evidence ?? [];
  const all: RawHit[] = [];
  const max = Math.max(cases.length, campaigns.length, evidence.length);

  for (let i = 0; i < max; i += 1) {
    if (cases[i]) all.push(cases[i]);
    if (campaigns[i]) all.push(campaigns[i]);
    if (evidence[i]) all.push(evidence[i]);
  }

  const seen = new Set<string>();
  return all.filter((hit) => {
    const key = `${hit.kind}:${hit.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildContext(citations: Citation[]): string {
  return citations
    .map((c) =>
      [
        `[${c.label}] ${c.kind.toUpperCase()}: ${c.title}`,
        `Route: ${c.href}`,
        c.externalUrl ? `Source: ${c.externalUrl}` : null,
        c.meta ? `Meta: ${c.meta}` : null,
        c.verified === true ? 'Trust: verified case, human confirmed when noted in metadata.' : null,
        c.restricted ? 'Consent: restricted evidence, title and provenance only.' : null,
        c.excerpt ? `Excerpt: ${c.excerpt}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n');
}

function directFrame(question: string, surface: Surface, audience: Audience = 'plain', language: Language = 'en'): string | null {
  if (isYouthQuestion(question, surface) && /\b(10|ten|boy|girl|child|children)\b/i.test(question)) {
    if (audience === 'easy') {
      if (language === 'es') {
        return [
          'Respuesta breve: Depende de dónde esté el niño.',
          '',
          'Australia no tiene una sola regla para todos los estados y territorios. Algunos lugares han subido la edad mínima. Otros lugares todavía pueden permitir que el sistema de justicia juvenil trate a un niño de 10 años.',
          '',
          'Por qué:',
          '- Primero hay que saber el estado o territorio.',
          '- Después hay que comprobar la edad mínima de responsabilidad penal. Eso significa la edad más baja en la que un niño puede ser acusado de un delito.',
          '- También hay que saber si el niño está en prisión preventiva, en una comisaría o en detención juvenil.',
        ].join('\n');
      }
      if (language === 'fr') {
        return [
          'Réponse courte: Cela dépend de l’endroit où se trouve l’enfant.',
          '',
          'L’Australie n’a pas une règle unique pour tous les États et territoires. Certains lieux ont relevé l’âge minimum. D’autres peuvent encore permettre au système de justice des mineurs de traiter un enfant de 10 ans.',
          '',
          'Pourquoi:',
          '- Il faut d’abord vérifier l’État ou le territoire.',
          '- Il faut ensuite vérifier l’âge minimum de responsabilité pénale. Cela veut dire l’âge le plus bas auquel un enfant peut être accusé d’une infraction.',
          '- Il faut aussi vérifier si l’enfant est en détention provisoire, dans un poste de police ou dans un centre de détention pour jeunes.',
        ].join('\n');
      }
      if (language === 'zh') {
        return [
          '简短回答: 这取决于孩子所在的州或领地。',
          '',
          '澳大利亚没有一条适用于所有州和领地的统一规则。有些地方已经提高了最低年龄。有些地方仍可能让青年司法系统处理10岁儿童。',
          '',
          '原因:',
          '- 先确认是哪个州或领地。',
          '- 再确认最低刑事责任年龄。意思是儿童可能被指控犯罪的最低年龄。',
          '- 还要确认儿童是在还押、警局看守所，还是青年拘留场所。',
        ].join('\n');
      }
      if (language === 'ar') {
        return [
          'إجابة مختصرة: يعتمد ذلك على مكان وجود الطفل.',
          '',
          'لا توجد في أستراليا قاعدة واحدة لكل ولاية وإقليم. بعض الأماكن رفعت الحد الأدنى للعمر. أما أماكن أخرى فقد لا يزال نظام عدالة الأحداث فيها يتعامل مع طفل عمره 10 سنوات.',
          '',
          'لماذا:',
          '- أول ما يجب التحقق منه هو الولاية أو الإقليم.',
          '- ثم يجب التحقق من الحد الأدنى لسن المسؤولية الجنائية. أي أصغر عمر يمكن فيه اتهام طفل بجريمة.',
          '- ويجب أيضا التحقق مما إذا كان الطفل في الحبس الاحتياطي أو في مركز شرطة أو في احتجاز الأحداث.',
        ].join('\n');
      }
      if (language === 'tok') {
        return [
          'Sotpela bekim: Em i dipen long wanem stet o teritori pikinini i stap long en.',
          '',
          'Australia i no gat wanpela rul tasol long olgeta ples. Sampela stet na teritori i apim minimu krismas. Long sampela narapela ples, sistem bilong yangpela kot inap yet long kisim wanpela pikinini i gat 10 krismas.',
          '',
          'Bilong wanem:',
          '- Namba wan samting em long painim wanem stet o teritori.',
          '- Namba tu em long painim minimu krismas bilong kriminal risponsibiliti. Dispela em liklik krismas tru we pikinini inap kisim kot long wanpela rong.',
          '- Na painim tu sapos pikinini i stap long remand, watch house, o youth detention.',
        ].join('\n');
      }
      return [
        'Short answer: It depends where the child is.',
        '',
        'Australia does not have one simple rule for every state and territory. Some places have raised the age when a child can be charged with a crime. Other places may still let the youth justice system deal with a 10-year-old.',
        '',
        'Why:',
        '- The first thing to check is the state or territory.',
        '- The second thing to check is the minimum age of criminal responsibility. That means the youngest age a child can be charged with a crime.',
        '- The third thing to check is whether the child is on remand, in a watch house, or in youth detention.',
      ].join('\n');
    }
    if (language === 'es') {
      return [
        'Respuesta breve: Depende del estado o territorio. Los registros de Matrix muestran que es un tema activo de justicia juvenil en Australia, pero no bastan por sí solos para dar una respuesta nacional única de sí o no.',
        '',
        'Por qué:',
        '- La pregunta clave es la edad mínima actual de responsabilidad penal en el estado o territorio correspondiente.',
        '- Los registros también apuntan a vías relacionadas con prisión preventiva, comisarías y detención juvenil.',
        '- Antes de depender de la respuesta, comprueba la ley vigente para esa jurisdicción y abre el registro fuente.',
      ].join('\n');
    }
    if (language === 'fr') {
      return [
        'Réponse courte: Cela dépend de l’État ou du territoire. Les dossiers Matrix montrent que c’est un enjeu actuel de justice des mineurs en Australie, mais ils ne suffisent pas à donner une seule réponse nationale oui/non.',
        '',
        'Pourquoi:',
        '- La question clé est l’âge minimum actuel de responsabilité pénale dans l’État ou le territoire concerné.',
        '- Les dossiers pointent aussi vers la détention provisoire, les postes de police et les conditions de détention des jeunes.',
        '- Avant de s’y fier, vérifie la loi actuelle pour la juridiction précise et lis le dossier source.',
      ].join('\n');
    }
    if (language === 'zh') {
      return [
        '简短回答: 这取决于州或领地。Matrix记录足以说明这是澳大利亚青年司法中的现实问题，但这些记录本身不足以给出一个全国统一的是或否答案。',
        '',
        '原因:',
        '- 关键问题是相关州或领地当前的最低刑事责任年龄。',
        '- 记录也指向还押、警局看守所和青年拘留条件等相关路径。',
        '- 在依赖答案前，请核实具体司法辖区的现行法律，并打开来源记录。',
      ].join('\n');
    }
    if (language === 'ar') {
      return [
        'إجابة مختصرة: يعتمد ذلك على الولاية أو الإقليم. تكفي سجلات Matrix لإظهار أن هذا موضوع قائم في عدالة الأحداث في أستراليا، لكنها لا تكفي وحدها لإعطاء جواب وطني واحد بنعم أو لا.',
        '',
        'لماذا:',
        '- السؤال الأساسي هو الحد الأدنى الحالي لسن المسؤولية الجنائية في الولاية أو الإقليم المعني.',
        '- تشير السجلات أيضا إلى مسارات مرتبطة بالحبس الاحتياطي ومراكز الشرطة وظروف احتجاز الأحداث.',
        '- قبل الاعتماد على الإجابة، تحقق من القانون الحالي في الاختصاص المحدد وافتح سجل المصدر.',
      ].join('\n');
    }
    if (language === 'tok') {
      return [
        'Sotpela bekim: Em i dipen long stet o teritori. Ol Matrix rekod i soim olsem dispela em wanpela bikpela youth justice isiu long Australia, tasol ol dispela rekod yet i no inap givim wanpela yes/no bekim bilong olgeta kantri.',
        '',
        'Bilong wanem:',
        '- Nambawan askim em minimu krismas bilong kriminal risponsibiliti long dispela stet o teritori.',
        '- Ol rekod i makim tu remand, watch house, na youth detention rot.',
        '- Bipo yu bihainim dispela bekim, sekim naupela lo bilong dispela ples na ritim source rekod.',
      ].join('\n');
    }
    return [
      'Short answer: It depends on the state or territory. The Matrix records are enough to show this is a live Australian youth-justice issue, but they are not enough by themselves to give one national yes/no answer. In a place where a 10-year-old is still within the criminal law, a child can be pulled into youth justice and detention pathways; in a place where the minimum age has been raised above 10, that should not happen through the criminal process.',
      '',
      'Why:',
      '- The key question is the current minimum age of criminal responsibility in the relevant state or territory.',
      '- The Matrix records also point to related detention pathways, including remand, watch houses, and youth detention conditions.',
      '- Before acting, verify the current law for the specific jurisdiction and read the linked source record.',
    ].join('\n');
  }
  if (isRefugeeQuestion(question, surface) && /\b(send|move|transfer|png|papua|third[-\s]?country|offshore)\b/i.test(question)) {
    if (language === 'es') {
      return [
        'Respuesta breve: Depende de la base legal, las garantías y el riesgo de devolución o daño. Matrix puede orientar el tema, pero no debe leerse como una respuesta final sobre la ley vigente.',
        '',
        'Por qué:',
        '- La no devolución suele depender de si la persona enfrentaría persecución, tortura, detención arbitraria o devolución posterior.',
        '- Las transferencias a terceros países necesitan hechos actuales sobre el país receptor y sobre la persona.',
        '- Antes de actuar, verifica la ley actual y los registros enlazados.',
      ].join('\n');
    }
    if (language === 'fr') {
      return [
        'Réponse courte: Cela dépend de la base légale, des garanties et du risque de renvoi ou de préjudice. Matrix peut orienter la recherche, mais ne doit pas être lu comme une réponse finale sur le droit actuel.',
        '',
        'Pourquoi:',
        '- La non-refoulement dépend souvent du risque de persécution, torture, détention arbitraire ou renvoi ultérieur.',
        '- Les transferts vers un pays tiers exigent des faits actuels sur le pays d’accueil et la personne concernée.',
        '- Avant d’agir, vérifie le droit actuel et les dossiers liés.',
      ].join('\n');
    }
    if (language === 'zh') {
      return [
        '简短回答: 这取决于法律依据、保障措施，以及被遣返或受伤害的风险。Matrix可以帮助理解问题，但不应被当作现行法律的最终答案。',
        '',
        '原因:',
        '- 不推回原则通常取决于一个人是否可能面临迫害、酷刑、任意拘留或继续被遣返。',
        '- 第三国转移需要核实现接收国和个人情况的最新事实。',
        '- 在采取行动前，请核实现行法律和链接记录。',
      ].join('\n');
    }
    if (language === 'ar') {
      return [
        'إجابة مختصرة: يعتمد ذلك على الأساس القانوني والضمانات وخطر الإعادة أو الضرر. يمكن أن يساعد Matrix في فهم المسألة، لكنه ليس جوابا نهائيا عن القانون الحالي.',
        '',
        'لماذا:',
        '- مسائل عدم الإعادة القسرية تعتمد غالبا على خطر الاضطهاد أو التعذيب أو الاحتجاز التعسفي أو الإعادة اللاحقة.',
        '- نقل الشخص إلى بلد ثالث يحتاج إلى حقائق حالية عن البلد المستقبل وعن الشخص نفسه.',
        '- قبل اتخاذ أي خطوة، تحقق من القانون الحالي ومن السجلات المرتبطة.',
      ].join('\n');
    }
    if (language === 'tok') {
      return [
        'Sotpela bekim: Em i dipen long lo as, sefti, na risk bilong salim man i go bek o kisim hevi. Matrix inap helpim yu long painim rot, tasol em i no laspela bekim bilong naupela lo.',
        '',
        'Bilong wanem:',
        '- Non-refoulement askim i lukim sapos man inap kisim persecution, torture, nogut detention, o narapela return.',
        '- Third-country transfer i nidim naupela facts long kantri i kisim man na long dispela man yet.',
        '- Bipo yu mekim samting, sekim naupela lo na ol linked records.',
      ].join('\n');
    }
    return [
      'Short answer: It depends on the legal basis, safeguards, and risk of return or harm. The Matrix can orient the issue, but it should not be read as a final current-law answer. The key legal questions are non-refoulement, detention conditions, access to asylum procedures, and whether the receiving country is genuinely safe.',
      '',
      'Why:',
      '- Non-refoulement questions usually turn on whether a person may be exposed to persecution, torture, arbitrary detention, or onward return.',
      '- Third-country transfer questions need current facts about the receiving country and the individual person.',
      '- Before acting, verify the current source law and the linked records.',
    ].join('\n');
  }
  return null;
}

function fallbackAnswer(question: string, surface: Surface, citations: Citation[], searchMode: string, audience: Audience, language: Language): string {
  const label = shortAnswerLabel(language);
  if (!citations.length) {
    return [
      `${label}: I could not find a strong Matrix match for "${question}".`,
      '',
      'Try a narrower search term, a case name, a campaign name, or one of the issue phrases such as "non-refoulement high seas", "third country transfer", "offshore detention", or "raise the age".',
      '',
      'This is research support, not legal advice.',
    ].join('\n');
  }

  const useful = citations
    .slice(0, 6)
    .map((c) => `- [${c.label}] ${c.title}${c.meta ? ` (${c.meta})` : ''}`)
    .join('\n');

  return [
    directFrame(question, surface, audience, language) ??
      `${label}: I found relevant Matrix records, but they do not by themselves prove a complete yes/no answer to "${question}". Use them as a starting point, then verify the current law or source material.`,
    '',
    `Retrieved ${citations.length} Matrix record${citations.length === 1 ? '' : 's'} using ${searchMode} retrieval.`,
    '',
    'Useful records:',
    useful,
    '',
    'Limits: the Matrix can orient strategy and source review, but it does not provide legal advice. Read the linked source before relying on a case or campaign.',
  ].join('\n');
}

function answerPlan(question: string, surface: Surface, audience: Audience, language: Language): string {
  const label = shortAnswerLabel(language);
  const style = `${audienceInstruction(audience)} ${languageInstruction(language)} Start with "${label}:". Use headings and bullets so the answer can be scanned.`;
  if (isYouthQuestion(question, surface) && /\b(10|ten|boy|girl|child|children)\b/i.test(question)) {
    return `${style} User is asking a plain-language yes/no legal capability question about a 10-year-old and youth detention. Start with the selected-language equivalent of: "It depends on the state or territory." Explain that the key issue is the current minimum age of criminal responsibility and detention/remand pathway. If the cited records do not establish current law for every jurisdiction, say that clearly.`;
  }
  if (isRefugeeQuestion(question, surface) && /\b(send|move|transfer|png|papua|third[-\s]?country|offshore)\b/i.test(question)) {
    return `${style} User is asking whether people can be moved to a third country or offshore location. Start with the selected-language equivalent of: "it depends..." Explain non-refoulement, safety, procedure, detention conditions, and need to verify current law/facts.`;
  }
  return `${style} Answer the user directly before discussing the records. If the records are incomplete, say what cannot be confirmed.`;
}

function historyContext(history: ChatMessage[]): string {
  if (!history.length) return '';
  return history.map((item) => `${item.role === 'assistant' ? 'Assistant' : 'User'}: ${item.content}`).join('\n');
}

function suggestedFollowUps(question: string, surface: Surface, citations: Citation[]): string[] {
  const followUps: string[] = [];
  if (isYouthQuestion(question, surface)) {
    addUnique(followUps, 'Which state or territory are you asking about?');
    addUnique(followUps, 'What is the current minimum age of criminal responsibility in Queensland?');
    addUnique(followUps, 'Show me the records about watch houses, remand, and children.');
    addUnique(followUps, 'What UN child rights standards apply to detaining a 10-year-old?');
  } else if (isRefugeeQuestion(question, surface)) {
    addUnique(followUps, 'What does non-refoulement mean in plain language?');
    addUnique(followUps, 'What cases deal with third-country transfer or offshore detention?');
    addUnique(followUps, 'What facts would need to be checked before transfer could be lawful?');
    addUnique(followUps, 'Which campaigns or organisations worked on this issue?');
  } else {
    addUnique(followUps, 'What are the strongest source records for this?');
    addUnique(followUps, 'What should I check before relying on this answer?');
    addUnique(followUps, 'Show me related cases and campaigns.');
  }
  const firstCase = citations.find((citation) => citation.kind === 'case');
  if (firstCase) addUnique(followUps, `Explain ${firstCase.title} in plain language.`);
  return followUps.slice(0, 4);
}

async function askProvider(
  provider: Provider,
  question: string,
  surface: Surface,
  citations: Citation[],
  history: ChatMessage[],
  audience: Audience,
  language: Language,
): Promise<string> {
  const contextualQuestion = standaloneQuestion(question, history);
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      max_tokens: 1100,
      messages: [
        { role: 'system', content: `Current date: ${currentDateLabel()}.\n\n${SYSTEM_PROMPT}` },
        {
          role: 'user',
          content: [
            history.length ? `Conversation so far:\n${historyContext(history)}` : null,
            `Question: ${question}`,
            contextualQuestion !== question ? `Question with context: ${contextualQuestion}` : null,
            '',
            `Answer plan: ${answerPlan(contextualQuestion, surface, audience, language)}`,
            '',
            'Retrieved Matrix records:',
            buildContext(citations),
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${provider.name} failed: ${res.status} ${text.slice(0, 160)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`${provider.name} returned no answer`);
  }
  return content.trim();
}

async function searchMatrix(
  request: Request,
  question: string,
  surface: Surface,
  mode: 'keyword' | 'semantic',
): Promise<SearchPayload> {
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams({
    q: question,
    mode,
    type: 'all',
    limit: surface === 'youth' ? '8' : '10',
  });

  if (surface === 'refugee' || surface === 'youth') {
    const preset = SURFACES[surface];
    params.set('scope', preset.defaultScope);
    if (preset.defaultCats.length) params.set('cat', preset.defaultCats.join(','));
  }

  const res = await fetch(`${origin}/api/justice-matrix/search?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Matrix search failed: ${res.status}`);

  return (await res.json()) as SearchPayload;
}

async function retrieve(request: Request, question: string, surface: Surface, history: ChatMessage[]): Promise<{
  citations: Citation[];
  mode: string;
  total: number;
}> {
  const retrievalQuestion = standaloneQuestion(question, history);
  const attempts: Array<{ query: string; mode: 'keyword' | 'semantic'; label: string }> = [
    { query: retrievalQuestion, mode: 'semantic', label: 'semantic' },
    { query: retrievalQuestion, mode: 'keyword', label: 'keyword' },
    ...fallbackQueries(question, surface, history).map((query) => ({
      query,
      mode: 'keyword' as const,
      label: `keyword fallback: ${query}`,
    })),
  ];

  const settled = await Promise.allSettled(attempts.map((attempt) => searchMatrix(request, attempt.query, surface, attempt.mode)));
  const scored = new Map<string, ScoredHit>();
  let total = 0;
  const modes = new Set<string>();

  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const payload = result.value;
    const attempt = attempts[index];
    total = Math.max(total, payload.total ?? 0);
    modes.add(attempt.label.includes('fallback') ? 'keyword fallback' : payload.mode ?? attempt.mode);
    const hits = orderedHits(payload, surface).slice(0, 10);
    hits.forEach((hit, position) => {
      const key = `${hit.kind}:${hit.id}`;
      const score = scoreHit(hit, question, attempt.query, surface) + Math.max(0, 10 - position);
      const existing = scored.get(key);
      if (!existing || score > existing.score) {
        scored.set(key, { hit, score, query: attempt.query, mode: attempt.label });
      }
    });
  });

  const ranked = [...scored.values()]
    .sort((a, b) => b.score - a.score)
    .map((item) => item.hit)
    .slice(0, 10);

  if (ranked.length) {
    let mode = modes.has('semantic') && modes.has('keyword fallback') ? 'hybrid fallback' : [...modes][0] ?? 'keyword fallback';
    if (modes.has('keyword fallback') && !modes.has('semantic')) mode = 'keyword fallback';
    return {
      citations: ranked.map(toCitation),
      mode,
      total: total || ranked.length,
    };
  }

  return {
    citations: [],
    mode: 'no match',
    total: 0,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function answerHasDirectOpening(answer: string, language: Language): boolean {
  const labels = Array.from(new Set([shortAnswerLabel(language), ...Object.values(SHORT_ANSWER_LABELS)]));
  const pattern = new RegExp(`^\\s*(?:${labels.map(escapeRegExp).join('|')})\\s*:`, 'iu');
  return pattern.test(answer);
}

function polishOpening(answer: string, language: Language): string {
  const labels = Array.from(new Set([shortAnswerLabel(language), ...Object.values(SHORT_ANSWER_LABELS)]));
  const labelPattern = `(${labels.map(escapeRegExp).join('|')})`;
  if (language === 'es') {
    return answer.replace(
      new RegExp(`^(\\s*${labelPattern}\\s*:\\s*)(?:Los\\s+registros\\s+(?:indican|sugieren|muestran)\\s+que\\s+)`, 'iu'),
      '$1',
    );
  }
  return answer
    .replace(
      new RegExp(
        `^(\\s*${labelPattern}\\s*:\\s*)The\\s+records\\s+do\\s+not\\s+explicitly\\s+state\\s+([^,.]+),\\s+but\\s+they\\s+(indicate|suggest|show)\\s+`,
        'iu',
      ),
      '$1I could not confirm $2 from these Matrix records, but they $3 ',
    )
    .replace(
      new RegExp(
        `^(\\s*${labelPattern}\\s*:\\s*)(?:The\\s+(?:provided\\s+)?(?:Matrix\\s+)?records\\s+(?:indicate|suggest|show)\\s+(?:that\\s+)?)`,
        'iu',
      ),
      '$1',
    );
}

function polishPastDateLanguage(answer: string): string {
  const currentYear = Number(
    new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Brisbane',
      year: 'numeric',
    }).format(new Date()),
  );
  const months =
    'January|February|March|April|May|June|July|August|September|October|November|December|Jan\\.?|Feb\\.?|Mar\\.?|Apr\\.?|Jun\\.?|Jul\\.?|Aug\\.?|Sep\\.?|Sept\\.?|Oct\\.?|Nov\\.?|Dec\\.?';
  let touchedPastFuture = false;

  const rewritten = answer.replace(
    new RegExp(`\\bFrom\\s+(${months})\\s+(20\\d{2}),\\s+([^.]*?)\\bwill be\\b([^.]*?)(\\[[C]\\d+\\])?\\.`, 'gi'),
    (match, month: string, year: string, before: string, after: string, citation: string | undefined) => {
      if (Number(year) >= currentYear) return match;
      touchedPastFuture = true;
      const cited = citation ? ` ${citation}` : '';
      return `The cited record describes a reform due from ${month} ${year}: ${before.trim()} was expected to be${after}${cited}. Because that date has passed, verify the current law from the source before relying on it.`;
    },
  );

  if (!touchedPastFuture) return rewritten;
  if (/Date check:/i.test(rewritten)) return rewritten;
  return `${rewritten}\n\nDate check: Current date is ${currentDateLabel()}. Any reform date from an earlier year is now in the past; verify current legal status from the linked source before relying on it.`;
}

function polishAnswer(answer: string, language: Language): string {
  return polishPastDateLanguage(polishOpening(answer, language));
}

function enforceDirectOpening(answer: string, question: string, surface: Surface, audience: Audience, language: Language): string {
  if (answerHasDirectOpening(answer, language)) return polishAnswer(answer, language);
  const frame = directFrame(question, surface, audience, language);
  if (frame) {
    return polishAnswer(`${frame}\n\n${answer}`, language);
  }
  return polishAnswer(`${shortAnswerLabel(language)}: ${answer}`, language);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AskRequest;
    const question = cleanQuestion(body.question);
    const surface = normaliseSurface(body.surface);
    const history = cleanHistory(body.history);
    const audience = normaliseAudience(body.audience);
    const language = normaliseLanguage(body.language);
    const contextualQuestion = standaloneQuestion(question, history);

    if (question.length < 3) {
      return NextResponse.json({ error: 'Question must be at least 3 characters.' }, { status: 400 });
    }

    const retrieved = await retrieve(request, question, surface, history);
    const provider = chooseProvider();

    let answer: string;
    let providerName = 'retrieval-only';
    try {
      if (provider && retrieved.citations.length) {
        answer = await askProvider(provider, question, surface, retrieved.citations, history, audience, language);
        answer = enforceDirectOpening(answer, contextualQuestion, surface, audience, language);
        providerName = provider.name;
      } else {
        answer = fallbackAnswer(contextualQuestion, surface, retrieved.citations, retrieved.mode, audience, language);
      }
    } catch (error) {
      console.warn('[Ask the Matrix] provider failed, falling back:', error);
      answer = fallbackAnswer(contextualQuestion, surface, retrieved.citations, retrieved.mode, audience, language);
    }

    return NextResponse.json({
      question,
      surface,
      answer,
      citations: retrieved.citations,
      retrieval: {
        mode: retrieved.mode,
        total: retrieved.total,
        provider: providerName,
      },
      audience,
      language,
      followUps: suggestedFollowUps(contextualQuestion, surface, retrieved.citations),
    });
  } catch (error) {
    console.error('[Ask the Matrix] failed:', error);
    return NextResponse.json({ error: 'Ask the Matrix could not answer right now.' }, { status: 500 });
  }
}
