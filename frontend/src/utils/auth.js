import { showToast } from "./toast";

export function handleAuthSuccess(data, navigate) {
  const { token, user, club, clubs } = data;

  const clubList = clubs || (club ? [{
    club_id: club.id,
    club_name: club.name,
    role: "admin",
  }] : []);

  localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("clubs", JSON.stringify(clubList));

  if (clubList.length === 1) {
    localStorage.setItem("clubId", String(clubList[0].club_id));
    localStorage.setItem("clubName", clubList[0].club_name || "");
    localStorage.setItem("clubRole", clubList[0].role || "");
    navigate("/dashboard");
  } else if (clubList.length > 1) {
    navigate("/choose-club");
  } else {
    showToast("Δεν υπάρχει σύλλογος σε αυτόν τον λογαριασμό", "error");
  }
}
