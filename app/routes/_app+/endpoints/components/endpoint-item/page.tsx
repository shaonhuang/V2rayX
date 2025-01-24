import { Avatar, Button, Chip } from '@heroui/react';
import * as Share from './share-popover';
import * as More from './more-popover';
import { motion } from 'framer-motion';
import * as Types from '~/api/types';
import { updateAppStatus } from '~/api';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

export const clientLoader = async () => {};
export const Page = (props: {
  state: boolean;
  isSelected: boolean;
  endpoint: Types.EndpointDetail;
  handleReload: () => void;
}) => {
  const { state, isSelected, endpoint, handleReload } = props;
  const { t, i18n } = useTranslation();

  return (
    <div
      className={`m-4 flex flex-row items-center justify-around rounded-2xl p-4 ${isSelected ? 'bg-[rgba(220,220,220,1)] ring ring-pink-500 ring-offset-1 ring-offset-slate-50 dark:bg-gray-700 dark:ring-offset-slate-900/50' : ''}`}
    >
      <div className="flex basis-1/2 flex-row items-center">
        <Avatar
          isBordered
          color="primary"
          radius="lg"
          icon={<span className="i-feather-server h-5 w-5" />}
          classNames={{
            base: 'bg-gradient-to-br from-[#FFB457] to-[#FF705B]',
            icon: 'text-black/80',
          }}
        />
        <div className="ml-4 flex flex-col">
          <h1 className="text-lg font-bold">{t(endpoint.Remark)}</h1>
          <div className="flex flex-row items-center justify-center gap-2 text-sm text-gray-500">
            <Chip color="primary" size="sm">
              {props.endpoint.Protocol}
            </Chip>
            <Chip color="primary" size="sm">
              {props.endpoint.Network}
            </Chip>
            <Chip color="primary" size="sm">
              {props.endpoint.Security}
            </Chip>
            <Chip
              color={props.endpoint.Latency ? 'success' : 'danger'}
              size="sm"
            >
              {`${props.endpoint.Latency ? `(${props.endpoint.Latency}ms)` : 'Timeout'}`}
            </Chip>
          </div>
        </div>
      </div>
      {isSelected ? (
        state ? (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            key="app-running-state-running"
          >
            <Chip color="success" className="basis-1/2">
              {t('Running')}
            </Chip>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            key="app-running-state-stopped"
          >
            <Chip color="danger" className="basis-1/2">
              {t('Stopped')}
            </Chip>
          </motion.div>
        )
      ) : null}

      <div className="ml-auto flex basis-1/4 flex-row flex-nowrap justify-end gap-4">
        {isSelected && (
          <Button
            isIconOnly
            color="primary"
            aria-label={state ? 'Stop' : 'Start'}
            onPress={async () => {
              const success = await invoke(
                state ? 'stop_daemon' : 'start_daemon',
              );
              if (success) {
                await updateAppStatus({
                  userID: localStorage.getItem('userID')!,
                  data: { ServiceRunningState: state ? 0 : 1 },
                });
                await invoke('tray_update', {
                  userId: localStorage.getItem('userID')!,
                });
                handleReload();
              }
            }}
          >
            <span className={`${state ? 'i-mdi-pause' : 'i-feather-play'}`} />
          </Button>
        )}
        <Share.ShareButton />
        <More.MoreButton endpointID={endpoint.EndpointID} />
      </div>
    </div>
  );
};
