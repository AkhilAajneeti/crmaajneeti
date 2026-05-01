import { canEntity, canGlobal } from "utils/permissions";

const RoleGuard = ({
  allowedRoles = [],
  entity,
  action = "read",
  permission,
  children,
}) => {
  if (entity && !canEntity(entity, action)) return null;
  if (permission && !canGlobal(permission)) return null;
  if (!allowedRoles.length) return children;

  const storedUser = localStorage.getItem("login_object");

  if (!storedUser) return null;

  const user = JSON.parse(storedUser);

  const userType = user?.type;
  const userRoles = user?.roles || [];

  const hasAccess =
    allowedRoles.includes(userType) ||
    userRoles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) return null;

  return children;
};

export default RoleGuard;
