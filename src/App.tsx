import { useState, useEffect, useRef } from 'react';

import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

function App() {
  const [rawCodeInput, setRawCodeInput] = useState('');
  const [transpiledCode, setTranspiledCode] = useState('');
  const serviceRef = useRef<esbuild.Service>();

  const startService = async () => {
    serviceRef.current = await esbuild.startService({
      worker: true,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
    });
  };

  useEffect(() => {
    startService();
  }, []);

  const onTranspileClick = async () => {
    if (!serviceRef.current) return;

    const result = await serviceRef.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(rawCodeInput)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });

    setTranspiledCode(result.outputFiles[0].text);
  };

  return (
    <div>
      <textarea
        value={rawCodeInput}
        onChange={(e) => setRawCodeInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onTranspileClick}>Transpile</button>
      </div>
      <pre>{transpiledCode}</pre>
    </div>
  );
}

export default App;
