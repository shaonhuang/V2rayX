import {
  Accordion,
  AccordionItem,
  Avatar,
  Button,
  Select,
  SelectItem,
  Chip,
} from '@heroui/react';
import { Card, CardBody } from '@heroui/card';
import * as Endpoint from '~/modules/endpoints/endpoint-item/page';
import * as Edit from '~/modules/endpoints/endpoint-edit/page';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useTheme } from '@heroui/use-theme';
import DeleteGroupButton from '~/modules/endpoints/delete-group-dialog';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useTranslation } from 'react-i18next';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import ImportUrlScreenshotDialog from '~/modules/endpoints/import-url-screenshot-dialog';
import SubscriptionsDialog from '~/modules/endpoints/subscriptions-dialog';

import {
  useLoaderData,
  useRevalidator,
  useLocation,
  useNavigate,
} from 'react-router';
import {
  queryEndpoints,
  queryEndpointsGroups,
  queryAppStatus,
  handleSelectEndpoint,
  updateAppStatus,
  updateEndpointsGroups,
} from '~/api';
import { useEffect, useState, useRef, forwardRef } from 'react';
import { z } from 'zod';
import { VMess, Shadowsocks, Trojan, Hysteria2 } from '~/lib/protocol';
import { v7 as uuid } from 'uuid';

// Protocol-specific Zod schemas with enhanced validation
const VmessSchema = z.object({
  protocol: z.literal('vmess'),
  url: z
    .string()
    .regex(/^vmess:\/\//i, "Must start with 'vmess://'")
    .refine((url) => {
      try {
        new VMess(url); // This will throw if parsing fails
        return true;
      } catch (error) {
        return false;
      }
    }, 'Invalid VMess URL format'),
});

const ShadowsocksSchema = z.object({
  protocol: z.literal('ss'),
  url: z
    .string()
    .regex(/^ss:\/\//i, "Must start with 'ss://'")
    .refine((url) => {
      try {
        new Shadowsocks(url); // This will throw if parsing fails
        return true;
      } catch (error) {
        return false;
      }
    }, 'Invalid Shadowsocks URL format'),
});

const TrojanSchema = z.object({
  protocol: z.literal('trojan'),
  url: z
    .string()
    .regex(/^trojan:\/\//i, "Must start with 'trojan://'")
    .refine((url) => {
      try {
        new Trojan(url); // This will throw if parsing fails
        return true;
      } catch (error) {
        return false;
      }
    }, 'Invalid Trojan URL format'),
});

const Hysteria2Schema = z.object({
  protocol: z.literal('hysteria2'),
  url: z
    .string()
    .regex(/^hysteria2:\/\//i, "Must start with 'hysteria2://'")
    .refine((url) => {
      try {
        new Hysteria2(url); // This will throw if parsing fails
        return true;
      } catch (error) {
        return false;
      }
    }, 'Invalid Hysteria2 URL format'),
});

// Combined schema for all protocols
const ProtocolUrlSchema = z.discriminatedUnion('protocol', [
  VmessSchema,
  ShadowsocksSchema,
  TrojanSchema,
  Hysteria2Schema,
]);

const container: React.CSSProperties = {
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 200px)',
};

const speedTestTypeSets = ['Ping', 'Connect', 'Tcp'];

export const clientLoader = async () => {
  const userID = localStorage.getItem('userID')!;

  const groups = await queryEndpointsGroups({ userID });
  const endpointsEntries = await Promise.all(
    groups.map(async (group) => {
      const endpoints = await queryEndpoints({
        groupID: group.GroupID,
        userID,
      });
      return [group.GroupName, endpoints] as [string, typeof endpoints];
    }),
  );
  const appStatus = (await queryAppStatus({ userID }))[0];

  return {
    endpoints: Object.fromEntries(endpointsEntries),
    groups,
    appStatus,
    userID,
  };
};

export const Page = () => {
  const data = useLoaderData<typeof clientLoader>();
  const { theme } = useTheme();
  const revalidator = useRevalidator();
  const { t } = useTranslation();
  const location = useLocation();
  const importFromLinkRef = useRef<HTMLDivElement>(null);
  const importFromScreenshotRef = useRef<HTMLDivElement>(null);
  const subscriptionsButtonRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState<string>('');

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

  const handleImportUrl = (url: string) => {
    setUrl(url);
    const addButton = document.querySelector(
      '[data-add-endpoint-button="true"]',
    );
    if (addButton) {
      setTimeout(() => {
        (addButton as HTMLButtonElement).click();
      }, 100);
    } else {
      toast.error(t('Could not find import dialog'));
    }
  };

  const handleImportFromClipboard = async () => {
    try {
      const clipboardText = await readText();
      handleImportUrl(clipboardText);
      toast.success(clipboardText);
    } catch (error) {
      console.error('Error opening dialog:', error);
      toast.error(t('Failed to open import dialog'));
    }
  };

  return (
    <div className="flex flex-row items-center justify-start gap-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <SubscriptionsDialog forwardedRef={subscriptionsButtonRef} />
        <ImportUrlScreenshotDialog
          onImportUrl={handleImportUrl}
          forwardedRef={importFromScreenshotRef}
        />
        <Button
          isIconOnly
          onPress={handleImportFromClipboard}
          data-import-link-button="true"
        >
          <span className="i-mdi-link-plus" />
        </Button>
        <Edit.DialogButton
          ref={importFromLinkRef}
          type="add"
          isIconOnly
          handleReload={handleReload}
          url={url}
          onClick={(e) => {
            if (e?.pointerType === 'mouse') {
              setUrl('');
            }
          }}
          data-add-endpoint-button="true"
        >
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
                className="w-full overflow-x-hidden rounded-2xl from-[#FFB457] to-[#FF705B] px-4"
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
                        selectedKeys={[group.SpeedTestType]}
                        defaultSelectedKeys={['ping']}
                        isDisabled
                        onChange={async (
                          e: React.ChangeEvent<HTMLSelectElement>,
                        ) => {
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
                        aria-label="refresh"
                        onPress={async () => {
                          try {
                            const result = await invoke(
                              'update_endpoints_latency',
                              {
                                groupId: group.GroupID,
                                userId: data.userID,
                              },
                            );

                            // Process the result information if it returns any details
                            if (result && typeof result === 'string') {
                              // If the result contains detailed information
                              toast.success(
                                `Latency test completed: ${result}`,
                              );
                            } else {
                              toast.success(
                                `Latency test completed for ${group.Remark}`,
                              );
                            }

                            revalidator.revalidate();
                          } catch (error) {
                            console.error('Latency test error:', error);
                            toast.error(`Failed to test latency: ${error}`);
                          }
                        }}
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
                {!data.endpoints[group.GroupName].length ? (
                  <div className="w-full flex flex-row justify-center items-center py-4">
                    <Chip color="primary">{t('Empty')}</Chip>
                  </div>
                ) : (
                  data.endpoints[group.GroupName].map((endpoint) => (
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
                            await handleSelectEndpoint({
                              endpointID: endpoint.EndpointID,
                            });
                            await invoke('stop_v2ray_daemon', {
                              userId: data.userID,
                            });
                            // inject object need contain {EndpointID, UserID}
                            const injectConfig = await invoke('inject_config', {
                              endpointId: endpoint.EndpointID,
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
                  ))
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      )}
    </div>
  );
};

export default Page;
