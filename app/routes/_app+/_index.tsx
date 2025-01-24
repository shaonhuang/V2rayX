import type { MetaFunction } from '@remix-run/node';
import { useLoaderData, json, redirect, useNavigate } from '@remix-run/react';
import { useTheme } from '@heroui/use-theme';
import { useLayoutEffect, useEffect } from 'react';
import { Spinner } from '@heroui/react';
import { queryAppearance } from '~/api';
import SystemThemeManager from '~/utils/theme.util';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export const clientLoader = async () => {
  if (!localStorage.getItem('userID')) {
    return redirect('/login');
  }
  try {
    const appearance = await queryAppearance({
      userID: localStorage.getItem('userID')!,
    });
    return json({ appearance });
  } catch (e) {
    console.error(e);
  }
  return redirect('/login');
};

export default function Index() {
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const res = useLoaderData<typeof clientLoader>();

  useLayoutEffect(() => {
    const font = res.appearance.font;
    if (res) {
      if (res.appearance.theme !== 'system') {
        setTheme(res.appearance.theme);
      } else {
        setTheme('system');
        SystemThemeManager.enableSystemThemeListener(() => {
          setTheme('system');
        });
      }
      document.body.style.fontFamily =
        font === 'sans-serif'
          ? 'NotoSansSC, sans-serif'
          : `${font}, NotoSansSC, sans-serif`;
      window.remixNavigate = navigate;
      navigate('/dashboard');
    }
  }, []);
  useEffect(() => {}, []);
  return <Spinner size="lg" />;
}
