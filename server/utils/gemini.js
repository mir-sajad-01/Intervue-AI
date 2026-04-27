import { GoogleGenerativeAI } from '@google/generative-ai';

const sanitizeTopic = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const clampScore = (value) => Math.max(0, Math.min(10, Number(value) || 0));

const normalizeForMatch = (value) =>
  sanitizeTopic(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '');

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
    match: /why do you want to work here/,
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
    match: /where do you see yourself in 5 years/,
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
    match: /biggest weakness/,
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
  return questionTemplates.find((template) => template.match.test(normalized)) || null;
};

const buildGenericSampleAnswer = (question, transcript) => {
  const cleanedQuestion = sanitizeTopic(question);
  const normalizedQuestion = normalizeForMatch(question);
  const transcriptText = sanitizeTopic(transcript);
  const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;
  const hasAnswer = normalizeForMatch(transcript) !== 'no answer provided';

  if (!hasAnswer) {
    return `A stronger answer to "${cleanedQuestion}" would start with a direct response, add one specific example, and end with a clear result or takeaway. Keeping it focused and concrete will make it sound more confident and useful.`;
  }

  if (/tell me about a time|describe a time|give an example/.test(normalizedQuestion)) {
    return 'A stronger answer should use a clear STAR structure: explain the situation briefly, describe your responsibility, walk through the action you took, and finish with the result. That keeps the story focused and shows how you handle real situations.';
  }

  if (/why /.test(normalizedQuestion)) {
    return 'A stronger answer should begin with a direct reason, support it with one concrete detail or example, and end by linking that reason back to the role. That makes the answer sound more thoughtful and convincing.';
  }

  if (/what |how /.test(normalizedQuestion)) {
    return 'A stronger answer should open with a direct response, then explain it clearly and support it with one relevant example or detail. Ending with a short takeaway will make the answer feel more complete.';
  }

  if (wordCount <= 7) {
    return `A stronger answer to "${cleanedQuestion}" should go beyond a short claim. Start with your main point, explain why it is true, and add one concrete example or result so the interviewer can trust the answer.`;
  }

  if (wordCount <= 16) {
    return `A stronger answer to "${cleanedQuestion}" would feel more complete with a clearer structure. Try using a simple flow of main point, supporting example, and outcome so the answer sounds more persuasive and easier to follow.`;
  }

  return `A stronger answer to "${cleanedQuestion}" would open with the main point in one sentence, support it with a specific example, and finish by explaining the result. Keep the explanation concise, use natural transitions, and connect the answer back to what the interviewer wants to learn.`;
};

const buildFallbackSampleAnswer = (question, transcript) => {
  const template = getTemplateForQuestion(question);
  if (template) return template.sampleAnswer;
  return buildGenericSampleAnswer(question, transcript);
};

const getFallbackScores = (question, transcript) => {
  const normalizedTranscript = normalizeForMatch(transcript);
  const wordCount = sanitizeTopic(transcript).split(/\s+/).filter(Boolean).length;
  const questionWords = normalizeForMatch(question).split(/\s+/).filter(Boolean);
  const overlap = questionWords.filter((word) => word.length > 3 && normalizedTranscript.includes(word)).length;
  const hasNoAnswer = normalizedTranscript === 'no answer provided' || !normalizedTranscript;
  const weakPhrases = ['money', 'anything', 'any', 'everyone', 'idk', 'dont know', 'not sure'];
  const weakAnswer = weakPhrases.some((phrase) => normalizedTranscript.includes(phrase));

  if (hasNoAnswer) {
    return { relevanceScore: 0, fluencyScore: 0, clarityScore: 0 };
  }

  let relevanceScore = 3;
  let fluencyScore = 3;
  let clarityScore = 3;

  if (wordCount >= 8) {
    fluencyScore += 1;
    clarityScore += 1;
  }

  if (wordCount >= 16) {
    fluencyScore += 1;
    clarityScore += 1;
  }

  if (overlap >= 1) relevanceScore += 1;
  if (overlap >= 2) relevanceScore += 1;

  if (weakAnswer) {
    relevanceScore -= 2;
    clarityScore -= 1;
  }

  if (wordCount <= 4) {
    relevanceScore -= 1;
    fluencyScore -= 1;
    clarityScore -= 1;
  }

  return {
    relevanceScore: clampScore(relevanceScore),
    fluencyScore: clampScore(fluencyScore),
    clarityScore: clampScore(clarityScore)
  };
};

