// app/components/LoginForm.tsx
import { Card, CardHeader, CardBody, Button, Input } from '@heroui/react';
import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface LoginFormProps {
  error?: string;
}

const LoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginSchemaType = z.infer<typeof LoginSchema>;

export const LoginForm: React.FC<LoginFormProps> = ({ error }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
    // Since Remix handles form submissions via actions, this can be left empty
  };

  return (
    <Card className="h-auto w-96 p-6">
      <CardHeader className="px-4 pb-0 pt-2">
        <h2 className="text-xl font-bold uppercase">Login</h2>
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
                type={isVisible ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                isInvalid={!!errors.password}
                helperText={errors.password?.message}
                endContent={
                  <button
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    className="focus:outline-none"
                    aria-label="Toggle password visibility"
                  >
                    {isVisible ? (
                      <span className="i-feather-eye-off text-xl text-default-400" />
                    ) : (
                      <span className="i-feather-eye text-xl text-default-400" />
                    )}
                  </button>
                }
              />
            )}
          />

          {error && <p className="text-red-500">{error}</p>}

          <div className="flex justify-between">
            <Button type="submit" color="primary">
              Login
            </Button>
            <Button
              type="button"
              onPress={() => navigate('/signup')}
              color="secondary"
            >
              Register
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
