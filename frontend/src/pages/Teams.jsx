import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import Modal from "../components/Modal";
import "../styles/page.css";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [category, setCategory] = useState("");
  const [editTeam, setEditTeam] = useState(null);

  const loadTeams = async () => {
    try {
      const clubId = requireClubId();
      const res = await api.get(`/teams/${clubId}`);
      setTeams(res.data);
      setFiltered(res.data);
    } catch {
      console.error("Failed to load teams");
    }
  };

  const applyFilters = () => {
    let data = [...teams];
    if (search.trim()) {
      data = data.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    data.sort((a, b) =>
      sort === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
    setFiltered(data);
    setPage(1);
  };

  const createTeam = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/teams/${clubId}`, { name: teamName, category: category || null });
      setTeamName("");
      setCategory("");
      setShowAdd(false);
      loadTeams();
    } catch {
      alert("Failed to create team");
    }
  };

  const updateTeam = async () => {
    try {
      const clubId = requireClubId();
      await api.put(`/teams/${clubId}/${editTeam.id}`, {
        name: teamName,
        category: category || null,
      });
      setShowEdit(false);
      setEditTeam(null);
      setTeamName("");
      setCategory("");
      loadTeams();
    } catch {
      alert("Failed to update team");
    }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm("Delete this team?")) return;
    try {
      const clubId = requireClubId();
      await api.delete(`/teams/${clubId}/${id}`);
      loadTeams();
    } catch {
      alert("Failed to delete team");
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, sort, teams]);

  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div>
      <div className="page-header">
        <h1>Teams</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add Team
        </button>
      </div>

      <div className="page-toolbar">
        <input
          className="page-input"
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="page-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>

      <div className="page-panel">
        {filtered.length === 0 ? (
          <p>No teams found.</p>
        ) : (
          <>
            <table className="page-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/teams/${t.id}`} className="page-link">
                        {t.name}
                      </Link>
                    </td>
                    <td>{t.category || "—"}</td>
                    <td>
                      <Link to={`/teams/${t.id}`} className="btn-blue">
                        View
                      </Link>
                      <button
                        className="btn-blue"
                        onClick={() => {
                          setEditTeam(t);
                          setTeamName(t.name);
                          setCategory(t.category || "");
                          setShowEdit(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn-red" onClick={() => deleteTeam(t.id)}>
                        Delete
                      </button>
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
        <Modal title="Create Team" onClose={() => setShowAdd(false)}>
          <input
            className="modal-field"
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder="Category (e.g. U16)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button className="btn-primary" onClick={createTeam} style={{ marginRight: 10 }}>
            Save
          </button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </button>
        </Modal>
      )}

      {showEdit && (
        <Modal title="Edit Team" onClose={() => setShowEdit(false)}>
          <input
            className="modal-field"
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder="Category (e.g. U16)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button className="btn-primary" onClick={updateTeam} style={{ marginRight: 10 }}>
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
