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
import toast from 'react-hot-toast';
import {
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from 'react';
import { addTrojan, updateTrojan } from '~/api';

const TrojanSchema = z.object({
  endpointID: z.string().min(1),
  ip: z.string().min(1, { message: 'IP is required' }),
  port: z
    .number()
    .positive({ message: 'Port is required' })
    .lte(65535, { message: 'this👏is👏too👏big' }),
  password: z.string().min(1, { message: 'Password is required' }),
  level: z.number().min(0, { message: 'Level is required' }),
});

type TrojanSchema = z.infer<typeof TrojanSchema>;

const resolver = zodResolver(TrojanSchema);

type ShadowsocksFormValues = z.infer<typeof TrojanSchema>;

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: ShadowsocksFormValues) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<TrojanSchema>;
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
  } = useForm<TrojanSchema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      ip: '127.0.0.1',
      port: 443,
      password: '',
      level: 0,
    },
  });
  const { t } = useTranslation();

  const onSubmit: SubmitHandler<TrojanSchema> = async (data) => {
    try {
      if (props.type === 'add') {
        await addTrojan({
          endpointID: data.endpointID,
          trojan: {
            address: data.ip,
            port: data.port,
            password: data.password,
            level: data.level,
          },
        });
      } else {
        await updateTrojan({
          endpointID: data.endpointID,
          trojan: {
            address: data.ip,
            port: data.port,
            password: data.password,
            level: data.level,
          },
        });
      }
    } catch (e) {
      console.log(e);
      toast.error('Failed to add Trojan');
      toast.error(e.message);
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
                        'https://www.v2fly.org/config/protocols/trojan.html',
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
          <div className="flex flex-grow flex-row justify-center">
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
        </form>
      </CardBody>
    </Card>
  );
};

export const Page = forwardRef<PageRef, PageProps>(PageComponent);
