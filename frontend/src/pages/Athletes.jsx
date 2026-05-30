import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";
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
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");

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

  const importCsv = async () => {
    const lines = csvText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const athletes = lines.map((line) => {
      const [full_name, email, position] = line.split(",").map((s) => s.trim());
      return { full_name, email, position };
    });
    try {
      const clubId = requireClubId();
      const res = await api.post(`/athletes/${clubId}/import`, { athletes });
      showToast(`${t("csvImportSuccess")}: ${res.data.created}`, "success");
      if (res.data.errors?.length) {
        showToast(`${res.data.errors.length} σφάλματα`, "info");
      }
      setShowImport(false);
      setCsvText("");
      loadAthletes();
    } catch {
      showToast("Αποτυχία εισαγωγής CSV", "error");
    }
  };

  const deleteAthlete = async (id) => {
    if (!window.confirm(t("confirmDeleteAthlete"))) return;
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
        <h1>{t("athletes")}</h1>
        {isAdmin && (
          <>
            <button className="btn-secondary" onClick={() => setShowImport(true)} style={{ marginRight: 8 }}>
              {t("importCsv")}
            </button>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              + {t("addAthlete")}
            </button>
          </>
        )}
      </div>

      <div className="page-toolbar">
        <input
          className="page-input"
          placeholder={t("searchAthletes")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="page-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="asc">{t("sortAsc")}</option>
          <option value="desc">{t("sortDesc")}</option>
        </select>
      </div>

      <div className="page-panel">
        {loading ? (
          <p>{t("loadingAthletes")}</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>{t("noAthletesFound")}</p>
            <p className="empty-hint">{t("athletesEmptyHint")}</p>
          </div>
        ) : (
          <>
            <table className="page-table">
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("email")}</th>
                  <th>{t("position")}</th>
                  <th>{t("actions")}</th>
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
                        {t("profile")}
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
                            {t("edit")}
                          </button>
                          <button className="btn-red" onClick={() => deleteAthlete(a.id)}>
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
        <Modal title={t("createAthlete")} onClose={() => setShowAdd(false)}>
          <input
            className="modal-field"
            placeholder={t("fullName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder={t("position")}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <button className="btn-primary" onClick={createAthlete} style={{ marginRight: 10 }}>
            {t("save")}
          </button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}

      {showImport && (
        <Modal title={t("importCsv")} onClose={() => setShowImport(false)}>
          <p style={{ fontSize: 14, color: "#6b7280" }}>{t("csvImportHint")}</p>
          <textarea
            className="modal-field"
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"Γιάννης Παπ., giannis@mail.gr, PG\nΜαρία Κ., maria@mail.gr, C"}
          />
          <button className="btn-primary" onClick={importCsv} style={{ marginRight: 10 }}>
            {t("importCsv")}
          </button>
          <button className="btn-secondary" onClick={() => setShowImport(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}

      {showEdit && (
        <Modal title={t("editAthlete")} onClose={() => setShowEdit(false)}>
          <input
            className="modal-field"
            placeholder={t("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="modal-field"
            placeholder={t("email")}
            value={email}
            disabled
            style={{ background: "#f3f4f6" }}
          />
          <input
            className="modal-field"
            placeholder={t("position")}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <button className="btn-primary" onClick={updateAthlete} style={{ marginRight: 10 }}>
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
