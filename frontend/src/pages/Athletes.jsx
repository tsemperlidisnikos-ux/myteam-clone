import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import "../styles/page.css";

export default function Athletes() {
  const { isAdmin } = useClubRole();
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [editAthlete, setEditAthlete] = useState(null);

  const loadAthletes = async () => {
    setLoading(true);
    try {
      const clubId = requireClubId();
      const res = await api.get(`/athletes/${clubId}`);
      setAthletes(res.data);
      setFiltered(res.data);
    } catch {
      showToast("Αποτυχία φόρτωσης αθλητών", "error");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let data = [...athletes];
    if (search.trim()) {
      data = data.filter((a) =>
        a.full_name.toLowerCase().includes(search.toLowerCase())
      );
    }
    data.sort((a, b) =>
      sort === "asc"
        ? a.full_name.localeCompare(b.full_name)
        : b.full_name.localeCompare(a.full_name)
    );
    setFiltered(data);
    setPage(1);
  };

  const createAthlete = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/athletes/${clubId}`, { full_name: name, email, position });
      setName("");
      setEmail("");
      setPosition("");
      setShowAdd(false);
      loadAthletes();
    } catch (err) {
      const msg = err.response?.data?.error;
      showToast(msg || "Αποτυχία δημιουργίας αθλητή", "error");
    }
  };

  const updateAthlete = async () => {
    try {
      const clubId = requireClubId();
      await api.put(`/athletes/${clubId}/${editAthlete.id}`, { full_name: name, position });
      setShowEdit(false);
      setEditAthlete(null);
      setName("");
      setEmail("");
      setPosition("");
      loadAthletes();
    } catch {
      showToast("Αποτυχία ενημέρωσης αθλητή", "error");
    }
  };

  const deleteAthlete = async (id) => {
    if (!window.confirm("Delete this athlete?")) return;
    try {
      const clubId = requireClubId();
      await api.delete(`/athletes/${clubId}/${id}`);
      loadAthletes();
    } catch {
      showToast("Αποτυχία διαγραφής αθλητή", "error");
    }
  };

  useEffect(() => {
    loadAthletes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, sort, athletes]);

  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div>
      <div className="page-header">
        <h1>Athletes</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + Add Athlete
          </button>
        )}
      </div>

      <div className="page-toolbar">
        <input
          className="page-input"
          placeholder="Search athletes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="page-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>

      <div className="page-panel">
        {loading ? (
          <p>Loading athletes...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No athletes found.</p>
            <p className="empty-hint">
              Click <strong>+ Add Athlete</strong> to create one. Then open their profile from
              the table (name or Profile button).
            </p>
          </div>
        ) : (
          <>
            <table className="page-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Position</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((a) => (
                  <tr
                    key={a.id}
                    className="clickable-row"
                    onClick={() => navigate(`/athletes/${a.id}`)}
                  >
                    <td>
                      <Link
                        to={`/athletes/${a.id}`}
                        className="page-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {a.full_name}
                      </Link>
                    </td>
                    <td>{a.email}</td>
                    <td>{a.position || "—"}</td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/athletes/${a.id}`} className="btn-blue btn-link-action">
                        Profile
                      </Link>
                      {isAdmin && (
                        <>
                          <button
                            className="btn-blue"
                            onClick={() => {
                              setEditAthlete(a);
                              setName(a.full_name);
                              setEmail(a.email);
                              setPosition(a.position || "");
                              setShowEdit(true);
                            }}
                          >
                            Edit
                          </button>
                          <button className="btn-red" onClick={() => deleteAthlete(a.id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="page-pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={n === page ? "page-page-btn active" : "page-page-btn"}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <Modal title="Create Athlete" onClose={() => setShowAdd(false)}>
          <input
            className="modal-field"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <button className="btn-primary" onClick={createAthlete} style={{ marginRight: 10 }}>
            Save
          </button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </button>
        </Modal>
      )}

      {showEdit && (
        <Modal title="Edit Athlete" onClose={() => setShowEdit(false)}>
          <input
            className="modal-field"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder="Email"
            value={email}
            disabled
            style={{ background: "#f3f4f6" }}
          />
          <input
            className="modal-field"
            placeholder="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <button className="btn-primary" onClick={updateAthlete} style={{ marginRight: 10 }}>
            Update
          </button>
          <button className="btn-secondary" onClick={() => setShowEdit(false)}>
            Cancel
          </button>
        </Modal>
      )}
    </div>
  );
}
