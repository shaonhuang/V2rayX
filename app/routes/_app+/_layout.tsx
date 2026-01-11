import { Outlet, redirect, useLoaderData, useNavigate } from 'react-router';
import * as NavBar from '~/modules/base/nav/main-nav';
import { queryUser } from '~/api';
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

export const clientLoader = async () => {
  try {
    const users = await queryUser({ userID: localStorage.getItem('userID')! });
    if (!users.length) {
      throw new Error('User not found');
    }
    return { user: users[0] };
  } catch (e) {
    console.error(e);
    localStorage.removeItem('userID');
  }
  return redirect('/login');
};

export default function AppLayoutPage() {
  const { user } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();

  // Listen for navigation events from system tray
  useEffect(() => {
    const unlisten = listen<string>('navigate', (event) => {
      navigate(event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [navigate]);

  return (
    <div className="flex h-screen flex-row">
      <div className="mx-6 flex flex-col items-center justify-center">
        <NavBar.MainNav user={user} />
      </div>
      <main className="my-auto mr-4 flex-grow overflow-hidden p-4">
        <Outlet />
      </main>
    </div>
  );
}
