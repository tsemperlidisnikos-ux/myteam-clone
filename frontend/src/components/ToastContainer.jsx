import { useEffect, useState } from "react";
import { subscribeToast } from "../utils/toast";
import "../styles/toast.css";

export default function ToastContainer() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    subscribeToast(setToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      {toast.message}
    </div>
  );
}
