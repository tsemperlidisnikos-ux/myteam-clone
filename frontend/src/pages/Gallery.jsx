import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";
import "../styles/page.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Gallery() {
  const { isStaff } = useClubRole();
  const [items, setItems] = useState([]);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);

  const load = async () => {
    const clubId = requireClubId();
    const res = await api.get(`/gallery/${clubId}`);
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async () => {
    if (!file) return;
    try {
      const clubId = requireClubId();
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("caption", caption);
      await api.post(`/gallery/${clubId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setCaption("");
      load();
    } catch {
      showToast(t("uploadFailed"), "error");
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("confirmDeletePhoto"))) return;
    const clubId = requireClubId();
    await api.delete(`/gallery/${clubId}/${id}`);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t("gallery")}</h1>
      </div>

      {isStaff && (
        <div className="page-panel" style={{ marginBottom: 16 }}>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} />
          <input
            className="modal-field"
            placeholder={t("caption")}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <button className="btn-primary" onClick={upload} disabled={!file}>
            {t("uploadPhoto")}
          </button>
        </div>
      )}

      <div className="gallery-grid">
        {items.length === 0 ? (
          <p>{t("noPhotos")}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="gallery-card">
              <img src={`${API_BASE}${item.file_url}`} alt={item.caption || ""} />
              {item.caption && <p>{item.caption}</p>}
              {isStaff && (
                <button className="btn-red btn-sm" onClick={() => remove(item.id)}>
                  {t("delete")}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
