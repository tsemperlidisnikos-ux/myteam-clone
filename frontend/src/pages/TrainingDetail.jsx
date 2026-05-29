import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import "../styles/page.css";

const STATUSES = ["present", "absent", "late"];

export default function TrainingDetail() {
  const { trainingId } = useParams();
  const [training, setTraining] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseForm, setExerciseForm] = useState({
    title: "",
    description: "",
    duration_minutes: "",
  });

  const load = async () => {
    try {
      const clubId = requireClubId();
      const [tRes, aRes, eRes] = await Promise.all([
        api.get(`/trainings/${clubId}/${trainingId}`),
        api.get(`/trainings/${clubId}/${trainingId}/attendance`),
        api.get(`/trainings/${clubId}/${trainingId}/exercises`),
      ]);
      setTraining(tRes.data);
      setAttendance(aRes.data);
      setExercises(eRes.data);
    } catch {
      showToast("Failed to load training", "error");
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
      showToast("Failed to save attendance", "error");
    } finally {
      setSaving(null);
    }
  };

  const addExercise = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/trainings/${clubId}/${trainingId}/exercises`, {
        title: exerciseForm.title,
        description: exerciseForm.description || null,
        duration_minutes: exerciseForm.duration_minutes
          ? Number(exerciseForm.duration_minutes)
          : null,
      });
      setShowAddExercise(false);
      setExerciseForm({ title: "", description: "", duration_minutes: "" });
      showToast("Exercise added", "success");
      load();
    } catch {
      showToast("Failed to add exercise", "error");
    }
  };

  const removeExercise = async (exerciseId) => {
    if (!window.confirm("Delete this exercise?")) return;
    try {
      const clubId = requireClubId();
      await api.delete(`/trainings/${clubId}/${trainingId}/exercises/${exerciseId}`);
      showToast("Exercise removed", "success");
      load();
    } catch {
      showToast("Failed to delete exercise", "error");
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

      <div className="page-header" style={{ marginTop: 24 }}>
        <h2>Exercises</h2>
        <button className="btn-primary btn-sm" onClick={() => setShowAddExercise(true)}>
          + Add Exercise
        </button>
      </div>

      <div className="page-panel" style={{ marginBottom: 24 }}>
        {exercises.length === 0 ? (
          <p>No exercises planned.</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Duration</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr key={ex.id}>
                  <td>{ex.title}</td>
                  <td>{ex.duration_minutes ? `${ex.duration_minutes} min` : "—"}</td>
                  <td>{ex.description || "—"}</td>
                  <td>
                    <button className="btn-red" onClick={() => removeExercise(ex.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 style={{ marginBottom: 12 }}>Attendance</h2>

      <div className="page-panel">
        {attendance.length === 0 ? (
          <p>
            No athletes on this team roster.{" "}
            <Link to={`/teams/${training.team_id}`} className="page-link">
              Add athletes to the team
            </Link>
            .
          </p>
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

      {showAddExercise && (
        <Modal title="Add Exercise" onClose={() => setShowAddExercise(false)}>
          <input
            className="modal-field"
            placeholder="Title (e.g. Shooting drills)"
            value={exerciseForm.title}
            onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })}
          />
          <input
            type="number"
            min="1"
            className="modal-field"
            placeholder="Duration (minutes)"
            value={exerciseForm.duration_minutes}
            onChange={(e) =>
              setExerciseForm({ ...exerciseForm, duration_minutes: e.target.value })
            }
          />
          <textarea
            className="modal-field"
            rows={3}
            placeholder="Description"
            value={exerciseForm.description}
            onChange={(e) =>
              setExerciseForm({ ...exerciseForm, description: e.target.value })
            }
          />
          <button className="btn-primary" onClick={addExercise} style={{ marginRight: 10 }}>
            Add
          </button>
          <button className="btn-secondary" onClick={() => setShowAddExercise(false)}>
            Cancel
          </button>
        </Modal>
      )}
    </div>
  );
}