const fallbackFeedback = (reason, question, transcript) => {
  const template = getTemplateForQuestion(question);

  return {
    ...getFallbackScores(question, transcript),
    tips:
      template?.tips || [
        `Answer "${sanitizeTopic(question)}" directly in your first sentence.`,
        'Use a simple structure such as point, example, result.',
        'Add one concrete detail so the answer feels specific and believable.'
      ],
    sampleAnswer: buildFallbackSampleAnswer(question, transcript),
    fallback: true,
    reason
  };
};

export const evaluateAnswer = async ({ question, transcript }) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY missing; returning fallback feedback');
    return fallbackFeedback('Gemini API key is not configured', question, transcript);
  }

  const prompt = `You are an expert interview coach evaluating a candidate's spoken answer to an interview question. 
Analyze the following transcript and return a JSON response ONLY with no extra text, no markdown, no backticks.

Question: ${question}
Candidate's Answer: ${transcript}

Return exactly this JSON:
{
  'relevanceScore': <0-10>,
  'fluencyScore': <0-10>,
  'clarityScore': <0-10>,
  'tips': ['tip1', 'tip2', 'tip3'],
  'sampleAnswer': 'A concise, well-structured sample answer in 3-4 sentences'
}`;

  try {
    console.log('Calling Gemini for answer evaluation');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^```json|```$/g, '').trim();
    const parsed = JSON.parse(text.replace(/'/g, '"'));

    return {
      relevanceScore: clampScore(parsed.relevanceScore),
      fluencyScore: clampScore(parsed.fluencyScore),
      clarityScore: clampScore(parsed.clarityScore),
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : fallbackFeedback('', question, transcript).tips,
      sampleAnswer: parsed.sampleAnswer || fallbackFeedback('', question, transcript).sampleAnswer
    };
  } catch (error) {
    console.error(`Gemini evaluation failed: ${error.message}`);
    return fallbackFeedback(error.message, question, transcript);
  }
};

export const generateInterviewQuestions = async ({ topic, difficulty, totalQuestions }) => {
  const cleanedTopic = sanitizeTopic(topic);
  const count = Number(totalQuestions) || 5;

  const fallbackPrompts = [
    `Give a concise introduction to ${cleanedTopic} and explain why it matters.`,
    `Describe a practical challenge in ${cleanedTopic} and how you would handle it.`,
    `Walk through a real example, project, or scenario related to ${cleanedTopic}.`,
    `What common mistake do people make in ${cleanedTopic}, and how would you avoid it?`,
    `How would you explain ${cleanedTopic} clearly to someone new to it?`,
    `What skills or habits are most important for doing well in ${cleanedTopic}?`,
    `Describe how you would prepare for a high-pressure situation involving ${cleanedTopic}.`,
    `How would you measure success or improvement in ${cleanedTopic}?`,
    `What trade-offs or decisions come up most often in ${cleanedTopic}?`,
    `Describe a time you learned something important about ${cleanedTopic} or how you would approach learning it fast.`
  ];

  const fallback = Array.from({ length: count }, (_, index) => ({
    text: fallbackPrompts[index % fallbackPrompts.length],
    category: 'Mixed',
    difficulty,
    tags: ['custom', cleanedTopic.toLowerCase()]
  }));

  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY missing; returning fallback custom questions');
    return fallback;
  }

  const prompt = `You are an expert interview question designer.
Generate ${count} interview practice questions for this preparation topic: "${cleanedTopic}".
Difficulty: ${difficulty}.

Return JSON ONLY with no markdown, no backticks, exactly:
{
  "questions": [
    "question 1",
    "question 2"
  ]
}

Questions should be specific, realistic, and suitable for a job interview.`;

  try {
    console.log(`Calling Gemini to generate ${count} custom questions for topic: ${cleanedTopic}`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^```json|```$/g, '').trim();
    const parsed = JSON.parse(text);
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const usable = questions
      .map((question) => String(question || '').trim())
      .filter(Boolean)
      .slice(0, count);

    if (usable.length < count) return fallback;

    return usable.map((textValue) => ({
      text: textValue,
      category: 'Mixed',
      difficulty,
      tags: ['custom', cleanedTopic.toLowerCase()]
    }));
  } catch (error) {
    console.error(`Gemini custom question generation failed: ${error.message}`);
    return fallback;
  }
};
