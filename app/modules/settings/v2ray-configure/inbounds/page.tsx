import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  useDisclosure,
  Input,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { Select, SelectItem } from '@heroui/select';

import { useLoaderData, useNavigate } from '@remix-run/react';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { queryInboundsSettings, updateInbounds } from '~/api';

export const loader = async () => {
  return await queryInboundsSettings({
    userID: localStorage.getItem('userID')!,
  });
};

const InboudSettigTabContent = (props: {
  Id: string;
  Protocol: string;
  Listen: string;
  Port: number;
  Tag: string;
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const InboundSchema = z.object({
    listen: z.string().ip({ message: 'Listen ip is required' }),
    port: z
      .number()
      .positive({ message: 'Port is required' })
      .lte(65535, { message: 'this👏is👏too👏big' }),
    tag: z.string().min(1, { message: 'Tag is required' }),
    protocol: z.string().min(1, { message: 'Protocol is required' }),
  });

  type InboundSchema = z.infer<typeof InboundSchema>;

  const resolver = zodResolver(InboundSchema);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<InboundSchema>({
    resolver,
    defaultValues: {
      listen: props.Listen ?? '',
      port: props.Port ?? 1080,
      tag: props.Tag ?? '',
      protocol: props.Protocol ?? 'http',
    },
  });

  const onSubmit: SubmitHandler<InboundSchema> = async (data) => {
    try {
      await updateInbounds({
        userID: localStorage.getItem('userID')!,
        inbounds: [
          {
            Id: props.Id,
            Listen: data.listen,
            Port: data.port,
            Tag: data.tag,
            Protocol: data.protocol,
          },
        ],
      });
      toast.success(t('Inbounds have been updated successfully'));
    } catch (e) {
      toast.error(`${e}`);
    }
  };
  return (
    <>
      <Card className="h-[30rem] w-80 py-6">
        <CardHeader className="px-4 pb-0 pt-2">
          <p className="font-bold uppercase">{props.Tag}</p>
        </CardHeader>
        <CardBody className="flex flex-col items-start justify-center">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-4"
          >
            <Controller
              name="listen"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  required
                  label="Listen"
                  placeholder="Enter your Ip"
                  ref={ref}
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={error?.message !== undefined}
                  errorMessage={error?.message}
                />
              )}
            />

            <Controller
              name="port"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  required
                  label="Port"
                  type="number"
                  placeholder="Enter your Port"
                  description={t(
                    'Please make sure the port is not in use and unique',
                  )}
                  ref={ref}
                  name={name}
                  value={value.toString()}
                  onValueChange={(v) => onChange(parseInt(v))}
                  onBlur={onBlur}
                  isInvalid={error?.message !== undefined}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              name="protocol"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Select
                  isRequired
                  ref={ref}
                  name={name}
                  selectedKeys={[value]}
                  selectionMode="single"
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  isInvalid={error?.message !== undefined}
                  errorMessage={error?.message}
                  label="Protocol"
                  placeholder="Select a protocol"
                  className="max-w-xs"
                >
                  {[
                    { key: 'http', label: 'http' },
                    { key: 'socks', label: 'socks' },
                  ].map((protocol) => (
                    <SelectItem key={protocol.key}>{protocol.label}</SelectItem>
                  ))}
                </Select>
              )}
            />
            <Controller
              name="tag"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  required
                  label="Tag"
                  placeholder="Enter your tag"
                  ref={ref}
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={error?.message !== undefined}
                  errorMessage={error?.message}
                />
              )}
            />
            <div className="flex flex-row justify-around">
              <Button type="submit">save</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
};

export function Page() {
  const data = useLoaderData();
  const navigate = useNavigate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t, i18n } = useTranslation();

  return (
    <>
      <Button
        color="primary"
        onPress={() => {
          onOpen();
        }}
      >
        <span className="i-feather-edit" /> {t('Edit')}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t('Inbounds Setting')}
              </ModalHeader>
              <ModalBody className="mb-10 flex w-full flex-col items-center justify-center">
                <div className="-ml-28">
                  <Tabs
                    aria-label="Options"
                    isVertical={true}
                    disabledKeys={['api']}
                  >
                    {data.V2rayConfigure.Inbounds.map(
                      (inbound: {
                        Protocol: string;
                        Listen: string;
                        Port: number;
                        Tag: string;
                      }) => (
                        <Tab key={inbound.Tag} title={inbound.Tag}>
                          <InboudSettigTabContent {...inbound} />
                        </Tab>
                      ),
                    )}
                  </Tabs>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
