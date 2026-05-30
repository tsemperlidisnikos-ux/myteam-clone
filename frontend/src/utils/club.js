export function getClubId() {
  return localStorage.getItem("clubId");
}

export function getClubName() {
  return localStorage.getItem("clubName") || "MyTeam";
}

export function setActiveClub(club) {
  localStorage.setItem("clubId", String(club.club_id));
  localStorage.setItem("clubName", club.club_name || "");
  localStorage.setItem("clubRole", club.role || "");
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("clubId");
  localStorage.removeItem("clubName");
  localStorage.removeItem("clubRole");
  localStorage.removeItem("user");
  localStorage.removeItem("clubs");
}

export function saveAuthSession({ token, user, clubs }) {
  localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  if (clubs) localStorage.setItem("clubs", JSON.stringify(clubs));
}

export function getStoredClubs() {
  try {
    return JSON.parse(localStorage.getItem("clubs") || "[]");
  } catch {
    return [];
  }
}

export function syncClubRoleFromStorage() {
  const existing = localStorage.getItem("clubRole");
  if (existing) return existing;

  const clubId = getClubId();
  if (!clubId) return "";

  const club = getStoredClubs().find((c) => String(c.club_id) === String(clubId));
  if (club?.role) {
    localStorage.setItem("clubRole", club.role);
    return club.role;
  }
  return "";
}

export async function refreshClubRole() {
  const fromStorage = syncClubRoleFromStorage();
  if (fromStorage) return fromStorage;

  const clubId = getClubId();
  const userRaw = localStorage.getItem("user");
  if (!clubId || !userRaw) return "";

  try {
    const { default: api } = await import("../api/axios.js");
    const user = JSON.parse(userRaw);
    const res = await api.get(`/clubs/${clubId}/users`);
    const me = res.data.find((u) => u.id === user.id);
    if (me?.role) {
      localStorage.setItem("clubRole", me.role);
      return me.role;
    }
  } catch {
    // ignore
  }
  return getClubRole();
}

export function requireClubId() {
  const clubId = getClubId();
  if (!clubId) {
    throw new Error("No club selected");
  }
  return clubId;
}

export function getClubRole() {
  return localStorage.getItem("clubRole") || syncClubRoleFromStorage();
}

export function isAdmin() {
  return getClubRole() === "admin";
}

export function isStaff() {
  const role = getClubRole();
  return role === "admin" || role === "coach";
}
