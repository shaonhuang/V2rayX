import type { MetaFunction } from 'react-router';
import { useLoaderData, redirect, useNavigate } from 'react-router';
import { useTheme } from '@heroui/use-theme';
import { useLayoutEffect } from 'react';
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
    return { appearance };
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
      (window as any).remixNavigate = navigate;
      navigate('/dashboard');
    }
  }, []);

  return null;
}
