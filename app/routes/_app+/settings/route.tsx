import { motion } from 'framer-motion';
import { json } from '@remix-run/react';

import * as Security from '~/modules/settings/security/page';
import * as General from '~/modules/settings/general/page';
import * as Appearance from '~/modules/settings/appearance/page';
import * as SystemProxy from '~/modules/settings/system-proxy/page';
import * as Proxies from '~/modules/settings/proxies/page';
import * as V2rayConfigure from '~/modules/settings/v2ray-configure/page';

export const clientLoader = async () => {
  return json({
    Security: await Security.loader(),
    General: await General.loader(),
    Appearance: await Appearance.loader(),
    SystemProxy: await SystemProxy.loader(),
    // Proxies: await Proxies.loader(),
    V2rayConfigure: await V2rayConfigure.loader(),
  });
};

const Page = () => {
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
      <div className="flex h-[94vh] w-full flex-row items-center justify-center">
        <div className="flex h-2/3 w-full flex-col gap-8 overflow-scroll overflow-x-hidden rounded-xl p-4">
          <Security.Page key="security" />
          <General.Page key="general" />
          <Appearance.Page key="appearance" />
          <SystemProxy.Page key="systemProxy" />
          <Proxies.Page key="proxies" />
          <V2rayConfigure.Page key="v2rayConfigure" />
        </div>
      </div>
    </motion.div>
  );
};

export default Page;
