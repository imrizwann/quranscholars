// Each account type has Profile and Settings inside its own workspace.
export const accountBase = role => (role === "admin" ? "/admin" : role === "instructor" ? "/instructor" : "/dashboard");
export const profilePath = role => `${accountBase(role)}/profile`;
export const settingsPath = role => `${accountBase(role)}/settings`;
