import './App.css';
import Layout from './components/Layout';
import { useLayoutEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';

import { useDispatch } from 'react-redux';
import { AppDispatch } from '@renderer/store';
import { readFromDb } from '@renderer/store/serversPageSlice';
import { readFromDbSettings } from './store/settingsPageSlice';

import { loader } from '@monaco-editor/react';
// README https://github.com/suren-atoyan/monaco-react?tab=readme-ov-file#loader-config
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

loader.config({ monaco });

loader.init().then(/* ... */);

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useLayoutEffect(() => {
    dispatch(readFromDbSettings());
    dispatch(readFromDb());
  }, []);

  return (
    <div className={'App h-full bg-[#ebf2fc] dark:bg-slate-800'}>
      <Layout>
        <RouterProvider router={router} />
      </Layout>
    </div>
  );
}

export default App;
