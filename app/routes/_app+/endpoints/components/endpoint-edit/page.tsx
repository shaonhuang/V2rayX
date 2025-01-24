import React, { useState, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
} from '@heroui/react';
import * as EditComponent from './components';
import { useNavigate } from '@remix-run/react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import Editor from '~/modules/MonacoEditorComponent';

import { queryEndpoint } from '~/api';
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Dialog = NiceModal.create(
  ({
    type,
    endpoint,
    handleReload,
  }: {
    type: 'add' | 'edit';
    endpoint: any | null;
    handleReload: () => void;
  }) => {
    const { t, i18n } = useTranslation();
    const submitRef = useRef();

    const modal = useModal();
    const [mode, setMode] = useState('gui');

    const handleEditorChange = (value) => {
      console.log(value);
    };

    const handleValidSubmit = async (endpointID: string) => {
      setTimeout(async () => {
        const stopDaemonStatus = await invoke('stop_daemon');
        const injectConfig = await invoke('inject_config', {
          endpointId: endpointID,
          userId: localStorage.getItem('userID')!,
        });
        if (stopDaemonStatus && injectConfig) {
          toast.success(t('Endpoint updated successfully'));
        } else {
          toast.error(t('Failed to updated endpoint'));
        }
        await invoke('tray_update', {
          userId: localStorage.getItem('userID')!,
        });
      }, 1000);
      handleReload();
    };

    return (
      <Modal
        size="4xl"
        isOpen={modal.visible}
        scrollBehavior="inside"
        onOpenChange={(v) => {
          modal.hide();
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
                    onValidSubmit={handleValidSubmit}
                    onInvalidSubmit={() => {}}
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
                    submitRef.current.submitForm();
                    onClose();
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

export const DialogButton = (props: {
  type: 'add' | 'edit';
  disabled?: boolean;
  endpointID?: string;
  handleReload: () => void;
  onClick?: () => void;
  isIconOnly?: boolean;
  children?: React.ReactNode;
}) => {
  const navigate = useNavigate();

  return (
    <Button
      isIconOnly={props.isIconOnly}
      disabled={props.disabled}
      onPress={async () => {
        let res = null;
        if (props.type === 'edit') {
          res = await queryEndpoint({
            endpointID: props.endpointID!,
          });
        }

        props.onClick && props.onClick();
        NiceModal.show(Dialog, {
          type: props.type,
          endpoint: res,
          handleReload: props.handleReload,
        });
      }}
    >
      {props.children}
    </Button>
  );
};
