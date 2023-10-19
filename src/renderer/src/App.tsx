import './App.css';
import Layout from './components/Layout';
import Navigation from './components/navigation/Navigation';
import GernalSettings from './pages/Home';
import Servers from './pages/servers/Servers';
import About from './pages/About';
import Logs from './pages/Logs';
import { useAppSelector } from '@store/hooks';
import { useLayoutEffect } from 'react';

import { useDispatch } from 'react-redux';
import { AppDispatch } from '@renderer/store';
import { readFromDb } from '@renderer/store/serversPageSlice';
// import { readFromDbInfo } from '@renderer/store/infoSlice';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const tabName = useAppSelector((state) => state.navTab.tabName);

  useLayoutEffect(() => {
    dispatch(readFromDb());
    // dispatch(readFromDbInfo());
  }, []);

  return (
    <div className="App h-screen bg-[#ebf2fc] dark:bg-slate-800">
      <Layout>
        <Navigation />
        {(function (tabName: string): JSX.Element {
          switch (tabName) {
            case 'servers':
              return <Servers />;
            case 'about':
              return <About />;
            case 'logs':
              return <Logs />;
            case 'home':
            default:
              return <GernalSettings />;
          }
        })(tabName)}
      </Layout>
    </div>
  );
}

export default App;
