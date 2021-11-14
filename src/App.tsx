import { useState, useEffect, useRef } from 'react';

import * as esbuild from 'esbuild-wasm';

function App() {
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const serviceRef = useRef<esbuild.Service>();

  const startService = async () => {
    serviceRef.current = await esbuild.startService({
      worker: true,
      wasmURL: '/esbuild.wasm',
    });
  };

  useEffect(() => {
    startService();
  }, []);

  const onTranspileClick = async () => {
    if (!serviceRef.current) return;

    const result = await serviceRef.current.transform(input, {
      loader: 'jsx',
      target: 'es2015',
    });

    setCode(result.code);
  };

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onTranspileClick}>Transpile</button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}

export default App;
