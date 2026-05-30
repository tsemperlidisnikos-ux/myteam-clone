import api from "../api/axios";

function uniqueById(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export async function loadParentChildren(clubId) {
  const res = await api.get(`/parents/${clubId}/children`);
  return res.data;
}

export async function loadParentTrainings(clubId) {
  const children = await loadParentChildren(clubId);
  const all = [];
  for (const child of children) {
    const res = await api.get(`/parents/${clubId}/children/${child.id}/trainings`);
    all.push(...res.data);
  }
  return uniqueById(all).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export async function loadParentMatches(clubId) {
  const children = await loadParentChildren(clubId);
  const all = [];
  for (const child of children) {
    const res = await api.get(`/parents/${clubId}/children/${child.id}/matches`);
    all.push(...res.data);
  }
  return uniqueById(all).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export async function getParentTeamIds(clubId) {
  const children = await loadParentChildren(clubId);
  return new Set(children.map((c) => c.team_id).filter(Boolean));
}
