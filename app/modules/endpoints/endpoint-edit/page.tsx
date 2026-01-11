import React, { useState, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  PressEvent,
} from '@heroui/react';
import * as EditComponent from './components';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import Editor from '~/modules/MonacoEditorComponent';
import type { PageRef } from './components';

import {
  queryEndpoint,
  queryEndpoints,
  updateServiceRunningState,
} from '~/api';
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Dialog = NiceModal.create(
  ({
    type,
    endpoint,
    handleReload,
    url,
  }: {
    type: 'add' | 'edit';
    endpoint: any | null;
    handleReload: () => void;
    url?: string;
  }) => {
    const { t } = useTranslation();
    const submitRef = useRef<PageRef>(null);
    const modal = useModal();
    const [mode, setMode] = useState('gui');

    const handleEditorChange = (value: string) => {
      console.log(value);
    };

    const handleValidSubmit = async (endpointID: string) => {
      let isSelected =
        (
          await queryEndpoints({
            userID: localStorage.getItem('userID')!,
          })
        ).filter((i) => i.Active === 1).length > 0;
      if (isSelected) {
        await invoke('stop_daemon');
        await updateServiceRunningState({
          userID: localStorage.getItem('userID')!,
          serviceRunningState: false,
        });
      }

      const injectConfig = await invoke('inject_config', {
        endpointId: endpointID,
        userId: localStorage.getItem('userID')!,
      });
      if (injectConfig) {
        toast.success(t('Endpoint updated successfully'));
      } else {
        toast.error(t('Failed to updated endpoint'));
      }

      await invoke('tray_update', {
        userId: localStorage.getItem('userID')!,
      });
      handleReload();
      modal.hide();
    };

    return (
      <Modal
        size="4xl"
        isOpen={modal.visible}
        scrollBehavior="inside"
        onOpenChange={(v) => {
          if (!v) {
            modal.hide();
          }
        }}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t('Configure Endpoint')}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-row items-center justify-between">
                  <p>{`${t('Mode')}: ${mode === 'gui' ? t('GUI') : t('Editor')}`}</p>
                  <Switch
                    isDisabled
                    onValueChange={(e) => {
                      setMode(e ? 'editor' : 'gui');
                    }}
                  >
                    {t('Advanced')}
                  </Switch>
                </div>
                {mode === 'gui' ? (
                  <EditComponent.Page
                    ref={submitRef}
                    type={type}
                    endpoint={endpoint}
                    url={url}
                    onValidSubmit={handleValidSubmit}
                    onInvalidSubmit={(errors) => {
                      console.error('Form validation failed:', errors);
                      toast.error(t('Please check your input'));
                    }}
                  />
                ) : (
                  <Editor
                    className="h-96 py-2"
                    defaultLanguage="json"
                    defaultValue={`{
  "outbounds": [
  {
   "tag": "Edit your outbounds here and keep outbounds object under outbounds array"
  },
  {
  "protocol": "freedom",
  "settings": {},
  "tag": "direct"
  },
  {
  "protocol": "blackhole",
  "settings": {},
  "tag": "blocked"
  }]
}`}
                    onChange={handleEditorChange}
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {t('Cancel')}
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    if (submitRef.current) {
                      submitRef.current.submitForm();
                      onClose();
                    } else {
                      toast.error(t('Form reference not found'));
                    }
                  }}
                >
                  {t('Save')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  },
);

export const DialogButton = ({
  type,
  disabled,
  endpointID,
  handleReload,
  onClick,
  isIconOnly,
  children,
  url,
  ...props
}: {
  type: 'add' | 'edit';
  disabled?: boolean;
  endpointID?: string;
  handleReload: () => void;
  onClick?: (e: PressEvent) => void;
  isIconOnly?: boolean;
  url?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) => {
  const handleOpen = async (e: PressEvent) => {
    let endpoint: any | null = null;
    if (type === 'edit' && endpointID) {
      endpoint = await queryEndpoint({ endpointID });
    }

    // 使用 NiceModal 显示对话框，这样对话框的生命周期独立于父组件
    NiceModal.show(Dialog, {
      type,
      endpoint,
      handleReload,
      url,
    });

    onClick?.(e);
  };

  // Auto-handle URL params for direct imports
  // useEffect(() => {
  //   if (isOpen && formRef.current) {
  //     const searchParams = new URLSearchParams(location.search);
  //     if (
  //       searchParams.get('m') === 'link' ||
  //       searchParams.get('m') === 'screenshot'
  //     ) {
  //       // The form is open and ready for import
  //       console.log('Add endpoint dialog open, ready for import');
  //     }
  //   }
  // }, [isOpen, formRef.current, location.search]);

  return (
    <Button
      isIconOnly={isIconOnly}
      isDisabled={disabled}
      onPress={handleOpen}
      {...props}
    >
      {children}
    </Button>
  );
};
