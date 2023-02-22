import './App.css';
import Layout from './components/Layout';
import Navigation from './components/navigation/Navigation';
import GernalSettings from './pages/Home';
import Config from './pages/Config';
import { useAppSelector } from './store/hooks';
function App() {
  const tabName = useAppSelector((state) => state.navTab.tabName);
  return (
    <div className="App dark:bg-slate-800 dark:text-white">
      <Layout>
        <Navigation />
        <hr />
        {(function (tabName: string): JSX.Element {
          switch (tabName) {
            case 'config':
              return <Config></Config>;
            case 'home':
            default:
              return <GernalSettings />;
          }
        })(tabName)}
        <div className="text-black dark:text-white">hello</div>
      </Layout>
    </div>
  );
}

export default App;
