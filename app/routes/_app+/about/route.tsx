import { Card, CardBody, Button } from '@nextui-org/react';
import { openUrl } from '@tauri-apps/plugin-opener';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { checkForAppUpdates } from '~/utils/utils';

const Page = () => {
  const { t, i18n } = useTranslation();

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
      <Card className="py-4">
        <CardBody className="bg-container overflow-visible py-8">
          <div className="flex flex-col items-center justify-center gap-8">
            <div>
              <span className="i-custom-v2ray-logo h-32 w-32" />
            </div>
            <p className="cursor-pointer">
              {t('An all platform (Macos Windows Linux) V2ray client build with Tauri.')}
            </p>
            <div className="flex flex-row gap-4">
              <Button
                onPress={async () => {
                  await checkForAppUpdates(t, true);
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
                  await openUrl('https://github.com/shaonhuang/V2rayX#ii-features');
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