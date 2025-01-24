import {
  Accordion,
  AccordionItem,
  Avatar,
  Button,
  Select,
  SelectItem,
} from '@heroui/react';
import { Card, CardBody } from '@heroui/card';
import * as Endpoint from './components/endpoint-item/page';
import * as Edit from './components/endpoint-edit/page';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTheme } from '@heroui/use-theme';
import DeleteGroupButton from './components/delete-group-dialog';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useTranslation } from 'react-i18next';

import { useLoaderData, useRevalidator, json } from '@remix-run/react';
import {
  queryEndpoints,
  queryEndpointsGroups,
  queryAppStatus,
  handleSelectEndpoint,
  updateAppStatus,
  updateEndpointsGroups,
} from '~/api';
import { useEffect } from 'react';

const container: React.CSSProperties = {
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 200px)',
};

const speedTestTypeSets = ['Ping', 'Connect', 'Tcp'];

export const clientLoader = async () => {
  const userID = localStorage.getItem('userID')!;

  // Fetch the groups
  const groups = await queryEndpointsGroups({ userID });

  const endpointsEntries = await Promise.all(
    groups.map(async (group) => {
      const endpoints = await queryEndpoints({
        groupID: group.GroupID,
      });
      return [group.GroupName, endpoints] as [string, typeof endpoints];
    }),
  );
  const appStatus = (await queryAppStatus({ userID }))[0];

  // Convert the array of entries into an object
  const endpoints = Object.fromEntries(endpointsEntries);

  return json({
    endpoints,
    groups,
    appStatus,
    userID,
  });
};

export const Page = () => {
  const data = useLoaderData<typeof clientLoader>();
  const { theme } = useTheme();
  const revalidator = useRevalidator();
  const { t, i18n } = useTranslation();

  const isSelectedEndpointGroupID = data.groups.find((group) =>
    data.endpoints[group.GroupName].find((i) => i.Active === 1),
  )?.GroupID;

  const handleReload = () => {
    revalidator.revalidate();
  };

  useEffect(() => {
    const unlisten = listen<string>('refresh', (event) => {
      if (event.payload === 'endpoints') {
        revalidator.revalidate();
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className="flex flex-row items-center justify-start gap-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <Button isIconOnly isDisabled>
          <span className="i-mdi-youtube-subscription" />
        </Button>
        <Button isIconOnly isDisabled>
          <span className="i-mdi-link-plus" />
        </Button>
        <Button isIconOnly isDisabled>
          <span className="i-mdi-qrcode-plus" />
        </Button>
        <Edit.DialogButton type="add" isIconOnly handleReload={handleReload}>
          <span className="i-feather-plus" />
        </Edit.DialogButton>
      </div>

      {!data.groups.length ? (
        <motion.div
          className="flex w-full flex-row items-center justify-center"
          initial={{ opacity: 0.8, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 },
          }}
        >
          <Card className="w-fit">
            <CardBody>
              <p>
                Empty groups. Create one or import one with left side buttons.
              </p>
            </CardBody>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="h-[80vh] w-full"
          initial={{ opacity: 0.9, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.2,
            scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 },
          }}
        >
          <Accordion
            variant="splitted"
            className="flex h-[80vh] w-full flex-col items-center justify-center gap-4"
            defaultExpandedKeys={[isSelectedEndpointGroupID ?? '']}
          >
            {data.groups.map((group) => (
              <AccordionItem
                key={group.GroupID}
                aria-label={group.Remark}
                className="w-full overflow-x-hidden overflow-y-hidden rounded-2xl from-[#FFB457] to-[#FF705B] px-4"
                startContent={
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
                }
                title={
                  <div className="flex flex-row items-center justify-between px-2">
                    <div>
                      <p className="text-lg font-bold">{group.Remark}</p>
                      <p className="text-sm text-gray-600">{`${data.endpoints[group.GroupName].length} endpoints`}</p>
                    </div>
                    <div className="flex flex-row flex-nowrap items-center gap-4">
                      <Select
                        className="w-44"
                        label={t('Latency Test Type')}
                        isDisabled
                        selectedKeys={[group.SpeedTestType]}
                        defaultSelectedKeys={['ping']}
                        onChange={async (e) => {
                          if (e.target.value !== '') {
                            await updateEndpointsGroups({
                              groupID: group.GroupID,
                              data: { SpeedTestType: e.target.value },
                            });
                            revalidator.revalidate();
                          }
                        }}
                      >
                        {speedTestTypeSets.map((speedTestType) => (
                          <SelectItem key={speedTestType.toLowerCase()}>
                            {speedTestType}
                          </SelectItem>
                        ))}
                      </Select>
                      <Button
                        isIconOnly
                        color="primary"
                        variant="ghost"
                        isDisabled
                        aria-label="refresh"
                      >
                        <span className="i-feather-refresh-cw" />
                      </Button>
                      <DeleteGroupButton
                        groupID={group.GroupID}
                        groupName={group.GroupName}
                        isSelectedEndpointInGroup={
                          isSelectedEndpointGroupID === group.GroupID
                        }
                      />
                    </div>
                  </div>
                }
              >
                {data.endpoints[group.GroupName].map((endpoint) => (
                  <motion.div
                    key={endpoint.EndpointID}
                    initial={{
                      opacity: 0,
                      y: 300,
                      borderRadius: '15px',
                      backgroundColor: 'rgba(0, 0, 0, 0)',
                    }}
                    whileHover={{
                      backgroundColor:
                        endpoint.Active !== 1
                          ? theme === 'dark'
                            ? 'rgba(55, 65, 81, 1)'
                            : 'rgba(220, 220, 220, 1)'
                          : 'rgba(0, 0, 0, 0)',
                      borderRadius: '15px', // Set desired border radius on hover
                      margin: '16px',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: 'spring',
                        bounce: 0.4,
                        duration: 0.8,
                      },
                    }}
                    exit={{ opacity: 0 }}
                    onClick={async () => {
                      if (endpoint) {
                        if (endpoint.Active !== 1) {
                          await invoke('stop_daemon');
                          await handleSelectEndpoint({
                            endpointID: endpoint.EndpointID,
                          });
                          await updateAppStatus({
                            userID: data.userID,
                            data: { ServiceRunningState: 0 },
                          });
                          // inject object need contain {EndpointID, UserID}
                          const injectConfig = await invoke('inject_config', {
                            endpointId: endpoint.EndpointID,
                            userId: data.userID,
                          });
                          await invoke('tray_update', {
                            userId: data.userID,
                          });
                          if (!injectConfig) {
                            toast.error('Failed to switch config.json file');
                          }
                          revalidator.revalidate();
                        }
                      } else {
                        toast.error(
                          'Failed to inject config for v2ray to start',
                        );
                      }
                    }}
                  >
                    <Endpoint.Page
                      state={
                        endpoint.Active === 1 &&
                        data.appStatus.ServiceRunningState === 1
                      }
                      isSelected={endpoint.Active === 1}
                      endpoint={endpoint}
                      handleReload={handleReload}
                    />
                  </motion.div>
                ))}
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      )}
    </div>
  );
};

export default Page;
