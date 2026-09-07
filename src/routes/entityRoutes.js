import AccountsPage from "pages/accounts";
import DealsPage from "pages/deals";
import TaskPage from "pages/tasks";
import MeetingPage from "pages/meeting";
import Attendance from "pages/attendance";
import Profile from "pages/profile";
import WorkPlace from "pages/workplaceNotes";
import Complaints from "pages/complaints";
import KnowledgeBase from "pages/knowledgeBase";
import Settings from "pages/settings";

// Registry of EspoCRM entity names (PascalCase, as the backend uses them)
// to the frontend page that renders the list + drawer for that entity.
//
// Add an entry here when you want a new page to support shareable
// deep-link URLs like /Account/view/:id, /Account/edit/:id, /Account/create.
export const ENTITY_REGISTRY = {
  Account: {
    component: AccountsPage,
    listPath: "/accounts",
  },
  Lead: {
    component: DealsPage,
    listPath: "/leads",
  },
  Task: {
    component: TaskPage,
    listPath: "/tasks",
  },
  Meeting: {
    component: MeetingPage,
    listPath: "/meeting",
  },
  CAttendanceRequest: {
    component: Attendance,
    listPath: "/attendance",
  },
  CProfileDetails: {
    component: Profile,
    listPath: "/profile",
  },
  CWorkplaceNotes: {
    component: WorkPlace,
    listPath: "/workplace",
  },
  Case: {
    component: Complaints,
    listPath: "/complaints",
  },
  KnowledgeBaseArticle: {
    component: KnowledgeBase,
    listPath: "/knowledge-base",
  },
  // Settings page hosts two tabs (Users & Teams). Both EspoCRM entities
  // map to the same page; the page reads :entity from the URL to pick the tab.
  User: {
    component: Settings,
    listPath: "/settings",
  },
  Team: {
    component: Settings,
    listPath: "/settings",
  },
};

export const getEntityConfig = (entity) => ENTITY_REGISTRY[entity];

// The notification dropdown can't import this file — it would create a cycle
// (this module pulls in every page, and pages render Header, which renders the
// dropdown). It reads ./linkableEntities.js instead. Warn in dev if the two
// drift apart, so a newly registered entity doesn't quietly stay unclickable.
if (import.meta.env?.DEV) {
  import("./linkableEntities.js").then(({ LINKABLE_ENTITIES }) => {
    const registered = Object.keys(ENTITY_REGISTRY);
    const missing = registered.filter((e) => !LINKABLE_ENTITIES.includes(e));
    const extra = LINKABLE_ENTITIES.filter((e) => !registered.includes(e));

    if (missing.length || extra.length) {
      console.warn(
        "[entityRoutes] linkableEntities.js is out of sync with ENTITY_REGISTRY.",
        { missingFromLinkable: missing, notRegistered: extra },
      );
    }
  });
}
