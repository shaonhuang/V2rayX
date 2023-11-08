import './App.css';
import Layout from './components/Layout';
import Navigation from './components/navigation/Navigation';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useLayoutEffect } from 'react';

import { useDispatch } from 'react-redux';
import { AppDispatch } from '@renderer/store';
import { readFromDb } from '@renderer/store/serversPageSlice';
// import { readFromDbInfo } from '@renderer/store/infoSlice';

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useLayoutEffect(() => {
    dispatch(readFromDb());
    // dispatch(readFromDbInfo());
  }, []);

  return (
    <div className="App h-screen bg-[#ebf2fc] dark:bg-slate-800">
      <Layout>
        <Navigation />
        <RouterProvider router={router} />
      </Layout>
    </div>
  );
}

export default App;
