import { Card, CardBody, Button, Input } from '@heroui/react';
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
import { addHysteria2, updateHysteria2 } from '~/api';
import { open } from '@tauri-apps/plugin-shell';

const algorithmTypes = [
  'none',
  'chacha20-poly1305',
  'chacha20-ietf-poly1305',
  'aes-256-gcm',
  'aes-128-gcm',
].map((algorithm) => ({ key: algorithm, label: algorithm }));

const Hysteria2Schema = z.object({
  endpointID: z.string().min(1),
  address: z.string().min(1, { message: 'IP is required' }),
  port: z
    .number()
    .positive({ message: 'Port is required' })
    .lte(65535, { message: 'this👏is👏too👏big' }),
});

type Hysteria2Schema = z.infer<typeof Hysteria2Schema>;

const resolver = zodResolver(Hysteria2Schema);

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: Hysteria2Schema) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<Hysteria2Schema>;
}

const PageComponent: ForwardRefRenderFunction<PageRef, PageProps> = (
  props,
  ref,
) => {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue,
  } = useForm<Hysteria2Schema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      address: '127.0.0.1',
      port: 443,
    },
  });

  const { t } = useTranslation();

  const onSubmit: SubmitHandler<Hysteria2Schema> = async (data) => {
    try {
      if (props.type === 'add') {
        await addHysteria2({
          endpointID: data.endpointID,
          hysteria2: {
            address: data.address,
            port: data.port,
          },
        });
      } else {
        await updateHysteria2({
          endpointID: data.endpointID,
          hysteria2: {
            address: data.address,
            port: data.port,
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
        </form>
      </CardBody>
    </Card>
  );
};

export const Page = forwardRef<PageRef, PageProps>(PageComponent);
