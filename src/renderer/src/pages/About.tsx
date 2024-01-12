import { useState, useEffect } from 'react';
import { Button, Skeleton } from '@mui/material';
import icon from '../public/icon.png';
import { platform } from '@renderer/constant';
import { versionCompare } from '@renderer/utils/tools';
import { isDev } from '@renderer/constant';
import { useAppSelector } from '@renderer/store/hooks';

const AboutPage = (): JSX.Element => {
  const generalSettings = useAppSelector((state) => state.settingsPage.generalSettings);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const handleCheckUpdate = () => {
    platform === 'darwin' &&
      updateAvailable &&
      !isDev &&
      window.electron.electronAPI.shell.openExternal(
        'https://github.com/shaonhuang/V2rayX/releases',
      );
    window.api.send('v2rayx:checkForUpdateClick');
    window.update.checkForUpdate();
  };
  useEffect(() => {
    window.db.read('updateAvailableVersion').then((latestVersion) => {
      setUpdateAvailable(
        versionCompare(latestVersion, generalSettings.appVersion) &&
          generalSettings.appVersion !== '0.0.0',
      );
    });
  }, [generalSettings.appVersion]);
  return (
    <section className="flex flex-1 flex-row items-center justify-around">
      <div className={'items-center justify-around rounded-xl bg-white p-9 dark:bg-slate-700'}>
        <div className="m-4 flex flex-col items-center">
          <img src={icon} alt="" className="m-4 h-24 w-24" />
          <p className="flex text-xl" id="appVersion">
            {generalSettings.appVersion === '0.0.0' ? (
              <Skeleton width={64} />
            ) : (
              `V2rayX(${generalSettings.appVersion})`
            )}
          </p>
        </div>
        <p>An all platform (Macos Windows Linux) V2ray client build with electron.</p>
        <div className="my-4 flex flex-row gap-2">
          <Button variant="outlined" className="relative" onClick={handleCheckUpdate}>
            CHECK UPDATE
            {updateAvailable ? (
              <span className="absolute right-[-4px] top-[-4px] h-2 w-2 rounded-full bg-blue-400"></span>
            ) : null}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              window.electron.electronAPI.shell.openExternal('https://github.com/shaonhuang/V2rayX');
            }}
          >
            HOMEPAGE
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              window.electron.electronAPI.shell.openExternal('https://t.me/V2rayX_electron');
            }}
          >
            FEEDBACK
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              window.electron.electronAPI.shell.openExternal(
                'https://github.com/shaonhuang/V2rayX#ii-features',
              );
            }}
          >
            ROADMAP
          </Button>
        </div>
      </div>
    </section>
  );
};
export default AboutPage;
