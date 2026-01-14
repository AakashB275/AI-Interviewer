import InterviewMessage from '../models/interviewMessage.js';

export async function saveMessage({
  sessionId,
  role = 'candidate',
  content,
  message,
  messageType,
  jobRole,
  difficulty,
  sequence
} = {}) {
  if (!sessionId) throw new Error('sessionId is required');
  const finalContent = content ?? message ?? '';
  const m = await InterviewMessage.create({
    sessionId,
    role,
    content: String(finalContent),
    // Back-compat: also store message if provided
    ...(message != null ? { message: String(message) } : {}),
    ...(messageType ? { messageType } : {}),
    ...(jobRole ? { jobRole } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(typeof sequence === 'number' ? { sequence } : {})
  });
  return m.toObject();
}

export async function getMessagesForSession(sessionId) {
  if (!sessionId) throw new Error('sessionId is required');
  return InterviewMessage.find({ sessionId }).sort({ createdAt: 1 }).lean();
}

export default { saveMessage, getMessagesForSession };
