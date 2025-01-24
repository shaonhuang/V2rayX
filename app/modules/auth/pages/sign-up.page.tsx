// app/components/SignupForm.tsx
import { Card, CardHeader, CardBody, Button, Input } from '@heroui/react';
import { useNavigate } from '@remix-run/react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface SignupFormProps {
  error?: string;
}

const SignupSchema = z
  .object({
    username: z.string().min(1, { message: 'Username is required' }),
    password: z.string().min(6, { message: 'Use a minimum of 6 characters' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupSchemaType = z.infer<typeof SignupSchema>;

export const SignupForm: React.FC<SignupFormProps> = ({ error }) => {
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { username: '', password: '', confirmPassword: '' },
  });

  const onSubmit: SubmitHandler<SignupSchemaType> = async (data) => {
    // Since Remix handles form submissions via actions, this can be left empty
  };

  return (
    <Card className="h-auto w-96 p-6">
      <CardHeader className="px-4 pb-0 pt-2">
        <h2 className="text-xl font-bold uppercase">Register</h2>
      </CardHeader>
      <CardBody>
        <form
          method="post"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Username"
                placeholder="Enter your username"
                isInvalid={!!errors.username}
                helperText={errors.username?.message}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="password"
                label="Password"
                placeholder="Enter your password"
                isInvalid={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="password"
                label="Confirm Password"
                placeholder="Enter your password again"
                isInvalid={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
            )}
          />

          {error && <p className="text-red-500">{error}</p>}

          <div className="flex justify-between">
            <Button type="submit" color="primary">
              Register
            </Button>
            <Button
              type="button"
              onPress={() => navigate('/login')}
              color="secondary"
            >
              Back
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
