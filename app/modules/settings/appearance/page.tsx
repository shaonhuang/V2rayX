import {
  Card,
  CardHeader,
  CardBody,
  Listbox,
  ListboxItem,
  Select,
  SelectItem,
  Tabs,
  Tab,
} from '@heroui/react';
import { Switch } from '@heroui/switch';
import { Tooltip } from '@heroui/tooltip';
import { useTheme } from '@heroui/use-theme';
import SystemThemeManager from '~/utils/theme.util';

import { useTranslation } from 'react-i18next';
import { useLoaderData, useRevalidator } from '@remix-run/react';
import { queryAppearance, updateAppearance } from '~/api';

export const loader = async () => {
  const userID = localStorage.getItem('userID')!;
  const res = await queryAppearance({ userID });
  return res;
};

export const Page = () => {
  const userID = localStorage.getItem('userID')!;
  const { setTheme } = useTheme();
  const data = useLoaderData();
  const revalidator = useRevalidator();

  const { theme, font, hideTrayBar } = data.Appearance;
  const { t, i18n } = useTranslation();
  const fonts = [
    'sans-serif',
    'Lato',
    'Raleway',
    'PTSans',
    'Montserrat',
    'Lora',
    'Oswald',
    'Roboto',
  ];

  return (
    <div>
      <Card className="py-4">
        <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
          <p className="text-tiny font-bold uppercase">{t('Appearance')}</p>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Listbox aria-label="Actions">
            <ListboxItem key="theme" textValue="theme">
              <div className="flex flex-row items-center justify-between">
                <div>{t('Application Theme')}</div>
                <div className="flex flex-wrap gap-4">
                  <Tabs
                    key="solid"
                    variant="solid"
                    aria-label="Tabs variants"
                    selectedKey={theme}
                    onSelectionChange={(v) => {
                      switch (v) {
                        case 'light':
                          setTheme('light');
                          SystemThemeManager.cancelSystemThemeListener();
                          break;
                        case 'dark':
                          setTheme('dark');
                          SystemThemeManager.cancelSystemThemeListener();
                          break;
                        case 'system':
                          SystemThemeManager.enableSystemThemeListener(() => {
                            setTheme('system');
                          });
                          break;
                      }
                      updateAppearance({
                        userID,
                        appearance: {
                          theme: v as 'light' | 'dark' | 'system',
                          font,
                          hideTrayBar,
                        },
                      });
                      revalidator.revalidate();
                    }}
                  >
                    <Tab key="light" title={t('Light')} />
                    <Tab key="dark" title={t('Dark')} />
                    <Tab key="system" title={t('Follow System')} />
                  </Tabs>
                </div>
              </div>
            </ListboxItem>
            <ListboxItem key="font" textValue="font">
              <div className="flex flex-row items-center justify-between">
                <div>{t('Font Families')}</div>
                <Select
                  color="primary"
                  className="max-w-xs"
                  aria-label="font families"
                  selectionMode="single"
                  defaultSelectedKeys={[font]}
                  selectedKeys={[font]}
                  onChange={async (e) => {
                    if (e.target.value !== '') {
                      await updateAppearance({
                        userID,
                        appearance: {
                          theme,
                          font: e.target.value,
                          hideTrayBar,
                        },
                      });
                      document.body.style.fontFamily = `${e.target.value === 'sans-serif' ? '' : e.target.value + ','} NotoSansSC, sans-serif`;
                      revalidator.revalidate();
                    }
                  }}
                >
                  {fonts.map((font) => (
                    <SelectItem key={font} aria-label={font} value={font}>
                      {t(font)}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </ListboxItem>
            <ListboxItem key="hideBar" textValue="hidenBar">
              <Tooltip
                content={t(
                  'Hide tray bar will not let program running in backgroud',
                )}
              >
                <div className="flex flex-row items-center justify-between">
                  <div>{t('Hide Tray Bar')}</div>
                  <Switch
                    defaultSelected
                    aria-label="hidenBar"
                    isSelected={hideTrayBar}
                    onValueChange={(v) => {
                      updateAppearance({
                        userID,
                        appearance: { theme, font, hideTrayBar: v },
                      });
                      revalidator.revalidate();
                    }}
                  />
                </div>
              </Tooltip>
            </ListboxItem>
          </Listbox>
        </CardBody>
      </Card>
    </div>
  );
};
