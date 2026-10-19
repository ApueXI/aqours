import { useEffect, useState } from 'react';
import type { Attachment } from '@aqours/contracts';
import { apiBase, RequestError } from '../services/http-client';
import { Failure } from './Status';

export function AttachmentViewer({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const open = async () => {
    setBusy(true); setError(undefined);
    try {
      const response = await fetch(`${apiBase}/attachments/${attachment.id}`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 401) window.dispatchEvent(new Event('aqours-session-ended'));
        throw new RequestError(response.status, 'attachment_failed', 'This protected image could not be loaded. Refresh the report or try again.');
      }
      setUrl(URL.createObjectURL(await response.blob()));
    } catch (problem) { setError(problem); }
    finally { setBusy(false); }
  };
  return <article className="attachment [&_img]:block [&_img]:max-w-full [&_img]:max-h-[420px] [&_img]:[margin:12px_0] [&_img]:object-contain [padding:12px_0]"><p>{attachment.filename} · {(attachment.byteSize / 1024).toFixed(0)} KB</p>
    {url ? <><img src={url} alt={`Report attachment: ${attachment.filename}`} /><button type="button" onClick={() => setUrl(undefined)}>Close image</button></> :
      <button type="button" disabled={busy} onClick={() => void open()}>{busy ? 'Loading image…' : 'Open protected image'}</button>}
    <Failure error={error} />
  </article>;
}
