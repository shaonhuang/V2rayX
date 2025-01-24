import { Card, CardBody, Select, SelectItem, Input } from '@heroui/react';
import { Checkbox } from '@heroui/checkbox';
import { Tooltip } from '@heroui/tooltip';
import { useTranslation } from 'react-i18next';
import {
  Controller,
  useForm,
  SubmitHandler,
  UseFormSetValue,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useState,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from 'react';
import { addKcpStream, updateKcpStream } from '~/api';
const protocols = [
  'none',
  'srtp',
  'utp',
  'dtls',
  'wireguard',
  'wechat-video',
].map((procotol) => ({
  key: procotol,
  label: procotol,
}));

const KcpSchema = z.object({
  endpointID: z.string().min(1),
  mtu: z.number().positive({ message: 'MTU is required' }),
  tti: z.number().positive({ message: 'TTI is required' }),
  header: z.string().min(1, { message: 'Header is required' }),
  congestion: z.boolean(),
  uplinkCapacity: z
    .number()
    .positive({ message: 'Uplink Capacity is required' }),
  downlinkCapacity: z
    .number()
    .positive({ message: 'Downlink Capacity is required' }),
  readBufferSize: z
    .number()
    .positive({ message: 'Read Buffer Size is required' }),
  writeBufferSize: z
    .number()
    .positive({ message: 'Write Buffer Size is required' }),
});

type KcpSchema = z.infer<typeof KcpSchema>;

const resolver = zodResolver(KcpSchema);

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: KcpSchema) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<KcpSchema>;
}

const PageComponent: ForwardRefRenderFunction<PageRef, PageProps> = (
  props,
  ref,
) => {
  const { t } = useTranslation();

  const headers = [
    {
      key: 'none',
      label: t('None: Default value, no obfuscation'),
    },
    {
      key: 'srtp',
      label: t('SRTP: Obfuscated as SRTP packets(video call data)'),
    },
    {
      key: 'utp',
      label: t('UTP: Obfuscated as uTP packets(BT download data)'),
    },
    {
      key: 'wechat-video',
      label: t('WeChat Video: Obfuscated as (WeChat video call)'),
    },
    {
      key: 'dtls',
      label: t('DTLS: Obfuscated as DTLS 1.2 packets'),
    },
    {
      key: 'wireguard',
      label: t('WireGuard: Obfuscated as WireGuard packets'),
    },
  ];
  const [type, setType] = useState('none');

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue,
  } = useForm<KcpSchema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      mtu: 1350,
      tti: 50,
      header: 'none',
      congestion: false,
      uplinkCapacity: 5,
      downlinkCapacity: 20,
      readBufferSize: 2,
      writeBufferSize: 2,
    },
  });

  const onSubmit: SubmitHandler<KcpSchema> = async (data) => {
    try {
      if (props.type === 'add') {
        await addKcpStream({
          endpointID: data.endpointID,
          kcp: {
            mtu: data.mtu,
            tti: data.tti,
            header: data.header,
            congestion: data.congestion,
            uplinkCapacity: data.uplinkCapacity,
            downlinkCapacity: data.downlinkCapacity,
            readBufferSize: data.readBufferSize,
            writeBufferSize: data.writeBufferSize,
          },
        });
      } else {
        await updateKcpStream({
          endpointID: data.endpointID,
          kcp: {
            mtu: data.mtu,
            tti: data.tti,
            header: data.header,
            congestion: data.congestion,
            uplinkCapacity: data.uplinkCapacity,
            downlinkCapacity: data.downlinkCapacity,
            readBufferSize: data.readBufferSize,
            writeBufferSize: data.writeBufferSize,
          },
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const onError = (errors: any) => {
    props.onInvalidSubmit(errors);
  };

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      handleSubmit(onSubmit, onError)();
    },
    setFormValue: setValue,
  }));

  return (
    <Card>
      <CardBody>
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="flex flex-col gap-4"
        >
          <p>Stream Setting</p>
          <Controller
            name="endpointID"
            control={control}
            render={({
              field: { name, value, onChange, onBlur, ref },
              fieldState: { invalid, error },
            }) => (
              <Input ref={ref} name={name} type="text" className="hidden" />
            )}
          />
          <div className="flex flex-row items-center gap-4">
            <Controller
              name="mtu"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  type="number"
                  label="MTU"
                  className="basis-1/2"
                  description={t(
                    'Maximum Transmission Unit (MTU), please select a value between 576 and 1460. The default value is 1350',
                  )}
                  required
                  value={value?.toString()}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              name="tti"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  className="basis-1/2"
                  description={t(
                    'Transmission Time Interval, in milliseconds (ms), specifies the frequency at which mKCP will send data. Please select a value between 10 and 100. The default value is 50',
                  )}
                  type="number"
                  label="TTI"
                  required
                  value={value?.toString()}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
          </div>

          <div className="flex flex-row items-center gap-4">
            <Controller
              name="header"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Select
                  ref={ref}
                  name={name}
                  value={value}
                  selectionMode="single"
                  onChange={(e) => {
                    e.target.value && onChange(e.target.value);
                  }}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                  label="Header"
                  className="basis-1/2 pr-2"
                  selectedKeys={[value]}
                >
                  {headers.map((protocol) => (
                    <SelectItem key={protocol.key}>{protocol.label}</SelectItem>
                  ))}
                </Select>
              )}
            />
            <Controller
              name="congestion"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Tooltip
                  content={t(
                    'Enable Congestion Control, with a default value of false. When congestion control is enabled, V2Ray will automatically monitor network quality. In cases of severe packet loss, it will reduce throughput; when the network is stable, it will increase throughput accordingly',
                  )}
                >
                  <Checkbox
                    ref={ref}
                    name={name}
                    className="basis-1/2"
                    required
                    isSelected={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    isInvalid={invalid}
                    onValueChange={onChange}
                  >
                    Congestion
                  </Checkbox>
                </Tooltip>
              )}
            />
          </div>
          <div className="flex flex-row items-center gap-4">
            <Controller
              name="uplinkCapacity"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  type="number"
                  label="Uplink Capacity"
                  className="basis-1/2"
                  description={t(
                    'Uplink Capacity, which refers to the maximum bandwidth used by the host to send data, is measured in MB/s, with a default value of 5. Note that this is in bytes, not bits. It can be set to 0 to indicate a very small bandwidth',
                  )}
                  required
                  value={value?.toString()}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              name="downlinkCapacity"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  type="number"
                  label="Downlink Capacity"
                  className="basis-1/2"
                  description={t(
                    'Downlink Capacity, which is the maximum bandwidth used by the host to receive data, measured in MB/s, with a default value of 20. Note that it is in Bytes, not bits. It can be set to 0, indicating a very small bandwidth',
                  )}
                  required
                  value={value?.toString()}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
          </div>

          <div className="flex flex-row items-center gap-4">
            <Controller
              name="readBufferSize"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  type="number"
                  label="Read Buffer Size"
                  className="basis-1/2"
                  description={t(
                    'Single connection read buffer size, measured in MB. The default value is 2',
                  )}
                  required
                  value={value?.toString()}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              name="writeBufferSize"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  className="basis-1/2"
                  description={t(
                    'Single connection write buffer size, measured in MB. The default value is 2',
                  )}
                  type="number"
                  label="Write Buffer Size"
                  required
                  value={value?.toString()}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
export const Page = forwardRef<PageRef, PageProps>(PageComponent);
