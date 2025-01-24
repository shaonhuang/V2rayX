import {
  Card,
  CardHeader,
  CardBody,
  Listbox,
  ListboxItem,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import * as PAC from './pac/page';
import * as Bypass from './bypass/page';

export const loader = async () => {
  return {
    PAC: await PAC.loader(),
    Bypass: await Bypass.loader(),
  };
};

export const Page = () => {
  const { t, i18n } = useTranslation();
  return (
    <div>
      <Card className="py-4">
        <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
          <p className="text-tiny font-bold uppercase">{t('System Proxy')}</p>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Listbox aria-label="Actions">
            <ListboxItem
              key="Bypass Domain/IPNet"
              textValue="Bypass Domain/IPNet"
            >
              <div className="flex flex-row items-center justify-between">
                <div>{t('Bypass Domain/IPNet')}</div>
                <Bypass.Page />
              </div>
            </ListboxItem>
            <ListboxItem key="PAC settings" textValue="PAC settings">
              <div className="flex flex-row items-center justify-between">
                <div>{t('PAC settings')}</div>
                <PAC.Page />
              </div>
            </ListboxItem>
          </Listbox>
        </CardBody>
      </Card>
    </div>
  );
};
