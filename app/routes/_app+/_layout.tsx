import { Outlet, redirect, json, useLoaderData } from '@remix-run/react';
import * as NavBar from '~/modules/base/nav/main-nav';
import { queryUser } from '~/api';

export const clientLoader = async () => {
  try {
    const users = await queryUser({ userID: localStorage.getItem('userID')! });
    if (!users.length) {
      throw new Error('User not found');
    }
    return json({ user: users[0] });
  } catch (e) {
    console.error(e);
    localStorage.removeItem('userID');
  }
  return redirect('/login');
};

export default function AppLayoutPage() {
  const { user } = useLoaderData<typeof clientLoader>();

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
