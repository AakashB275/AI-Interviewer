import InterviewMessage from '../models/interviewMessage.js';

export async function saveMessage({ sessionId, role = 'candidate', message = '' } = {}) {
  if (!sessionId) throw new Error('sessionId is required');
  const m = await InterviewMessage.create({ sessionId, role, message });
  return m.toObject();
}

export async function getMessagesForSession(sessionId) {
  if (!sessionId) throw new Error('sessionId is required');
  return InterviewMessage.find({ sessionId }).sort({ createdAt: 1 }).lean();
}

export default { saveMessage, getMessagesForSession };
