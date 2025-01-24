import { Popover, PopoverTrigger, PopoverContent, Button } from '@heroui/react';
import * as Edit from '../endpoint-edit/page';
import { useState } from 'react';
import { useNavigate, useRevalidator } from '@remix-run/react';
import { deleteEndpoint } from '~/api';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

export function MoreButton({ endpointID }: { endpointID: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { t, i18n } = useTranslation();

  return (
    <Popover
      placement="top"
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <PopoverTrigger>
        <Button onPress={() => setIsOpen(true)}>
          <span className="i-mdi-dots-horizontal" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        {(titleProps) => (
          <div className="flex flex-col gap-2 px-1 py-2">
            <Edit.DialogButton
              type="edit"
              endpointID={endpointID}
              handleReload={() => {
                revalidator.revalidate();
              }}
              onClick={async () => {
                setIsOpen(false);
                await invoke('stop_daemon');
              }}
            >
              <div className="flex flex-row items-center justify-start gap-2">
                <span className="i-feather-edit" />
                <p>{t('Edit')}</p>
              </div>
            </Edit.DialogButton>
            <Button
              onPress={async () => {
                setIsOpen(false);
                await invoke('stop_daemon');
                await deleteEndpoint({ endpointID });
                await invoke('tray_update', {
                  userId: localStorage.getItem('userID')!,
                });
                revalidator.revalidate();
              }}
            >
              <div className="flex flex-row items-center justify-start gap-2">
                <span className="i-feather-delete" />
                <p>{t('Delete')}</p>
              </div>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
