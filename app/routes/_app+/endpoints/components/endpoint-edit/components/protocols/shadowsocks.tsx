import {
  Card,
  CardBody,
  Button,
  Select,
  SelectItem,
  Input,
} from '@heroui/react';
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
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from 'react';
import { addShadowsocks, updateShadowsocks } from '~/api';
import { open } from '@tauri-apps/plugin-shell';

const algorithmTypes = [
  'none',
  'chacha20-poly1305',
  'chacha20-ietf-poly1305',
  'aes-256-gcm',
  'aes-128-gcm',
].map((algorithm) => ({ key: algorithm, label: algorithm }));

const ShadowsocksSchema = z.object({
  endpointID: z.string().min(1),
  address: z.string().min(1, { message: 'IP is required' }),
  port: z
    .number()
    .positive({ message: 'Port is required' })
    .lte(65535, { message: 'this👏is👏too👏big' }),
  password: z.string().min(1, { message: 'Password is required' }),
  level: z.number().min(0, { message: 'Level is required' }),
  encryptionAlgorithm: z
    .string()
    .min(1, { message: 'Encryption Algorithm is required' }),
});

type ShadowsocksSchema = z.infer<typeof ShadowsocksSchema>;

const resolver = zodResolver(ShadowsocksSchema);

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (props: {
    protocol: 'shadowsocks';
    data: ShadowsocksSchema;
  }) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<ShadowsocksSchema>;
}

const PageComponent: ForwardRefRenderFunction<PageRef, PageProps> = (
  props,
  ref,
) => {
  const userID = localStorage.getItem('userID')!;
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isValid },
    setValue,
  } = useForm<ShadowsocksSchema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      address: '127.0.0.1',
      port: 443,
      password: '',
      level: 1,
      encryptionAlgorithm: 'none',
    },
  });

  const { t } = useTranslation();

  const onSubmit: SubmitHandler<ShadowsocksSchema> = async (data) => {
    props.onValidSubmit({
      protocol: 'shadowsocks',
      data: data as ShadowsocksSchema,
    });
    try {
      if (props.type === 'add') {
        await addShadowsocks({
          endpointID: data.endpointID,
          shadowsocks: {
            address: data.address,
            port: data.port,
            password: data.password,
            level: data.level,
            method: data.encryptionAlgorithm,
          },
        });
      } else {
        await updateShadowsocks({
          endpointID: data.endpointID,
          shadowsocks: {
            address: data.address,
            port: data.port,
            password: data.password,
            level: data.level,
            method: data.encryptionAlgorithm,
          },
        });
      }
      // ss://YWVzLTI1Ni1nY206ZG9uZ3RhaXdhbmcuY29t@46.17.40.57:11111#www.dongtaiwang.com%E6%B4%9B%E6%9D%89%E7%9F%B6
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
          <div className="flex flex-row items-center justify-start gap-2">
            <div>{t('Endpoint Settings')}</div>
            <Tooltip
              content={
                <div className="m-2">
                  {t('Check this link for configure field details')}
                  <Button
                    isIconOnly
                    className="mx-2"
                    onPress={async () => {
                      await open(
                        'https://www.v2fly.org/config/protocols/shadowsocks.html',
                      );
                    }}
                  >
                    <span className="i-feather-external-link" />
                  </Button>
                </div>
              }
            >
              <span className="i-mdi-tooltip-help" />
            </Tooltip>
          </div>
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
              name="address"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  type="text"
                  label="Address"
                  className="basis-3/4"
                  required
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
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
                  ref={ref}
                  name={name}
                  type="number"
                  label="Port"
                  className="basis-1/4"
                  required
                  value={value?.toString()}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                  placeholder="443"
                  endContent={<span className="i-mdi-ear-hearing" />}
                />
              )}
            />
          </div>

          <div className="flex flex-row items-center gap-4">
            <Controller
              name="password"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  label="Password"
                  className="basis-3/4"
                  required
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              name="level"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  className="basis-1/4"
                  type="number"
                  label="Level"
                  disabled
                  required
                  value={value.toString()}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
          </div>
          <div className="flex flex-grow flex-row justify-center">
            <Controller
              name="encryptionAlgorithm"
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
                  label={t('Encryption Algorithm')}
                  className="max-w-xs"
                  defaultSelectedKeys={['none']}
                >
                  {algorithmTypes.map((algorithm) => (
                    <SelectItem key={algorithm.key}>
                      {algorithm.label}
                    </SelectItem>
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
