const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const sampleAnswerTemplates = [
  {
    match: /where do you see yourself in 5 years/,
    sample:
      'In five years, I want to be in a role where I have grown into a dependable contributor with deeper expertise and more ownership. I would like to keep building strong technical and communication skills, contribute to meaningful projects, and eventually mentor others as well. What matters most is steady growth, measurable impact, and being part of a team where I can keep learning.'
  },
  {
    match: /why should we hire you/,
    sample:
      'You should hire me because I bring a combination of willingness to learn, accountability, and the ability to turn feedback into results. When I take on a responsibility, I focus on understanding the goal, communicating clearly, and delivering work that the team can rely on. I would bring that same discipline here while continuing to grow quickly in the role.'
  },
  {
    match: /what are your greatest strengths|what are your strengths/,
    sample:
      'One of my biggest strengths is staying reliable and focused even when priorities shift. I also learn quickly, which helps me adapt to new tools and expectations without losing momentum. In practice, that means I can contribute steadily while still improving fast.'
  },
  {
    match: /why do you want to work here/,
    sample:
      'I want to work here because this role fits both my strengths and the kind of work I want to grow into. The company direction, the problems being solved, and the opportunity to contribute in a meaningful way all make this role appealing to me. I am especially interested in joining a team where I can add value early and continue developing over time.'
  },
  {
    match: /salary expectations/,
    sample:
      'I am looking for a fair, market-aligned package that reflects the responsibilities of the role and the value I can bring. I am open to discussing a reasonable range based on the full scope of the opportunity, growth path, and overall compensation. My priority is finding the right fit where I can contribute strongly and keep developing.'
  },
  {
    match: /what makes you unique/,
    sample:
      'What makes me unique is the combination of adaptability, consistency, and the way I communicate while solving problems. I try to be someone who not only completes the work, but also makes collaboration smoother and keeps improving the process around it. That balance helps me contribute both as an individual and as a teammate.'
  }
];

const isLegacyGenericSample = (value) => normalize(value).startsWith('a stronger answer to');

const buildPatternSample = (question) => {
  const normalizedQuestion = normalize(question);

  if (/tell me about a time|describe a time|give an example/.test(normalizedQuestion)) {
    return 'A strong answer here should follow a clear STAR flow: explain the situation briefly, state your responsibility, describe the action you took, and finish with the result. Keep the story focused on your decision-making and what changed because of your actions.';
  }

  if (/why /.test(normalizedQuestion)) {
    return 'A stronger answer should begin with a direct reason, support it with one concrete detail or example, and end by connecting that reason to the role or company. That structure makes the answer sound more thoughtful and convincing.';
  }

  if (/what |how /.test(normalizedQuestion)) {
    return 'A stronger answer should open with a direct response, then explain it in simple language and support it with one relevant example. Finishing with a short outcome or takeaway will make the answer clearer and more complete.';
  }

  return 'A stronger answer should start with the main point, add one specific example, and finish with a result or takeaway. That simple structure makes the answer easier to trust and easier to remember.';
};

export const getReadableSampleAnswer = (question, sampleAnswer) => {
  const current = String(sampleAnswer || '').trim();
  if (!current) return 'No sample answer available.';
  if (!isLegacyGenericSample(current)) return current;

  const normalizedQuestion = normalize(question);
  const template = sampleAnswerTemplates.find((item) => item.match.test(normalizedQuestion));
  if (template) return template.sample;

  return buildPatternSample(question);
};
