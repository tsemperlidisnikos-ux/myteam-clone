import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import { showToast } from "../utils/toast";
import "../styles/page.css";

const emptyForm = {
  full_name: "",
  date_of_birth: "",
  height_cm: "",
  weight_kg: "",
  position: "",
  medical_notes: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
};

export default function AthleteProfile() {
  const { athleteId } = useParams();
  const [profile, setProfile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError("Athlete not found");
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
        parent_name: p.parent_name || "",
        parent_phone: p.parent_phone || "",
        parent_email: p.parent_email || "",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load athlete profile");
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

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (error || !profile) {
    return (
      <div>
        <Link to="/athletes" className="page-back">
          ← Back to Athletes
        </Link>
        <div className="page-panel" style={{ marginTop: 16 }}>
          <p className="form-error">{error || "Athlete not found"}</p>
          <Link to="/athletes" className="btn-primary" style={{ display: "inline-block", marginTop: 12 }}>
            Back to Athletes list
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
      <Link to="/athletes" className="page-back">
        ← Back to Athletes
      </Link>

      <div className="page-header">
        <h1>{profile.full_name}</h1>
        {!editing ? (
          <button className="btn-primary" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        ) : (
          <div>
            <button className="btn-primary" onClick={save} disabled={saving} style={{ marginRight: 10 }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setEditing(false);
                load();
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="page-panel">
          <h2>Personal</h2>
          {field("Full name", "full_name")}
          {!editing && (
            <p>
              <strong>Email:</strong> {profile.email}
            </p>
          )}
          {field("Date of birth", "date_of_birth", "date")}
          {field("Position", "position")}
          {field("Height (cm)", "height_cm", "number")}
          {field("Weight (kg)", "weight_kg", "number")}
          {field("Medical notes", "medical_notes", "textarea")}
        </div>

        <div className="page-panel">
          <h2>Parent / Guardian</h2>
          {field("Name", "parent_name")}
          {field("Phone", "parent_phone", "tel")}
          {field("Email", "parent_email", "email")}

          <h2 style={{ marginTop: 24 }}>Teams</h2>
          {teams.length === 0 ? (
            <p>Not assigned to any team.</p>
          ) : (
            <ul className="team-list">
              {teams.map((t) => (
                <li key={t.id}>
                  <Link to={`/teams/${t.id}`} className="page-link">
                    {t.name}
                  </Link>
                  {t.category && <span className="team-cat"> ({t.category})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
