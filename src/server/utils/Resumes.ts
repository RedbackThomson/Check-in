import { EventDocument } from '@Models/Event';

/**
 * Generate a list of query conditions for all applicants with publicly
 * accessible resumes. Resumes are only accessible if users have given
 * permission in their application.
 * @param event The event to create conditions for.
 */
export const getResumeConditions = (event: EventDocument) => ({
  'deleted': { $ne: true },
  'shareResume': true,
  'resume': { $exists: true },
  'resume.size': { $gt: 0 },
  'sanitized': true,
  'event': event,
});

export const RESUME_FIELDS = 'firstName lastName university year gender major' +
  ' resume.url status account';
