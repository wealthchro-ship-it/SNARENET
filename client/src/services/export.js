const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function exportCasesToExcel() {
  const res = await fetch(`${API_URL}/api/admin/export`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    let message = 'Export failed';
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      /* not json */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] || `snarenet-cases-${new Date().toISOString().slice(0, 10)}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}