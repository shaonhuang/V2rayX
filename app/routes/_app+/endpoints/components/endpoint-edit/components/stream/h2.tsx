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
import { addHttp2Stream, updateHttp2Stream } from '~/api';

const H2Schema = z.object({
  endpointID: z.string().min(1),
  host: z.string().min(1, { message: 'Path is required' }),
  path: z.string().min(1, { message: 'Host is required' }),
});

type H2Schema = z.infer<typeof H2Schema>;

const resolver = zodResolver(H2Schema);

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: H2Schema) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<H2Schema>;
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
  } = useForm<H2Schema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      host: '',
      path: '',
    },
  });

  const onSubmit: SubmitHandler<H2Schema> = async (data) => {
    try {
      if (props.type === 'add') {
        await addHttp2Stream({
          endpointID: data.endpointID,
          http: {
            host: data.host,
            path: data.path,
            method: 'PUT',
          },
        });
      } else {
        await updateHttp2Stream({
          endpointID: data.endpointID,
          http: {
            host: data.host,
            path: data.path,
            method: 'PUT',
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
                  type="text"
                  label="Host"
                  className="basis-1/2"
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
                  label="Path"
                  className="basis-1/2"
                  required
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
