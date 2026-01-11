import {
  Card,
  CardHeader,
  CardBody,
  Listbox,
  ListboxItem,
  Select,
  SelectItem,
  Chip,
} from '@heroui/react';
import { Switch } from '@heroui/switch';
import { Tooltip } from '@heroui/tooltip';
import { useTranslation } from 'react-i18next';
import { queryGeneralSettings, updateGeneralSettings, Types } from '~/api';
import { useLoaderData, useRevalidator } from 'react-router';

export const loader = async () => {
  const userID = localStorage.getItem('userID')!;
  const data = await queryGeneralSettings({ userID });
  return data;
};

export const Page = () => {
  const data = useLoaderData();
  const {
    allowSystemNotifications,
    autoStartProxy,
    dashboardPopWhenStart,
    applicationLogsFolder,
    v2rayLogLevel,
    v2rayAccessLogsPath,
    v2rayErrorLogsPath,
    language,
  } = data.General as Types.GeneralSettings;
  const { t, i18n } = useTranslation();
  const languageArray = [
    { zh: 'Chinese' },
    { fr: 'French' },
    { en: 'English' },
    { de: 'German' },
    { ja: 'Japanese' },
    { ko: 'Korean' },
    { ru: 'Russian' },
    { es: 'Spanish' },
    { fa: 'Persian' },
  ];

  const languages = languageArray.flatMap((lang) => {
    return Object.entries(lang)
      .filter(([key]) => i18n.options.resources.hasOwnProperty(key))
      .map(([key, value]) => ({ key, value }));
  });

  const logLevels = [
    {
      key: 'debug',
      explanation: 'Detailed debug information',
    },
    {
      key: 'info',
      explanation: 'Runtime status updates',
    },
    {
      key: 'warning',
      explanation: 'Potential issues detected',
    },
    {
      key: 'error',
      explanation: 'Critical errors needing resolution',
    },
    {
      key: 'none',
      explanation: 'No logging',
    },
  ];

  const lang = i18n.resolvedLanguage;
  const userID = localStorage.getItem('userID')!;
  const revalidator = useRevalidator();

  return (
    <div>
      <Card className="py-4">
        <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
          <p className="text-tiny font-bold uppercase">{t('General')}</p>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Listbox aria-label="Actions">
            <ListboxItem key="autoUpdate" textValue="autoUpdate">
              <div className="flex flex-row items-center justify-between">
                <div>{t('Allow System Notification')}</div>
                <Switch
                  isDisabled
                  aria-label="allow system notifications"
                  isSelected={allowSystemNotifications}
                  onValueChange={async (v) => {
                    await updateGeneralSettings({
                      userID: localStorage.getItem('userID')!,
                      general: {
                        allowSystemNotifications: v,
                        autoStartProxy,
                        dashboardPopWhenStart,
                        applicationLogsFolder,
                        v2rayLogLevel,
                        v2rayAccessLogsPath,
                        v2rayErrorLogsPath,
                        language,
                      },
                    });
                    revalidator.revalidate();
                  }}
                />
              </div>
            </ListboxItem>
            <ListboxItem key="autoStartProxy" textValue="autoStartProxy">
              <div className="flex flex-row items-center justify-between">
                <div>{t('Auto-Start Proxy')}</div>
                <Switch
                  aria-label="auto start proxy"
                  isSelected={autoStartProxy}
                  onValueChange={async (v) => {
                    await updateGeneralSettings({
                      userID: localStorage.getItem('userID')!,
                      general: {
                        allowSystemNotifications,
                        autoStartProxy: v,
                        dashboardPopWhenStart,
                        applicationLogsFolder,
                        v2rayLogLevel,
                        v2rayAccessLogsPath,
                        v2rayErrorLogsPath,
                        language: lang!,
                      },
                    });
                    revalidator.revalidate();
                  }}
                />
              </div>
            </ListboxItem>
            <ListboxItem key="appPopUp" textValue="appPopUp">
              <div className="flex flex-row items-center justify-between">
                <div>{t('Dashboard Pop Up When Started')}</div>
                <Switch
                  aria-label="dashboard Pop When Start"
                  isSelected={dashboardPopWhenStart}
                  onValueChange={async (v) => {
                    await updateGeneralSettings({
                      userID: localStorage.getItem('userID')!,
                      general: {
                        allowSystemNotifications,
                        autoStartProxy,
                        dashboardPopWhenStart: v,
                        applicationLogsFolder,
                        v2rayLogLevel,
                        v2rayAccessLogsPath,
                        v2rayErrorLogsPath,
                        language: lang!,
                      },
                    });
                    revalidator.revalidate();
                  }}
                />
              </div>
            </ListboxItem>
            <ListboxItem key="languageSwitcher" textValue="languageSwitcher">
              <div className="flex flex-row items-center justify-between">
                <div>{t('Current language')}</div>
                <Select
                  color="primary"
                  className="max-w-xs"
                  aria-label="language"
                  selectionMode="single"
                  selectedKeys={[lang!]}
                  onChange={async (e) => {
                    if (e.target.value !== '') {
                      i18n.changeLanguage(e.target.value);
                      await updateGeneralSettings({
                        userID: localStorage.getItem('userID')!,
                        general: {
                          allowSystemNotifications,
                          autoStartProxy,
                          dashboardPopWhenStart,
                          applicationLogsFolder,
                          v2rayLogLevel,
                          v2rayAccessLogsPath,
                          v2rayErrorLogsPath,
                          language: e.target.value,
                        },
                      });
                      revalidator.revalidate();
                    }
                  }}
                >
                  {languages.map((v) => (
                    <SelectItem key={v.key}>{t(v.value)}</SelectItem>
                  ))}
                </Select>
              </div>
            </ListboxItem>
            <ListboxItem
              key="applicationLogsFolder"
              textValue="applicationLogsFolder"
            >
              <Tooltip
                content={t(
                  'The Applicaion data generates every day with tags on it. You can check it or attach it for issue description on Github',
                )}
              >
                <div className="flex flex-row items-center justify-between">
                  <div>{t('Application Logs Folder')}</div>
                  <Chip color="secondary">{applicationLogsFolder}</Chip>
                </div>
              </Tooltip>
            </ListboxItem>
            <ListboxItem key="loglevelSwitcher" textValue="loglevelSwitcher">
              <div className="flex flex-row items-center justify-between">
                <div>{t('Current Log Level')}</div>
                <Select
                  color="primary"
                  className="max-w-xs"
                  aria-label="loglevel"
                  selectionMode="single"
                  selectedKeys={[v2rayLogLevel!]}
                  onChange={async (e) => {
                    if (e.target.value !== '') {
                      await updateGeneralSettings({
                        userID: localStorage.getItem('userID')!,
                        general: {
                          allowSystemNotifications,
                          autoStartProxy,
                          dashboardPopWhenStart,
                          applicationLogsFolder,
                          v2rayLogLevel: e.target.value as
                            | 'debug'
                            | 'info'
                            | 'warning'
                            | 'error'
                            | 'none',
                          v2rayAccessLogsPath,
                          v2rayErrorLogsPath,
                          language,
                        },
                      });
                      revalidator.revalidate();
                    }
                  }}
                >
                  {logLevels.map((v) => (
                    <SelectItem key={v.key}>
                      {v.key + ': ' + t(v.explanation)}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </ListboxItem>
            <ListboxItem
              key="v2rayAccessLogsPath"
              textValue="v2rayAccessLogsPath"
            >
              <Tooltip
                content={t(
                  'Tracks all connection activities, including IP addresses, timestamps, and data transferred',
                )}
              >
                <div className="flex flex-row items-center justify-between">
                  <div>{t('V2ray Access Logs Path')}</div>
                  <Chip color="secondary">{v2rayAccessLogsPath}</Chip>
                </div>
              </Tooltip>
            </ListboxItem>
            <ListboxItem
              key="v2rayErrorLogsPath"
              textValue="v2rayErrorLogsPath"
            >
              <Tooltip
                content={t(
                  'Logs any errors or issues V2Ray encounters, useful for troubleshooting',
                )}
              >
                <div className="flex flex-row items-center justify-between">
                  <div>{t('V2ray Error Logs Path')}</div>
                  <Chip color="secondary">{v2rayErrorLogsPath}</Chip>
                </div>
              </Tooltip>
            </ListboxItem>
          </Listbox>
        </CardBody>
      </Card>
    </div>
  );
};
