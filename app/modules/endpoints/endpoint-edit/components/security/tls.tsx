import { Card, CardBody, Input } from '@heroui/react';
import { Checkbox } from '@heroui/checkbox';
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
import { addTlsSecurity, updateTlsSecurity } from '~/api';

const SecuritySchema = z.object({
  endpointID: z.string().min(1),
  serverName: z.string(),
  allowInsecure: z.boolean(),
});

type SecuritySchema = z.infer<typeof SecuritySchema>;

const resolver = zodResolver(SecuritySchema);

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: SecuritySchema) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<SecuritySchema>;
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
  } = useForm<SecuritySchema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      serverName: '',
      allowInsecure: false,
    },
  });

  const onSubmit: SubmitHandler<SecuritySchema> = async (data) => {
    try {
      if (props.type === 'add') {
        await addTlsSecurity({
          endpointID: data.endpointID,
          security: {
            serverName: data.serverName,
            allowInsecure: data.allowInsecure,
          },
        });
      } else {
        await updateTlsSecurity({
          endpointID: data.endpointID,
          security: {
            serverName: data.serverName,
            allowInsecure: data.allowInsecure,
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
          <p>Security</p>
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
              name="serverName"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  type="text"
                  label="Server Name"
                  className="basis-3/4"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              name="allowInsecure"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <div className="flex flex-grow basis-1/4 flex-row items-center justify-center">
                  <Checkbox
                    ref={ref}
                    name={name}
                    onBlur={onBlur}
                    isInvalid={invalid}
                    isSelected={value}
                    onValueChange={onChange}
                  >
                    Allow Insecure
                  </Checkbox>
                </div>
              )}
            />
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export const Page = forwardRef<PageRef, PageProps>(PageComponent);
