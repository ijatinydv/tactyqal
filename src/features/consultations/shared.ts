// constrain relationship values shared by form and service boundaries
export const CONSULTATION_RELATIONSHIPS = ["parent_guardian", "adult_participant"] as const;

// keep inbox states consistent between stored records and admin controls
export const CONSULTATION_STATUSES = ["new", "reviewed", "closed"] as const;

// bound the number of private inbox rows returned to an editor
export const CONSULTATION_PAGE_SIZE = 20;
