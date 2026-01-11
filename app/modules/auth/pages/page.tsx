import { Card, CardHeader, CardBody, Button, Input } from '@heroui/react';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import * as api from '~/api';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const SignUpSchema = z.object({
    username: z.string().min(1, { message: 'First name is required' }),
    password: z.string().min(1, { message: 'Password is required' }),
  });
  type SignUpSchema = z.infer<typeof SignUpSchema>;

  const resolver = zodResolver(SignUpSchema);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SignUpSchema>({
    resolver,
    defaultValues: { username: '', password: '' },
  });

  const onSubmit: SubmitHandler<SignUpSchema> = async (data) => {
    try {
      const user = (await api.login(data))?.[0];
      if (user) {
        toast.success(`Welcome back ${user?.UserName}!`);
        localStorage.setItem('userID', user.UserID);
        await api.updateAppStatus({
          userID: user.UserID,
          data: { LoginState: 1 },
        });
        await invoke('tray_update', {
          userId: user.UserID,
        });
        user?.UserID && navigate('/dashboard');
      } else {
        toast.error(t('Invalid username or password'));
      }
    } catch (e) {
      navigate('/login');
    }
  };

  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  return (
    <>
      <Card className="h-[28rem] w-96 px-6">
        <CardHeader className="px-4 pb-0 mt-6 font-bold uppercase text-2xl gap-2">
          <span className="i-mdi-log-in" />
          <p>LOGIN</p>
        </CardHeader>
        <CardBody className="flex flex-col items-start justify-center">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-4"
          >
            <Controller
              name="username"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  label="Username"
                  placeholder="Enter your username"
                  ref={ref}
                  name={name}
                  type="text"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  label="Password"
                  variant="bordered"
                  placeholder="Enter your password"
                  ref={ref}
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                      aria-label="toggle password visibility"
                    >
                      {isVisible ? (
                        <span className="i-feather-eye-off pointer-events-none text-xl text-default-400" />
                      ) : (
                        <span className="i-feather-eye pointer-events-none text-xl text-default-400" />
                      )}
                    </button>
                  }
                  type={isVisible ? 'text' : 'password'}
                  className="max-w-xs"
                />
              )}
            />

            <div className="flex flex-row justify-around mt-4 mb-2">
              <Button type="submit" color="primary">
                Login
              </Button>

              <Button
                onPress={() => {
                  navigate('/signup');
                }}
              >
                Sign up
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
};
const Register = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const SignUpSchema = z
    .object({
      username: z.string().min(1, { message: 'First name is required' }),
      password: z
        .string()
        .min(1, { message: 'Password is required' })
        .min(6, { message: 'Use a minimum of 6 characters' }),
      confirmPassword: z
        .string()
        .min(1, { message: 'Confirm password is required' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });
  type SignUpSchema = z.infer<typeof SignUpSchema>;

  const resolver = zodResolver(SignUpSchema);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SignUpSchema>({
    resolver,
    defaultValues: { username: '', password: '', confirmPassword: '' },
  });

  const onSubmit: SubmitHandler<SignUpSchema> = async (data) => {
    try {
      await api.register(data);
      toast.success(t('Account created successfully'));
      navigate('/login');
    } catch (e) {
      toast.error(t('This username is already in use'));
    }
  };
  return (
    <>
      <Card className="h-[28rem] w-96 px-6">
        <CardHeader className="px-4 pb-0 mt-6 font-bold uppercase text-2xl gap-2">
          <span className="i-mdi-register" />
          <p>Register</p>
        </CardHeader>
        <CardBody className="flex flex-col items-start justify-center">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-4"
          >
            <Controller
              name="username"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  label="Username"
                  placeholder="Enter your username"
                  ref={ref}
                  type="text"
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  label="Password"
                  placeholder="Enter your Password"
                  type="text"
                  ref={ref}
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={control}
              render={({
                field: { name, value, onChange, onBlur, ref },
                fieldState: { invalid, error },
              }) => (
                <Input
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  label="Check Password"
                  placeholder="Enter your Password again"
                  ref={ref}
                  type="text"
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  isInvalid={invalid}
                  errorMessage={error?.message}
                />
              )}
            />
            <div className="flex flex-row justify-around mt-4 mb-2">
              <Button type="submit" color="primary">
                Save
              </Button>
              <Button
                onPress={() => {
                  navigate('/login');
                }}
              >
                Back
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
};

export { Login, Register };
