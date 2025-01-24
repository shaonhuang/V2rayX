import { message } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button } from '@heroui/react';
import { UPDATER_ACTIVE } from '~/api';
import * as _ from 'lodash';

export async function checkForAppUpdates(
  t: ReturnType<typeof useTranslation>['t'],
  onUserClick: boolean,
): Promise<boolean> {
  if (!UPDATER_ACTIVE) return false;
  try {
    const update = await check();
    if (update === null) {
      await message(
        t('Failed to check for updates.\nPlease try again later.'),
        {
          title: 'Error',
          kind: 'error',
          okLabel: 'OK',
        },
      );
    } else if (update?.available) {
      toast((t) => (
        <div className="flex-col items-center justify-center gap-2">
          <p className="mx-auto w-fit">{`Update to ${update.version} is available!`}</p>
          <p className="w-fit py-2">{`Release notes: ${update.body}`}</p>
          <Button
            className="w-full"
            onPress={async () => {
              let contentLength = 10000000;
              let downloadedChunks = 0;
              const toastDownloading = _.throttle(
                (percentage) => toast.loading(`Downloading... ${percentage}%`),
                800,
              );
              await update.downloadAndInstall(
                (progress) => {
                  if (progress.event === 'Progress') {
                    downloadedChunks += progress.data.chunkLength;
                    const percentage = Math.floor(
                      (downloadedChunks / contentLength) * 100,
                    );
                    toastDownloading(percentage);
                  } else if (progress.event === 'Started') {
                    contentLength = progress.data.contentLength ?? 10000000;
                    toast.success('Start Downloading!');
                  } else if (progress.event === 'Finished') {
                    toast('Good Job! Finished Download Prepare Relaunch.', {
                      icon: '👏',
                    });
                  }
                  setTimeout(() => {
                    toast.dismiss();
                  }, 100000);
                  console.log(progress);
                },
                {
                  timeout: 10000,
                },
              );
              // Restart the app after the update is installed by calling the Tauri command that handles restart for your app
              // It is good practice to shut down any background processes gracefully before restarting
              // As an alternative, you could ask the user to restart the app manually
              await invoke('graceful_restart', {
                userId: localStorage.getItem('userID')!,
              });
              toast.dismiss(t.id);
            }}
          >
            Click here to update 👏.
          </Button>
        </div>
      ));
    } else if (onUserClick) {
      toast.success('You are on the latest version. Stay awesome!');
    } else {
      console.log('No update available');
    }
  } catch (e) {
    console.error(e);
    await message(t('Failed to check for updates.\nPlease try again later.'), {
      title: 'Error',
      kind: 'error',
      okLabel: 'OK',
    });
  }
  return true;
}
