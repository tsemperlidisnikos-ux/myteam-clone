import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import { t } from "../i18n/el";
import { showToast } from "../utils/toast";
import "../styles/page.css";

const emptyForm = {
  full_name: "",
  date_of_birth: "",
  height_cm: "",
  weight_kg: "",
  position: "",
  medical_notes: "",
  medical_cert_expires: "",
  injury_status: "",
  injury_since: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
};

export default function AthleteProfile() {
  const { athleteId } = useParams();
  const { isParent, isStaff } = useClubRole();
  const [profile, setProfile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [parentCodeInfo, setParentCodeInfo] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const clubId = requireClubId();
      const [pRes, tRes] = await Promise.all([
        api.get(`/athletes/${clubId}/${athleteId}`),
        api.get(`/athletes/${clubId}/${athleteId}/teams`),
      ]);
      const p = pRes.data;
      if (!p?.id) {
        setError(t("athleteNotFound"));
        setProfile(null);
        return;
      }
      setProfile(p);
      setTeams(tRes.data);
      setForm({
        full_name: p.full_name || "",
        date_of_birth: p.date_of_birth?.slice?.(0, 10) || "",
        height_cm: p.height_cm ?? "",
        weight_kg: p.weight_kg ?? "",
        position: p.position || "",
        medical_notes: p.medical_notes || "",
        medical_cert_expires: p.medical_cert_expires?.slice?.(0, 10) || "",
        injury_status: p.injury_status || "",
        injury_since: p.injury_since?.slice?.(0, 10) || "",
        parent_name: p.parent_name || "",
        parent_phone: p.parent_phone || "",
        parent_email: p.parent_email || "",
      });
    } catch (err) {
      setError(err.response?.data?.error || t("failedLoadProfile"));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [athleteId]);

  const save = async () => {
    setSaving(true);
    try {
      const clubId = requireClubId();
      await api.put(`/athletes/${clubId}/${athleteId}`, {
        full_name: form.full_name,
        date_of_birth: form.date_of_birth || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        position: form.position || null,
        medical_notes: form.medical_notes || null,
        medical_cert_expires: form.medical_cert_expires || null,
        injury_status: form.injury_status || null,
        injury_since: form.injury_since || null,
        parent_name: form.parent_name || null,
        parent_phone: form.parent_phone || null,
        parent_email: form.parent_email || null,
      });
      setEditing(false);
      load();
    } catch {
      showToast("Αποτυχία αποθήκευσης προφίλ", "error");
    } finally {
      setSaving(false);
    }
  };

  const generateParentCode = async () => {
    setGeneratingCode(true);
    try {
      const clubId = requireClubId();
      const res = await api.post(`/parents/${clubId}/athletes/${athleteId}/parent-code`);
      setParentCodeInfo(res.data);
      showToast(t("parentCodeGenerated"), "success");
    } catch {
      showToast("Αποτυχία δημιουργίας κωδικού", "error");
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyRegisterLink = async () => {
    if (!parentCodeInfo?.register_url) return;
    try {
      await navigator.clipboard.writeText(parentCodeInfo.register_url);
      showToast(t("copyLink"), "success");
    } catch {
      showToast(parentCodeInfo.register_url, "info");
    }
  };

  if (loading) {
    return <p>{t("loadingProfile")}</p>;
  }

  if (error || !profile) {
    return (
      <div>
        <Link to="/athletes" className="page-back">
          {t("backToAthletes")}
        </Link>
        <div className="page-panel" style={{ marginTop: 16 }}>
          <p className="form-error">{error || t("athleteNotFound")}</p>
          <Link to="/athletes" className="btn-primary" style={{ display: "inline-block", marginTop: 12 }}>
            {t("backToAthletesList")}
          </Link>
        </div>
      </div>
    );
  }

  const field = (label, key, type = "text") =>
    editing ? (
      <div className="profile-field">
        <label>{label}</label>
        {type === "textarea" ? (
          <textarea
            className="modal-field"
            rows={3}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ) : (
          <input
            type={type}
            className="modal-field"
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        )}
      </div>
    ) : (
      <p>
        <strong>{label}:</strong> {form[key] || "—"}
      </p>
    );

  return (
    <div>
      <Link to={isStaff ? "/athletes" : "/dashboard"} className="page-back">
        ← {isStaff ? t("athletes") : t("dashboard")}
      </Link>

      <div className="page-header">
        <h1>{profile.full_name}</h1>
        {!editing && !isParent ? (
          <div>
            {isStaff && (
              <button
                className="btn-secondary"
                onClick={generateParentCode}
                disabled={generatingCode}
                style={{ marginRight: 10 }}
              >
                {generatingCode ? t("saving") : t("generateParentCode")}
              </button>
            )}
            <button className="btn-primary" onClick={() => setEditing(true)}>
              {t("editProfile")}
            </button>
          </div>
        ) : editing ? (
          <div>
            <button className="btn-primary" onClick={save} disabled={saving} style={{ marginRight: 10 }}>
              {saving ? t("saving") : t("save")}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setEditing(false);
                load();
              }}
            >
              {t("cancel")}
            </button>
          </div>
        ) : null}
      </div>

      {parentCodeInfo && isStaff && (
        <div className="page-panel" style={{ marginBottom: 16 }}>
          <p>
            <strong>{t("parentCode")}:</strong> {parentCodeInfo.code}
          </p>
          <p style={{ fontSize: 14, color: "#6b7280", wordBreak: "break-all" }}>
            {parentCodeInfo.register_url}
          </p>
          <button type="button" className="btn-secondary btn-sm" onClick={copyRegisterLink}>
            {t("copyLink")}
          </button>
        </div>
      )}

      <div className="detail-grid">
        <div className="page-panel">
          <h2>{t("personal")}</h2>
          {field(t("fullName"), "full_name")}
          {!editing && (
            <p>
              <strong>{t("email")}:</strong> {profile.email}
            </p>
          )}
          {field(t("dateOfBirth"), "date_of_birth", "date")}
          {field(t("position"), "position")}
          {field(t("heightCm"), "height_cm", "number")}
          {field(t("weightKg"), "weight_kg", "number")}
          {field(t("medicalNotes"), "medical_notes", "textarea")}
          {field(t("certExpiry"), "medical_cert_expires", "date")}
          {field(t("injuryStatus"), "injury_status")}
          {field(t("injurySince"), "injury_since", "date")}
        </div>

        <div className="page-panel">
          <h2>{t("parentGuardian")}</h2>
          {field(t("name"), "parent_name")}
          {field(t("phone"), "parent_phone", "tel")}
          {field(t("email"), "parent_email", "email")}

          <h2 style={{ marginTop: 24 }}>{t("teams")}</h2>
          {teams.length === 0 ? (
            <p>{t("notOnTeam")}</p>
          ) : (
            <ul className="team-list">
              {teams.map((team) => (
                <li key={team.id}>
                  <Link to={`/teams/${team.id}`} className="page-link">
                    {team.name}
                  </Link>
                  {team.category && <span className="team-cat"> ({team.category})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
