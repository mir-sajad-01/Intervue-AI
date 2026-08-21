import { GoogleGenerativeAI } from '@google/generative-ai';

const sanitizeTopic = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const clampScore = (value) =>
  Math.max(0, Math.min(10, Number(value) || 0));

const normalizeForMatch = (value) =>
  sanitizeTopic(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '');

const cleanJsonText = (value) => {
  const withoutFence = String(value || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');

  return firstBrace >= 0 && lastBrace > firstBrace
    ? withoutFence.slice(firstBrace, lastBrace + 1)
    : withoutFence;
};

const parseGeminiJson = (value) => {
  const cleaned = cleanJsonText(value);

  try {
    return JSON.parse(cleaned);
  } catch {
    return JSON.parse(cleaned.replace(/'/g, '"'));
  }
};


/*
|--------------------------------------------------------------------------
| Interview answer templates
|--------------------------------------------------------------------------
*/

const questionTemplates = [
  {
    match: /tell me about yourself/,
    sampleAnswer:
      'I am a motivated professional with experience that combines problem solving, teamwork, and continuous learning. In my recent work or studies, I focused on building strong fundamentals, delivering reliable results, and improving how I communicate ideas. I am now looking for a role where I can contribute quickly, keep growing, and create measurable impact.',
    tips: [
      'Start with who you are professionally, not personal history.',
      'Mention one or two strengths that fit the role.',
      'Close by linking your background to this opportunity.'
    ]
  },

  {
    match: /greatest strengths|what are your strengths/,
    sampleAnswer:
      'One of my greatest strengths is staying calm and organized when work gets busy. I also learn quickly, which helps me adapt to new tools and responsibilities without slowing the team down. For example, when I had to take on a new task with limited time, I broke it into steps, learned what I needed, and delivered it successfully.',
    tips: [
      'Choose strengths that match the job rather than vague positives.',
      'Back each strength with a short example.',
      'Keep the answer focused on two strengths, not a long list.'
    ]
  },

  {
    match: /salary expectations/,
    sampleAnswer:
      'Based on my skills, experience, and the responsibilities of this role, I am looking for a fair market-aligned package. I am flexible and open to discussing a range that fits the company budget and the overall opportunity. My priority is joining a role where I can contribute strongly and keep growing.',
    tips: [
      'Avoid giving a rigid number without context.',
      'Show flexibility and awareness of market value.',
      'Keep the tone professional and confident.'
    ]
  },

  {
    match: /why do you want to work here|why do you want to join/,
    sampleAnswer:
      'I want to work here because the role matches my strengths and gives me a chance to contribute in a meaningful way. I also appreciate the company focus, culture, and the kind of problems the team is solving. This position stands out to me because it offers both immediate responsibility and room to grow.',
    tips: [
      'Mention the company, role, and impact together.',
      'Show that you know something specific about the employer.',
      'Avoid making the answer only about salary or personal gain.'
    ]
  },

  {
    match: /what makes you unique/,
    sampleAnswer:
      'What makes me unique is the combination of adaptability, consistency, and the way I communicate while solving problems. I do not just focus on finishing tasks; I pay attention to clarity, teamwork, and improvement as well. That mix helps me contribute reliably while also making collaboration easier for the people around me.',
    tips: [
      'Focus on a combination of traits rather than a single buzzword.',
      'Explain why your difference matters in a team or role.',
      'Keep the answer credible and specific.'
    ]
  },

  {
    match: /where do you see yourself in 5 years|where do you see yourself in five years/,
    sampleAnswer:
      'In five years, I want to be in a role where I have developed deeper expertise, taken on more responsibility, and built a record of dependable results. I would like to keep improving my technical and communication skills while contributing to projects that create measurable value. Over time, I also want to grow into someone who can guide others and help the team succeed at a higher level.',
    tips: [
      'Focus on growth, contribution, and realistic ambition.',
      'Show that your plans connect to the role you are applying for.',
      'Avoid answers that sound vague or only title-focused.'
    ]
  },

  {
    match: /why should we hire you/,
    sampleAnswer:
      'You should hire me because I bring a strong willingness to learn, dependable execution, and a mindset focused on contributing to the team. When I take on a responsibility, I work to understand the goal clearly, communicate well, and deliver results that others can rely on. I would bring that same energy here while continuing to grow quickly in the role.',
    tips: [
      'Connect your strengths directly to what the employer needs.',
      'Use one short example or proof point to support your claim.',
      'Sound confident without making broad claims you cannot back up.'
    ]
  },

  {
    match: /biggest weakness|greatest weakness|what is your weakness/,
    sampleAnswer:
      'One weakness I identified in myself was spending too much time trying to perfect details before sharing progress. I have worked on that by setting clearer checkpoints, asking for feedback earlier, and focusing on what matters most for the outcome. That has helped me stay efficient without lowering quality.',
    tips: [
      'Choose a real but manageable weakness.',
      'Show what you are doing to improve it.',
      'Avoid giving an answer that sounds fake or disguised as a strength.'
    ]
  }
];

const getTemplateForQuestion = (question) => {
  const normalized = normalizeForMatch(question);

  return (
    questionTemplates.find((template) =>
      template.match.test(normalized)
    ) || null
  );
};


/*
|--------------------------------------------------------------------------
| Generic sample answer
|--------------------------------------------------------------------------
*/

const buildGenericSampleAnswer = (question, transcript) => {
  const cleanedQuestion = sanitizeTopic(question);
  const normalizedQuestion = normalizeForMatch(question);
  const transcriptText = sanitizeTopic(transcript);

  const wordCount = transcriptText
    .split(/\s+/)
    .filter(Boolean).length;

  const hasAnswer =
    normalizeForMatch(transcript) !== 'no answer provided';

  if (!hasAnswer) {
    return `A stronger answer to "${cleanedQuestion}" would start with a direct response, add one specific example, and end with a clear result or takeaway.`;
  }

  if (
    /tell me about a time|describe a time|give an example|challenging situation/.test(
      normalizedQuestion
    )
  ) {
    return 'A stronger answer should use a clear STAR structure: explain the situation briefly, describe your responsibility, walk through the action you took, and finish with the result.';
  }

  if (/why /.test(normalizedQuestion)) {
    return 'A stronger answer should begin with a direct reason, support it with one concrete detail or example, and end by linking that reason back to the role.';
  }

  if (wordCount < 15) {
    return 'The answer is a little short. Start with a direct response, add one concrete example or reason, and finish with a clear takeaway.';
  }

  return 'The answer has a useful foundation. To make it stronger, lead with the main point, support it with one concrete example, and finish with the result or lesson.';
};


/*
|--------------------------------------------------------------------------
| Local fallback scoring
|
| IMPORTANT:
| This is NOT pretending to be Gemini.
| It is only used when Gemini is genuinely unavailable.
|--------------------------------------------------------------------------
*/

const getFallbackScores = (question, transcript) => {
  const answer = sanitizeTopic(transcript);
  const normalizedAnswer = normalizeForMatch(answer);
  const normalizedQuestion = normalizeForMatch(question);

  const words = answer
    .split(/\s+/)
    .filter(Boolean);

  const wordCount = words.length;

  if (
    !answer ||
    normalizedAnswer === 'no answer provided' ||
    normalizedAnswer === 'no answer'
  ) {
    return {
      relevanceScore: 0,
      fluencyScore: 0,
      clarityScore: 0
    };
  }

  let relevanceScore = 5;
  let fluencyScore = 5;
  let clarityScore = 5;

  /*
   * ---------------------------------------------------------------
   * Answer length
   * ---------------------------------------------------------------
   */

  if (wordCount <= 3) {
    relevanceScore -= 2;
    fluencyScore -= 2;
    clarityScore -= 2;
  } else if (wordCount <= 7) {
    relevanceScore -= 1;
    fluencyScore -= 1;
    clarityScore -= 1;
  } else if (wordCount >= 15) {
    fluencyScore += 1;
    clarityScore += 1;
  }

  if (wordCount >= 30) {
    fluencyScore += 1;
    clarityScore += 1;
  }

  /*
   * ---------------------------------------------------------------
   * Question-answer word overlap
   * ---------------------------------------------------------------
   */

  const questionWords = normalizedQuestion
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const uniqueQuestionWords = [...new Set(questionWords)];

  const overlapCount = uniqueQuestionWords.filter((word) =>
    normalizedAnswer.includes(word)
  ).length;

  if (overlapCount >= 1) {
    relevanceScore += 1;
  }

  if (overlapCount >= 2) {
    relevanceScore += 1;
  }

  if (overlapCount >= 4) {
    relevanceScore += 1;
  }

  /*
   * ---------------------------------------------------------------
   * Weak / vague answers
   * ---------------------------------------------------------------
   */

  const weakPhrases = [
    'i dont know',
    "i don't know",
    'dont know',
    "don't know",
    'no idea',
    'not sure',
    'i am not aware',
    'anything is fine',
    'anything',
    'whatever',
    'nothing',
    'idk'
  ];

  const containsWeakPhrase = weakPhrases.some((phrase) =>
    normalizedAnswer.includes(phrase)
  );

  if (containsWeakPhrase) {
    relevanceScore -= 3;
    clarityScore -= 2;
    fluencyScore -= 1;
  }

  /*
   * ---------------------------------------------------------------
   * Very short / incomplete answer
   * ---------------------------------------------------------------
   */

  if (wordCount <= 5) {
    relevanceScore -= 1;
    clarityScore -= 1;
  }

  /*
   * ---------------------------------------------------------------
   * Basic structure indicators
   * ---------------------------------------------------------------
   */

  const hasExample =
    /for example|for instance|when i|during|in my project|i worked|i developed/.test(
      normalizedAnswer
    );

  if (hasExample) {
    relevanceScore += 1;
    clarityScore += 1;
  }

  /*
   * ---------------------------------------------------------------
   * Basic sentence structure
   * ---------------------------------------------------------------
   */

  const sentenceCount = answer
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length;

  if (sentenceCount >= 2 && wordCount >= 15) {
    clarityScore += 1;
  }

  return {
    relevanceScore: clampScore(relevanceScore),
    fluencyScore: clampScore(fluencyScore),
    clarityScore: clampScore(clarityScore)
  };
};


/*
|--------------------------------------------------------------------------
| Fallback feedback
|--------------------------------------------------------------------------
*/

const fallbackFeedback = (errorMessage, question, transcript) => {
  const template = getTemplateForQuestion(question);

  const scores = getFallbackScores(
    question,
    transcript
  );

  return {
    relevanceScore: scores.relevanceScore,
    fluencyScore: scores.fluencyScore,
    clarityScore: scores.clarityScore,

    tips:
      template?.tips || [
        'Answer the question directly before adding supporting details.',
        'Use one concrete example whenever possible.',
        'Finish with a clear result, lesson, or takeaway.'
      ],

    sampleAnswer:
      template?.sampleAnswer ||
      buildGenericSampleAnswer(question, transcript),

    error: errorMessage || null
  };
};


/*
|--------------------------------------------------------------------------
| Gemini helper
|
| Primary:
|   gemini-3.7-flash
|
| Fallback:
|   gemini-3.6-flash
|
| Transient errors such as 503/429 are retried using exponential
| backoff with jitter.
|--------------------------------------------------------------------------
*/

const GEMINI_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash'
];

const MAX_RETRIES_PER_MODEL = 2;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableGeminiError = (error) => {
  const message = String(error?.message || error || '').toLowerCase();

  return (
    message.includes('503') ||
    message.includes('service unavailable') ||
    message.includes('unavailable') ||
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('rate limit') ||
    message.includes('408') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('504') ||
    message.includes('internal server error') ||
    message.includes('deadline exceeded')
  );
};

const generateWithGemini = async (prompt, operationName) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

  let lastError = null;

  for (const modelName of GEMINI_MODELS) {
    for (
      let attempt = 1;
      attempt <= MAX_RETRIES_PER_MODEL;
      attempt++
    ) {
      try {
        console.log(
          `[Gemini] ${operationName} | model=${modelName} | attempt=${attempt}`
        );

        const model = genAI.getGenerativeModel({
          model: modelName
        });

        const result = await model.generateContent(prompt);

        const text = result.response.text();

        if (!text || !text.trim()) {
          throw new Error(
            `Gemini returned an empty response using ${modelName}`
          );
        }

        console.log(
          `[Gemini] ${operationName} succeeded using ${modelName}`
        );

        return text;
      } catch (error) {
        lastError = error;

        const retryable = isRetryableGeminiError(error);

        console.error(
          `[Gemini] ${operationName} failed | model=${modelName} | attempt=${attempt} | retryable=${retryable}`
        );

        console.error(
          `[Gemini] Error: ${error.message}`
        );

        /*
         * Do NOT retry permanent errors such as:
         * - invalid API key
         * - invalid request
         * - unavailable model
         */
        if (!retryable) {
          break;
        }

        /*
         * Exponential backoff:
         *
         * attempt 1 -> ~1.5 sec
         * attempt 2 -> ~3 sec
         */
        if (attempt < MAX_RETRIES_PER_MODEL) {
          const baseDelay = 1500 * Math.pow(2, attempt - 1);

          const jitter = Math.floor(
            Math.random() * 500
          );

          const delay = baseDelay + jitter;

          console.log(
            `[Gemini] Waiting ${delay}ms before retry...`
          );

          await sleep(delay);
        }
      }
    }

    /*
     * If the first model failed, move to the second Gemini model.
     */
    console.warn(
      `[Gemini] Switching from ${modelName} to next Gemini model...`
    );
  }

  throw lastError || new Error(
    'All Gemini models failed'
  );
};


/*
|--------------------------------------------------------------------------
| Evaluate interview answer
|--------------------------------------------------------------------------
*/

export const evaluateAnswer = async ({
  question,
  transcript
}) => {
  console.log('========== GEMINI CHECK ==========');

  console.log(
    'GEMINI_API_KEY exists:',
    !!process.env.GEMINI_API_KEY
  );

  console.log(
    'GEMINI_API_KEY length:',
    process.env.GEMINI_API_KEY
      ? process.env.GEMINI_API_KEY.length
      : 0
  );

  console.log(
    '=================================='
  );

  const cleanedQuestion =
    sanitizeTopic(question);

  const cleanedTranscript =
    sanitizeTopic(transcript);

  const prompt = `You are an expert professional interview evaluator.

Evaluate the candidate's answer to the interview question below.

INTERVIEW QUESTION:
"${cleanedQuestion}"

CANDIDATE ANSWER:
"${cleanedTranscript || 'No answer provided'}"

Evaluate the answer independently on three dimensions.

1. relevanceScore
How directly and accurately does the answer address the question?

2. fluencyScore
How naturally, smoothly, and professionally is the answer expressed?

3. clarityScore
How clear, structured, understandable, and logically organized is the answer?

SCORING RULES:

- 0-2 = extremely poor
- 3-4 = weak
- 5-6 = average
- 7-8 = good
- 9-10 = excellent

Do NOT automatically give 7.
Do NOT give the same score to every answer unless the answers genuinely deserve the same score.

Important:
- A very short answer should generally score lower.
- "I don't know", "not sure", or similarly empty answers should score very low for relevance.
- A confident but irrelevant answer should still receive a low relevance score.
- Grammar problems should affect fluency and clarity.
- A detailed, relevant, structured answer can score highly.
- Evaluate the actual candidate answer, not the potential answer.

Also provide:
- exactly 3 practical improvement tips
- a strong sample answer

Return JSON ONLY.

Do not use markdown.
Do not use code fences.

{
  "relevanceScore": 0,
  "fluencyScore": 0,
  "clarityScore": 0,
  "tips": [
    "tip 1",
    "tip 2",
    "tip 3"
  ],
  "sampleAnswer": "sample answer"
}`;

  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      'GEMINI_API_KEY missing; using local fallback evaluation.'
    );

    return fallbackFeedback(
      'GEMINI_API_KEY missing',
      question,
      transcript
    );
  }

  try {
    const responseText =
      await generateWithGemini(
        prompt,
        'answer evaluation'
      );

    const parsed =
      parseGeminiJson(responseText);

    const scores = {
      relevanceScore: clampScore(
        parsed.relevanceScore
      ),

      fluencyScore: clampScore(
        parsed.fluencyScore
      ),

      clarityScore: clampScore(
        parsed.clarityScore
      )
    };

    /*
     * Make sure Gemini actually returned valid
     * scores instead of silently turning bad values into 0.
     */
    const tips =
      Array.isArray(parsed.tips)
        ? parsed.tips
            .map((tip) =>
              String(tip || '').trim()
            )
            .filter(Boolean)
            .slice(0, 3)
        : [];

    return {
      ...scores,

      tips:
        tips.length === 3
          ? tips
          : fallbackFeedback(
              'Gemini returned invalid tips',
              question,
              transcript
            ).tips,

      sampleAnswer:
        typeof parsed.sampleAnswer === 'string' &&
        parsed.sampleAnswer.trim()
          ? parsed.sampleAnswer.trim()
          : buildGenericSampleAnswer(
              question,
              transcript
            )
    };
  } catch (error) {
    console.error(
      `Gemini evaluation failed after retries: ${error.message}`
    );

    /*
     * IMPORTANT:
     * Gemini failed, so we do NOT pretend Gemini gave a score.
     * We use the local scoring algorithm instead.
     */
    return fallbackFeedback(
      error.message,
      question,
      transcript
    );
  }
};


