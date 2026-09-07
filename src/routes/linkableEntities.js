// Entity types that have a page + drawer behind /:entity/view/:id.
//
// This list is deliberately free of component imports. UI code (e.g. the
// notification dropdown) needs to ask "can I deep-link to this entity?"
// without pulling the page bundles in — importing entityRoutes.js from a
// component that pages themselves render creates an import cycle:
//
//   NotificationDropdown → entityRoutes → pages/accounts → ui/Header
//                        → NotificationDropdown
//
// which leaves entityRoutes half-initialised and blanks the screen with
// "Cannot access '<page>' before initialization".
//
// Keep in sync with ENTITY_REGISTRY in ./entityRoutes.js.
export const LINKABLE_ENTITIES = [
  "Account",
  "Lead",
  "Task",
  "Meeting",
  "CAttendanceRequest",
  "CProfileDetails",
  "CWorkplaceNotes",
  "Case",
  "KnowledgeBaseArticle",
  "User",
  "Team",
];

export const isLinkableEntity = (entity) =>
  Boolean(entity) && LINKABLE_ENTITIES.includes(entity);
