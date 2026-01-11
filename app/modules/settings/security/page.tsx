import {
  Card,
  CardHeader,
  CardBody,
  Switch,
  Listbox,
  ListboxItem,
  Chip,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import {
  queryAppStatus,
  queryAutoCheckUpdate,
  updateAutoCheckUpdate,
} from '~/api';
import { UPDATER_ACTIVE } from '~/api';
import { useLoaderData, useRevalidator } from 'react-router';

export const loader = async () => {
  const userID = localStorage.getItem('userID')!;
  const data = await queryAppStatus({ userID });
  const autoCheckUpdate = await queryAutoCheckUpdate({ userID });
  return {
    V2rayCoreVersion: data[0].V2rayCoreVersion,
    autoCheckUpdate,
  };
};

export const Page = () => {
  const data = useLoaderData();
  const { V2rayCoreVersion, autoCheckUpdate } = data.Security;
  const { t, i18n } = useTranslation();
  const revalidator = useRevalidator();

  return (
    <div>
      <Card className="py-4">
        <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
          <p className="text-tiny font-bold uppercase">
            {t('Security Settings')}
          </p>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Listbox aria-label="Actions">
            <ListboxItem key="V2rayCoreVersion" textValue="V2rayCoreVersion">
              <div className="flex flex-row items-center justify-between">
                <div>{t('Current V2ray Core version:')}</div>
                <Chip color="primary">{V2rayCoreVersion}</Chip>
              </div>
            </ListboxItem>
            {UPDATER_ACTIVE ? (
              <ListboxItem key="appPopUp" textValue="appPopUp">
                <div className="flex flex-row items-center justify-between">
                  <div>{t('Auto Check Update')}</div>
                  <Switch
                    defaultSelected
                    aria-label="Auto Check Update"
                    isSelected={autoCheckUpdate}
                    onValueChange={async (v) => {
                      await updateAutoCheckUpdate({
                        userID: localStorage.getItem('userID')!,
                        autoCheckUpdate: v,
                      });
                      revalidator.revalidate();
                    }}
                  />
                </div>
              </ListboxItem>
            ) : (
              <></>
            )}
          </Listbox>
        </CardBody>
      </Card>
    </div>
  );
};
