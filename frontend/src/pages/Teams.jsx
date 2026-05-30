import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function Teams() {
  const { isAdmin } = useClubRole();
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
      showToast("Αποτυχία φόρτωσης ομάδων", "error");
    }
  };

  const applyFilters = () => {
    let data = [...teams];
    if (search.trim()) {
      data = data.filter((tm) =>
        tm.name.toLowerCase().includes(search.toLowerCase())
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
      showToast("Αποτυχία δημιουργίας ομάδας", "error");
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
      showToast("Αποτυχία ενημέρωσης ομάδας", "error");
    }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm(t("confirmDeleteTeam"))) return;
    try {
      const clubId = requireClubId();
      await api.delete(`/teams/${clubId}/${id}`);
      loadTeams();
    } catch {
      showToast("Αποτυχία διαγραφής ομάδας", "error");
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
        <h1>{t("teams")}</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + {t("addTeam")}
          </button>
        )}
      </div>

      <div className="page-toolbar">
        <input
          className="page-input"
          placeholder={t("searchTeams")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="page-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="asc">{t("sortAsc")}</option>
          <option value="desc">{t("sortDesc")}</option>
        </select>
      </div>

      <div className="page-panel">
        {filtered.length === 0 ? (
          <p>{t("noTeamsFound")}</p>
        ) : (
          <>
            <table className="page-table">
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("category")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((tm) => (
                  <tr key={tm.id}>
                    <td>
                      <Link to={`/teams/${tm.id}`} className="page-link">
                        {tm.name}
                      </Link>
                    </td>
                    <td>{tm.category || "—"}</td>
                    <td>
                      <Link to={`/teams/${tm.id}`} className="btn-blue">
                        {t("view")}
                      </Link>
                      {isAdmin && (
                        <>
                          <button
                            className="btn-blue"
                            onClick={() => {
                              setEditTeam(tm);
                              setTeamName(tm.name);
                              setCategory(tm.category || "");
                              setShowEdit(true);
                            }}
                          >
                            {t("edit")}
                          </button>
                          <button className="btn-red" onClick={() => deleteTeam(tm.id)}>
                            {t("delete")}
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
        <Modal title={t("createTeam")} onClose={() => setShowAdd(false)}>
          <input
            className="modal-field"
            placeholder={t("teamName")}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder={t("categoryHint")}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button className="btn-primary" onClick={createTeam} style={{ marginRight: 10 }}>
            {t("save")}
          </button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}

      {showEdit && (
        <Modal title={t("editTeam")} onClose={() => setShowEdit(false)}>
          <input
            className="modal-field"
            placeholder={t("teamName")}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder={t("categoryHint")}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button className="btn-primary" onClick={updateTeam} style={{ marginRight: 10 }}>
            {t("update")}
          </button>
          <button className="btn-secondary" onClick={() => setShowEdit(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}
    </div>
  );
}
