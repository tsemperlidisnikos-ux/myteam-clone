import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import "../styles/page.css";

const STATUSES = ["present", "absent", "late"];

export default function TrainingDetail() {
  const { trainingId } = useParams();
  const [training, setTraining] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [saving, setSaving] = useState(null);

  const load = async () => {
    try {
      const clubId = requireClubId();
      const [tRes, aRes] = await Promise.all([
        api.get(`/trainings/${clubId}/${trainingId}`),
        api.get(`/trainings/${clubId}/${trainingId}/attendance`),
      ]);
      setTraining(tRes.data);
      setAttendance(aRes.data);
    } catch {
      alert("Failed to load training");
    }
  };

  useEffect(() => {
    load();
  }, [trainingId]);

  const markAttendance = async (athleteId, status) => {
    setSaving(athleteId);
    try {
      const clubId = requireClubId();
      await api.post(`/trainings/${clubId}/${trainingId}/attendance`, {
        athlete_id: athleteId,
        status,
        comment: null,
      });
      setAttendance((prev) =>
        prev.map((a) => (a.id === athleteId ? { ...a, status } : a))
      );
    } catch {
      alert("Failed to save attendance");
    } finally {
      setSaving(null);
    }
  };

  if (!training) {
    return <p>Loading...</p>;
  }

  const dateStr = training.date?.slice?.(0, 10) ?? training.date;

  return (
    <div>
      <Link to="/trainings" className="page-back">
        ← Back to Trainings
      </Link>

      <div className="page-header">
        <h1>Training — {dateStr}</h1>
      </div>

      <div className="page-panel detail-meta">
        <p>
          <strong>Time:</strong> {training.start_time?.slice?.(0, 5)} –{" "}
          {training.end_time?.slice?.(0, 5)}
        </p>
        <p>
          <strong>Location:</strong> {training.location || "—"}
        </p>
        <p>
          <strong>Coach:</strong> {training.coach_name}
        </p>
        {training.notes && (
          <p>
            <strong>Notes:</strong> {training.notes}
          </p>
        )}
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 12 }}>Attendance</h2>

      <div className="page-panel">
        {attendance.length === 0 ? (
          <p>No athletes on this team roster.</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Athlete</th>
                <th>Status</th>
                <th>Mark</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/athletes/${a.id}`} className="page-link">
                      {a.full_name}
                    </Link>
                  </td>
                  <td>
                    <span className={`status-badge status-${a.status}`}>{a.status}</span>
                  </td>
                  <td className="attendance-actions">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={
                          a.status === s ? `attendance-btn active-${s}` : "attendance-btn"
                        }
                        disabled={saving === a.id}
                        onClick={() => markAttendance(a.id, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
