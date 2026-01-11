import { Card, CardBody, Input } from '@heroui/react';
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
import { addWebSocketStream, updateWebSocketStream } from '~/api';

const WsSchema = z.object({
  endpointID: z.string().min(1),
  host: z.string(),
  path: z.string(),
});

type WsSchema = z.infer<typeof WsSchema>;

const resolver = zodResolver(WsSchema);

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: WsSchema) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<WsSchema>;
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
  } = useForm<WsSchema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      host: '',
      path: '',
    },
  });

  const onSubmit: SubmitHandler<WsSchema> = async (data) => {
    try {
      if (props.type === 'add') {
        await addWebSocketStream({
          endpointID: data.endpointID,
          stream: {
            host: data.host,
            path: data.path,
          },
        });
      } else {
        await updateWebSocketStream({
          endpointID: data.endpointID,
          stream: {
            host: data.host,
            path: data.path,
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
              name="host"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  label="Host"
                  className="basis-1/2"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              name="path"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  ref={ref}
                  name={name}
                  label="Path"
                  className="basis-1/2"
                  value={value}
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
