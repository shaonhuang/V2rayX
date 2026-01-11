import { Card, CardBody, Input } from '@heroui/react';
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

import { addGrpcStream, updateGrpcStream } from '~/api';

const GrpcSchema = z.object({
  endpointID: z.string().min(1),
  serviceName: z.string().min(1, { message: 'Server Name is required' }),
});

type GrpcSchema = z.infer<typeof GrpcSchema>;

const resolver = zodResolver(GrpcSchema);

interface PageProps {
  type: 'add' | 'edit';
  onValidSubmit: (data: GrpcSchema) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  setFormValue: UseFormSetValue<GrpcSchema>;
}

const PageComponent: ForwardRefRenderFunction<PageRef, PageProps> = (
  props,
  ref,
) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue,
  } = useForm<GrpcSchema>({
    mode: 'onSubmit',
    resolver,
    defaultValues: {
      endpointID: '',
      serviceName: '',
    },
  });

  const onSubmit: SubmitHandler<GrpcSchema> = async (data) => {
    try {
      if (props.type === 'add') {
        await addGrpcStream({
          endpointID: data.endpointID,
          grpc: {
            serviceName: data.serviceName,
          },
        });
      } else {
        await updateGrpcStream({
          endpointID: data.endpointID,
          grpc: {
            serviceName: data.serviceName,
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
            name="serviceName"
            control={control}
            render={({
              field: { name, value, onChange, onBlur, ref },
              fieldState: { invalid, error },
            }) => (
              <Input
                ref={ref}
                name={name}
                type="text"
                label="Service Name"
                description={t(
                  "Name of the gRPC service. It functions similarly to a path to prevent detection of whether this transmission protocol is deployed. It's recommended to use a complex random string. According to gRPC specifications, it's advised not to use characters other than uppercase and lowercase English letters, numbers, underscores, and periods",
                )}
                required
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                isInvalid={invalid}
                errorMessage={error?.message}
              />
            )}
          />
        </form>
      </CardBody>
    </Card>
  );
};

export const Page = forwardRef<PageRef, PageProps>(PageComponent);
