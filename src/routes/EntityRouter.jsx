import React from "react";
import { useParams } from "react-router-dom";
import NotFound from "pages/NotFound";
import { getEntityConfig } from "./entityRoutes";

// Resolves EspoCRM-style URLs to the matching frontend page.
// Examples:
//   /Account/view/6a16...    → renders AccountsPage with drawer in view mode
//   /Account/edit/6a16...    → renders AccountsPage with drawer in edit mode
//   /Account/create          → renders AccountsPage with drawer in create mode
//
// The destination page itself reads useParams() to drive its drawer state
// from the URL — this component just picks which page component to render.
const EntityRouter = () => {
  const { entity } = useParams();
  const config = getEntityConfig(entity);

  if (!config) return <NotFound />;

  const PageComponent = config.component;
  return <PageComponent />;
};

export default EntityRouter;
