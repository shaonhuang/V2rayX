import './App.css';
import Layout from './components/Layout';
import Navigation from './components/navigation/Navigation';
import GernalSettings from './pages/Home';
import Servers from './pages/servers/Servers';
import Config from './pages/Config';
import { useAppSelector } from './store/hooks';
function App() {
  // FIXME: before commit
  const tabName = useAppSelector((state) => state.navTab.tabName);
  // tabName = 'servers';
  return (
    <div className="App">
      <Layout>
        <Navigation />
        <div className="h-14 w-full"></div>
        {(function (tabName: string): JSX.Element {
          switch (tabName) {
            case 'servers':
              return <Servers />;
            case 'config':
              return <Config></Config>;
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
