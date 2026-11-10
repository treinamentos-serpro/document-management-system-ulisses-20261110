import { useState } from 'react';
import UploadComponent from '../components/UploadComponent.jsx';
import DocumentList from '../components/DocumentList.jsx';

export default function DocumentsPage() {
  const [owner, setOwner] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUploaded() {
    setRefreshKey((currentKey) => currentKey + 1);
  }

  return (
    <>
      <section>
        <label>
          Dono dos documentos:{' '}
          <input
            type="text"
            value={owner}
            placeholder="anonimo"
            onChange={(event) => setOwner(event.target.value)}
          />
        </label>
      </section>
      <UploadComponent owner={owner} onUploaded={handleUploaded} />
      <section>
        <h2>Documentos</h2>
        <DocumentList owner={owner} refreshKey={refreshKey} />
      </section>
    </>
  );
}
