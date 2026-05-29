let listener = null;

export function subscribeToast(fn) {
  listener = fn;
}

export function showToast(message, type = "info") {
  listener?.({ message, type, id: Date.now() });
}
