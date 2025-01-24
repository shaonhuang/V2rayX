import { Outlet } from '@remix-run/react';

export default function Auth() {
  return (
    <div className="flex h-screen flex-row items-center justify-center">
      <Outlet />
    </div>
  );
}
