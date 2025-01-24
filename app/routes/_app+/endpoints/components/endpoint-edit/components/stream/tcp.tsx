import { Card, CardBody, Select, SelectItem, Input } from '@heroui/react';
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
import { addTcpStream, updateTcpStream } from '~/api';

const protocols = ['none', 'http'].map((procotol) => ({
  key: procotol,
  label: procotol,
}));

const TcpSchema = z.discriminatedUnion('type', [
  z.object({
    endpointID: z.string().min(1, { message: 'Outbound ID is required' }),
    type: z.literal('none'),
  }),
  z.object({
    endpointID: z.string().min(1, { message: 'Outbound ID is required' }),
    type: z.literal('http'),
    path: z.string().min(1, { message: 'Request Path is required' }),
    host: z.string().min(1, { message: 'Request Host is required' }),
  }),
]);

type TcpSchema = z.infer<typeof TcpSchema>;

const resolver = zodResolver(TcpSchema);

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: TcpSchema) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<TcpSchema>;
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
  } = useForm<TcpSchema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      type: 'none',
    },
  });

  const onSubmit: SubmitHandler<TcpSchema> = async (data) => {
    try {
      if (props.type === 'add') {
        const { endpointID, type, path, host } = data;

        // Define tcp configuration based on type
        const tcpConfig = {
          endpointID,
          tcp: {
            header: type,
            requestHost: type === 'http' ? (path ?? null) : null,
            requestPath: type === 'http' ? (host ?? null) : null,
          },
        };

        await addTcpStream(tcpConfig);
      } else {
        const { endpointID, type, path, host } = data;

        // Define tcp configuration based on type
        const tcpConfig = {
          endpointID,
          tcp: {
            header: type,
            requestHost: type === 'http' ? (path ?? null) : null,
            requestPath: type === 'http' ? (host ?? null) : null,
          },
        };

        await updateTcpStream(tcpConfig);
      }
    } catch (e) {
      console.log(e);
    }
  };
  const watchType = watch('type');

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
      <CardBody className="flex flex-col gap-4">
        <p>Stream Setting</p>
        <Controller
          name="endpointID"
          control={control}
          render={({
            field: { name, value, onChange, onBlur, ref },
            fieldState: { invalid, error },
          }) => <Input ref={ref} name={name} type="text" className="hidden" />}
        />
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="flex flex-col gap-4"
        >
          <Controller
            name="type"
            control={control}
            render={({
              field: { name, value, onChange, onBlur, ref },
              fieldState: { invalid, error },
            }) => (
              <Select
                ref={ref}
                selectedKeys={[value]}
                name={name}
                selectionMode="single"
                label="Type"
                className="max-w-xs"
                defaultSelectedKeys={['none']}
                onChange={(e) => {
                  e.target.value && onChange(e.target.value);
                }}
                onBlur={onBlur}
                isInvalid={invalid}
                errorMessage={error?.message}
              >
                {protocols.map((protocol) => (
                  <SelectItem key={protocol.key}>{protocol.label}</SelectItem>
                ))}
              </Select>
            )}
          />

          {watchType === 'http' && (
            <>
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
                    type="text"
                    label="Request Path"
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
                    type="text"
                    label="Request Host"
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
            </>
          )}
        </form>
      </CardBody>
    </Card>
  );
};

export const Page = forwardRef<PageRef, PageProps>(PageComponent);
