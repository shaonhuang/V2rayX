import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Image,
  Button,
} from '@nextui-org/react';
import { Listbox, ListboxItem } from '@nextui-org/react';
import { Select, SelectItem } from '@nextui-org/react';
import { Checkbox } from '@nextui-org/checkbox';
import { Switch } from '@nextui-org/switch';
import { Chip } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
import { Tooltip } from '@nextui-org/tooltip';
import { Tabs, Tab } from '@nextui-org/react';
import { Textarea } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import * as Inbounds from './inbounds/page';
import * as DNS from './dns/page';

export const loader = async () => {
  return {
    Inbounds: await Inbounds.loader(),
    DNS: await DNS.loader(),
  };
};

export const Page = () => {
  const { t, i18n } = useTranslation();
  return (
    <div>
      <Card className="py-4">
        <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
          <p className="text-tiny font-bold uppercase">{t('V2ray configure')}</p>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Listbox aria-label="Actions">
            <ListboxItem key="Inbounds" textValue="Inbounds">
              <div className="flex flex-row items-center justify-between">
                <div>{t('Inbounds')}</div>
                <Inbounds.Page />
              </div>
            </ListboxItem>
            <ListboxItem key="DNS" textValue="DNS">
              <div className="flex flex-row items-center justify-between">
                <div>{t('DNS')}</div>
                <DNS.Page />
              </div>
            </ListboxItem>
          </Listbox>
        </CardBody>
      </Card>
    </div>
  );
};

export { Inbounds };