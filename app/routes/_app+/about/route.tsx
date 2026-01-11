import { Card, CardBody, Button, Chip } from '@heroui/react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { checkForAppUpdates } from '~/utils/utils';
import { APP_VERSION } from '~/api';
import { useTheme } from '@heroui/use-theme';
import SystemThemeManager from '~/utils/theme.util';

const Page = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = SystemThemeManager.isDarkMode(theme);
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0.9, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.2,
        scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 },
      }}
    >
      <Card className={`py-4 ${isDark ? 'm2' : ''}`}>
        <CardBody className="bg-container overflow-visible py-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <div>
              <span className="i-custom-v2ray-logo h-32 w-32" />
            </div>
            <Chip color="primary">
              <p className="mb-0.5">{`v${APP_VERSION}`}</p>
            </Chip>
            <p className="cursor-pointer">
              {t(
                'An all platform (Macos Windows Linux) V2ray client build with Tauri.',
              )}
            </p>
            <div className="flex flex-row gap-4">
              <Button
                onPress={async () => {
                  toast.promise(
                    async () => {
                      const res = await checkForAppUpdates(t, true);
                      console.log('res', res);
                      if (!res) {
                        toast.error(
                          'This software architecture does not support internal auto update.',
                        );
                      }
                    },
                    {
                      loading: 'Checking for updates...',
                      success: <b>Checking for updates successed</b>,
                      error: <b>Checking for updates failed</b>,
                    },
                    {
                      duration: 10000,
                    },
                  );
                }}
                color="primary"
              >
                {t('CHECK UPDATE')}
              </Button>
              <Button
                onPress={async () => {
                  await openUrl('https://github.com/shaonhuang/V2rayX');
                }}
                color="primary"
              >
                {t('HOMEPAGE')}
              </Button>
              <Button
                onPress={async () => {
                  await openUrl('https://t.me/V2rayX_electron');
                }}
                color="primary"
              >
                {t('FEEDBACK')}
              </Button>
              <Button
                onPress={async () => {
                  await openUrl(
                    'https://github.com/shaonhuang/V2rayX#ii-features',
                  );
                }}
                color="primary"
              >
                {t('ROADMAP')}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default Page;