/*
|--------------------------------------------------------------------------
| Generate Custom Interview Questions
|--------------------------------------------------------------------------
*/

export const generateInterviewQuestions = async ({
  topic,
  difficulty,
  totalQuestions
}) => {
  const cleanedTopic =
    sanitizeTopic(topic);

  const count =
    Number(totalQuestions) || 5;

  /*
   * Safe fallback questions.
   *
   * These are used only if Gemini is genuinely
   * unavailable after retries.
   */
  const fallbackPrompts = [
    'Tell me about yourself and your background.',

    'Why are you interested in this opportunity?',

    'What are your greatest strengths, and how have you demonstrated them?',

    'Tell me about a challenging situation you faced and how you handled it.',

    'Why should we hire you?',

    'Tell me about a time you worked successfully with a team.',

    'What is one weakness you are currently working to improve?',

    'Where do you see yourself in the next five years?',

    'Tell me about a time you made a mistake and what you learned from it.',

    'Do you have any questions you would like to ask the interviewer?'
  ];

  const fallback =
    Array.from(
      { length: count },
      (_, index) => ({
        text:
          fallbackPrompts[
            index % fallbackPrompts.length
          ],

        category: 'Mixed',

        difficulty,

        tags: [
          'custom',
          'interview'
        ]
      })
    );

  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      'GEMINI_API_KEY missing; returning fallback custom questions.'
    );

    return fallback;
  }

  /*
   * IMPORTANT:
   *
   * The user's input is an interview request,
   * not necessarily a simple topic.
   *
   * Example:
   *
   * "I have an EPAM HR interview.
   *  Take my mock interview."
   *
   * Gemini must understand:
   *
   * Company = EPAM
   * Interview = HR
   * Mode = mock interview
   *
   * It must NOT copy the whole sentence into
   * the generated question.
   */

  const prompt = `You are an expert professional interviewer.

The user entered this custom interview request:

"${cleanedTopic}"

INTERPRET THE USER'S INTENT FIRST.

The input may be:
- a simple topic
- a company interview
- a job role
- an HR interview
- a technical interview
- a behavioural interview
- a mock interview request
- a combination of these

IMPORTANT RULES:

1. Treat the input as an interview preparation request.
2. Do NOT blindly treat the entire input as a topic.
3. Identify the company, role, interview type, and context when they are present.
4. If the user mentions a company, tailor questions to that company context when appropriate.
5. If the user mentions an HR interview, focus on HR and behavioural questions.
6. If the user mentions a technical interview, focus on technical questions relevant to the role or technologies mentioned.
7. If the user asks for a mock interview, generate questions as if you are the interviewer.
8. If the user provides a simple topic such as "React hooks", generate interview questions about that topic.
9. Never copy the user's entire sentence into a question.
10. Never create questions such as:
   "Describe a practical challenge in [the entire user's sentence]."
11. Every question must sound natural when spoken by a real interviewer.
12. Do not explain your reasoning.
13. Generate exactly ${count} questions.

Difficulty:
${difficulty}

Return JSON ONLY.

No markdown.
No code fences.

{
  "questions": [
    "question 1",
    "question 2"
  ]
}

The questions must be:
- realistic
- natural
- relevant
- specific to the user's request
- appropriate for the requested difficulty
- suitable for an actual interview`;

  try {
    console.log(
      `Calling Gemini to generate ${count} custom questions for request: ${cleanedTopic}`
    );

    const responseText =
      await generateWithGemini(
        prompt,
        'custom question generation'
      );

    const parsed =
      parseGeminiJson(responseText);

    const questions =
      Array.isArray(parsed.questions)
        ? parsed.questions
        : [];

    const usable =
      questions
        .map((question) =>
          String(question || '').trim()
        )
        .filter(Boolean)
        .slice(0, count);

    if (usable.length < count) {
      console.warn(
        `Gemini returned only ${usable.length}/${count} usable questions. Using safe fallback.`
      );

      return fallback;
    }

    return usable.map(
      (textValue) => ({
        text: textValue,

        category: 'Mixed',

        difficulty,

        tags: [
          'custom',
          'interview'
        ]
      })
    );
  } catch (error) {
    console.error(
      `Gemini custom question generation failed after retries: ${error.message}`
    );

    return fallback;
  }
};