import { useState, useEffect, useRef } from 'react';

import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

function App() {
  const [rawCodeInput, setRawCodeInput] = useState('');
  const serviceRef = useRef<esbuild.Service>();
  const iframeRef = useRef<any>();

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

    iframeRef.current.srcdoc = html;

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

    // setTranspiledCode();
    iframeRef.current.contentWindow.postMessage(
      result.outputFiles[0].text,
      '*'
    );
  };

  const html = `
    <html>
      <head></head>
      <body>
        <div id="root"></div>
        <script>
          window.addEventListener('message', (event) => {
            try {
              eval(event.data);
            } catch (err) {
              const root = document.querySelector("#root");
              root.innerHTML = '<div style="color: red;"><h4>Runtime Error:</h4>' + err + '</div>';
            }
          }, false);
        </script>
      </body>
    </html>
  `;

  return (
    <div>
      <textarea
        value={rawCodeInput}
        onChange={(e) => setRawCodeInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onTranspileClick}>Transpile</button>
      </div>

      <iframe
        ref={iframeRef}
        srcDoc={html}
        sandbox='allow-scripts'
        title='code-output'
      />
    </div>
  );
}

export default App;
