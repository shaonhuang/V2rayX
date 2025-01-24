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
import { addVmess, updateVmess } from '~/api';
import { open } from '@tauri-apps/plugin-shell';

const algorithmTypes = [
  'auto',
  'aes-256-cfb',
  'aes-128-cfb',
  'chacha20',
  'chacha20-ietf',
  'aes-256-gcm',
  'aes-128-gcm',
].map((algorithm) => ({ key: algorithm, label: algorithm }));

const VMessSchema = z.object({
  endpointID: z.string().min(1),
  ip: z.string().min(1, { message: 'IP is required' }),
  port: z
    .number()
    .positive({ message: 'Port is required' })
    .lte(65535, { message: 'this👏is👏too👏big' }),
  uuid: z.string().min(1, { message: 'UUID is required' }),
  alterID: z
    .number()
    .gte(0, { message: 'this👏is👏too👏small' })
    .lte(65535, { message: 'this👏is👏too👏big' }),
  level: z.number().min(0, { message: 'Level is required' }),
  encryptionAlgorithm: z
    .string()
    .min(1, { message: 'Encryption Algorithm is required' }),
});

type VMessSchema = z.infer<typeof VMessSchema>;

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: VMessSchema) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<VMessSchema>;
}

const resolver = zodResolver(VMessSchema);

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
  } = useForm<VMessSchema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      ip: '127.0.0.1',
      port: 443,
      uuid: '',
      alterID: 0,
      level: 1,
      encryptionAlgorithm: 'auto',
    },
  });

  const { t } = useTranslation();

  const onSubmit: SubmitHandler<VMessSchema> = async (data) => {
    try {
      if (props.type === 'add') {
        await addVmess({
          endpointID: data.endpointID,
          vmess: {
            address: data.ip,
            port: data.port,
            uuid: data.uuid,
            alterID: data.alterID,
            level: data.level,
            security: data.encryptionAlgorithm,
          },
        });
      } else {
        await updateVmess({
          endpointID: data.endpointID,
          vmess: {
            address: data.ip,
            port: data.port,
            uuid: data.uuid,
            alterID: data.alterID,
            level: data.level,
            security: data.encryptionAlgorithm,
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
                        'https://www.v2fly.org/config/protocols/vmess.html',
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
              name="ip"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  type="text"
                  label="IP"
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
          <Controller
            name="uuid"
            control={control}
            render={({
              field: { name, value, onChange, onBlur, ref },
              fieldState: { invalid, error },
            }) => (
              <Input
                ref={ref}
                name={name}
                label="UUID"
                className="flex-grow"
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
              name="alterID"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  type="number"
                  label="Alter Id"
                  className="basis-3/4"
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
                  name={name}
                  ref={ref}
                  selectedKeys={[value]}
                  onChange={(e) => {
                    e.target.value && onChange(e.target.value);
                  }}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  selectionMode="single"
                  errorMessage={error?.message}
                  label={t('Encryption Algorithm')}
                  className="max-w-xs"
                  defaultSelectedKeys={['auto']}
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
