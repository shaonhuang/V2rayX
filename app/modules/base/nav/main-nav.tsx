import React, { useState, useEffect } from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Card,
  CardHeader,
  CardBody,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import {
  queryUser,
  updateAppStatus,
  queryLanuage,
  updateGeneralSettings,
  updateProxyMode,
} from '~/api';
import { useNavigate, Link, json, useLoaderData, useLocation } from '@remix-run/react';
import { User } from '~/api/types';
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import { Types } from '~/api';
import { motion } from 'framer-motion';

type MenuItemType = { label: string; path: string; icon: string; isFolded: boolean };

const menuData: Array<MenuItemType> = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'i-feather-home',
    isFolded: true,
  },
  {
    label: 'Servers',
    path: '/endpoints',
    icon: 'i-feather-list',
    isFolded: true,
  },
  {
    label: 'Logs',
    path: '/logs',
    icon: 'i-feather-file-text',
    isFolded: true,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: 'i-feather-sliders',
    isFolded: true,
  },
  {
    label: 'About',
    path: '/about',
    icon: 'i-feather-info',
    isFolded: true,
  },
];

const MenuItem = ({ label, path, icon, isFolded }: MenuItemType) => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <Link className="flex h-8 max-w-[610px] flex-row items-center justify-center gap-2" to={path}>
      <span
        className={icon + ` ${location.pathname === path ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
      ></span>

      {isFolded || (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <p
            className={`text-sm ${location.pathname === path ? 'text-gray-200 dark:text-gray-700' : ''}`}
          >
            {t(label)}
          </p>
        </motion.div>
      )}
    </Link>
  );
};

const AvatarButton = ({ user }: { user: Types.User }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dropdown placement="right-start" backdrop="blur">
      <DropdownTrigger>
        <Avatar
          isBordered
          as="button"
          className="transition-transform"
          name={user.UserName}
          size="md"
        />
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Profile Actions"
        variant="flat"
        className="dark:bg-[#121212] dark:text-white"
      >
        <DropdownItem key="profile" className="h-14 gap-2">
          <p className="font-semibold">{t('Signed in as')}</p>
          <p className="font-semibold">{user.UserName}</p>
        </DropdownItem>
        <DropdownItem
          key="settings"
          onPress={() => {
            navigate('/settings');
          }}
        >
          {t('My Settings')}
        </DropdownItem>
        <DropdownItem
          key="configurations"
          onPress={() => {
            navigate('/endpoints');
          }}
        >
          {t('Endpoints Configurations')}
        </DropdownItem>
        <DropdownItem
          key="help_and_feedback"
          onPress={() => {
            navigate('/about');
          }}
        >
          {t('Help & Feedback')}
        </DropdownItem>
        <DropdownItem
          key="logout"
          color="danger"
          onPress={async () => {
            const stopDaemonStatus = await invoke('stop_daemon');
            if (stopDaemonStatus) {
              await invoke('unset_global_proxy');
              await invoke('unset_pac_proxy');
              await updateAppStatus({
                userID: localStorage.getItem('userID')!,
                data: { LoginState: 0, ServiceRunningState: 0 },
              });
              await updateProxyMode({
                userID: localStorage.getItem('userID')!,
                proxyMode: 'manual',
              });
              localStorage.removeItem('userID');
              toast.success(t('V2ray-core stopped and proxy mode switched to manual successfully'));
              await invoke('tray_update', {
                userId: '',
              });
              navigate('/login');
            } else {
              toast.error('Failed to stop v2ray-core');
            }
          }}
        >
          {t('Log Out')}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export const MainNav = ({ isFolded = true, user }: { isFolded?: boolean; user: Types.User }) => {
  const [isFoldController, setIsFoldController] = useState(isFolded);
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4">
      <AvatarButton user={user} />

      <nav className="flex flex-col items-start justify-center gap-6 px-2">
        {menuData
          .map((item) => ({ ...item, isFolded: isFoldController }))
          .map((item, idx) => {
            return <MenuItem {...item} key={idx} />;
          })}
      </nav>

      <div className="fixed bottom-8">
        <Button
          isIconOnly
          color="default"
          variant="bordered"
          aria-label="unfold"
          onPress={() => {
            setIsFoldController(!isFoldController);
          }}
        >
          {!isFoldController ? (
            <span className="i-feather-arrow-left" />
          ) : (
            <span className="i-feather-arrow-right" />
          )}
        </Button>
      </div>
    </div>
  );
};
