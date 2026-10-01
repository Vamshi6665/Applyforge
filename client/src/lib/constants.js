export const SECTIONS = [
  { id: 'email', label: 'Recruiter email', short: 'Email' },
  { id: 'linkedin', label: 'LinkedIn note', short: 'LinkedIn' },
  { id: 'resume', label: 'Resume bullets', short: 'Resume' },
  { id: 'coverLetter', label: 'Cover letter', short: 'Cover letter' },
  { id: 'followUp', label: 'Follow-up email', short: 'Follow-up' },
];

export const sectionLabel = (id) => SECTIONS.find((s) => s.id === id)?.label || 'Draft';

export const TONES = [
  { id: 'metrics', label: 'Metrics first' },
  { id: 'concise', label: 'Concise' },
];

export const STATUSES = [
  { id: 'drafted', label: 'Drafted' },
  { id: 'sent', label: 'Sent' },
  { id: 'followed-up', label: 'Followed up' },
  { id: 'interview', label: 'Interviewing' },
  { id: 'offer', label: 'Offer' },
  { id: 'closed', label: 'Closed' },
];

export const FOLLOW_UP_DAYS = 5;

export const QUICK_ASKS = {
  edit: ['Make it shorter', 'Lead with a metric', 'Sound warmer', 'More formal'],
  general: ['What should I emphasize?', 'Likely interview questions', 'How do I address the gaps?'],
};

export const LINKEDIN_LIMIT = 300;
