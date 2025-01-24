import { Card, CardBody, Select, SelectItem, Input } from '@heroui/react';
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
import { addQuicStream, updateQuicStream } from '~/api';

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

const security = ['none', 'aes-128-gcm', 'chacha20-poly1305'].map((sec) => ({
  key: sec,
  label: sec,
}));

const QuicSchema = z.object({
  endpointID: z.string().min(1),
  key: z.string().min(1, { message: 'Key is required' }),
  security: z.string().min(1, { message: 'Security is required' }),
  header: z.string().min(1, { message: 'Header is required' }),
});

type QuicSchema = z.infer<typeof QuicSchema>;

const resolver = zodResolver(QuicSchema);

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: QuicSchema) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<QuicSchema>;
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
  } = useForm<QuicSchema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      key: '',
      security: 'none',
      header: 'none',
    },
  });

  const onSubmit: SubmitHandler<QuicSchema> = async (data) => {
    try {
      if (props.type === 'add') {
        await addQuicStream({
          endpointID: data.endpointID,
          quic: {
            key: data.key,
            security: data.security,
            header: data.header,
          },
        });
      } else {
        await updateQuicStream({
          endpointID: data.endpointID,
          quic: {
            key: data.key,
            security: data.security,
            header: data.header,
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
          <Controller
            name="key"
            control={control}
            render={({
              field: { name, value, onChange, onBlur, ref },
              fieldState: { invalid, error },
            }) => (
              <Input
                ref={ref}
                name={name}
                type="text"
                label="Key"
                required
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                isInvalid={invalid}
                errorMessage={error?.message}
              />
            )}
          />

          <div className="flex flex-row items-center gap-4">
            <Controller
              name="security"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Select
                  ref={ref}
                  name={name}
                  selectedKeys={[value]}
                  selectionMode="single"
                  onChange={(e) => {
                    e.target.value && onChange(e.target.value);
                  }}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                  label="Security"
                  className="basis-1/2"
                  defaultSelectedKeys={['auto']}
                >
                  {security.map((sec) => (
                    <SelectItem key={sec.key}>{sec.label}</SelectItem>
                  ))}
                </Select>
              )}
            />
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
                  selectionMode="single"
                  selectedKeys={[value]}
                  onChange={(e) => {
                    e.target.value && onChange(e.target.value);
                  }}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                  label="Header"
                  className="basis-1/2"
                >
                  {headers.map((protocol) => (
                    <SelectItem key={protocol.key}>{protocol.label}</SelectItem>
                  ))}
                </Select>
              )}
            />
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export const Page = forwardRef<PageRef, PageProps>(PageComponent);
