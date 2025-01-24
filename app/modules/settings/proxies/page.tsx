import {
  Card,
  CardHeader,
  CardBody,
  Listbox,
  ListboxItem,
  Chip,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';

export const Page = () => {
  const { t, i18n } = useTranslation();
  return (
    <div>
      <Card className="py-4">
        <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
          <p className="text-tiny font-bold uppercase">{t('Proxies')}</p>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Listbox aria-label="Actions">
            <ListboxItem
              key="LatencyTestSettings"
              textValue="LatencyTestSettings"
            >
              <div className="flex flex-row items-center justify-between">
                <div>{t('Latency Test Settings')}</div>
                <div>
                  <Chip color="secondary">
                    http://www.gstatic.com/generate_204
                  </Chip>
                  <Chip color="secondary">3000</Chip>
                </div>
              </div>
            </ListboxItem>
          </Listbox>
        </CardBody>
      </Card>
    </div>
  );
};
