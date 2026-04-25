const byDifficulty = (items, category, tags = []) =>
  items.map((text, index) => ({
    text,
    category,
    difficulty: index % 3 === 0 ? 'Easy' : index % 3 === 1 ? 'Medium' : 'Hard',
    tags
  }));

const hr = [
  'Tell me about yourself',
  'What are your greatest strengths?',
  'What is your biggest weakness?',
  'Where do you see yourself in 5 years?',
  'Why do you want to work here?',
  'Describe a challenge you faced and how you overcame it',
  'Why should we hire you?',
  'What motivates you?',
  'How do you handle stress and pressure?',
  'Describe your ideal work environment',
  'What are your salary expectations?',
  'How do you prioritize your work?',
  'Tell me about a time you failed',
  'What makes you unique?',
  'Do you prefer working alone or in a team?'
];

const behavioural = [
  'Tell me about a time you showed leadership',
  'Describe a situation where you had to work with a difficult teammate',
  'Give an example of a goal you set and achieved',
  'Tell me about a time you had to learn something quickly',
  'Describe a time you went above and beyond',
  'Tell me about a time you disagreed with your manager',
  'Give an example of how you handled multiple deadlines',
  'Describe a time you took initiative',
  'Tell me about a time you made a mistake at work',
  'Give an example of how you handled an angry customer or stakeholder',
  'Describe a situation where you had to adapt to change',
  'Tell me about a time you mentored someone',
  'Give an example of creative problem solving',
  'Describe a time you had to make a decision with limited information',
  'Tell me about your most successful project',
  'Give an example of how you handled a conflict at work',
  'Describe a time you improved a process',
  'Tell me about a time you worked under pressure',
  'Give an example of how you built a relationship with a colleague',
  'Describe your biggest professional achievement'
];

const technical = [
  'Explain the difference between SQL and NoSQL databases',
  'What is REST API and what are its principles?',
  'Explain the concept of Object Oriented Programming',
  'What is the difference between process and thread?',
  'Explain how HTTP works',
  'What is a deadlock and how do you prevent it?',
  'Explain time complexity and Big O notation',
  'What is the difference between stack and heap memory?',
  'Explain what happens when you type a URL in a browser',
  'What is indexing in databases?',
  'Explain the concept of normalization',
  'What is the difference between TCP and UDP?',
  'Explain recursion with an example',
  'What is a RESTful API vs GraphQL?',
  'Explain the MVC architecture pattern'
];

const mixed = [
  'How do you stay updated with technology trends?',
  'Describe your problem solving approach',
  'What programming languages are you comfortable with?',
  'Explain a technical concept to a non-technical person',
  'How do you handle code reviews?',
  'What is agile methodology?',
  'How do you approach debugging a complex issue?',
  'Describe your experience with version control',
  'How do you ensure code quality?',
  'What is your approach to learning new technologies?'
];

export const questions = [
  ...byDifficulty(hr, 'HR', ['hr']),
  ...byDifficulty(behavioural, 'Behavioural', ['star', 'behavioural']),
  ...byDifficulty(technical, 'Technical', ['technical']),
  ...byDifficulty(mixed, 'Mixed', ['general'])
];

export const seedQuestions = async (Question) => {
  const count = await Question.countDocuments();
  if (count > 0) {
    console.log(`Question bank already seeded with ${count} questions`);
    return;
  }

  await Question.insertMany(questions);
  console.log(`Seeded ${questions.length} interview questions`);
};
