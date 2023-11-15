import './App.css';
import Layout from './components/Layout';
import { useLayoutEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';

import { useDispatch } from 'react-redux';
import { AppDispatch } from '@renderer/store';
import { readFromDb } from '@renderer/store/serversPageSlice';
import { isMac } from '@renderer/constant';

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useLayoutEffect(() => {
    dispatch(readFromDb());
  }, []);

  return (
    <div className={`App h-full ${isMac ? '' : 'bg-[#ebf2fc] dark:bg-slate-800'}`}>
      <Layout>
        <RouterProvider router={router} />
      </Layout>
    </div>
  );
}

export default App;
