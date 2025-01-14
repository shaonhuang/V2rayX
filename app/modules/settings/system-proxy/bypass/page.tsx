import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Image,
  Tabs,
  Tab,
  useDisclosure,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { Select, SelectSection, SelectItem } from '@nextui-org/select';

import { Listbox, ListboxItem } from '@nextui-org/react';
import { Checkbox } from '@nextui-org/checkbox';
import { Chip } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
import { Tooltip } from '@nextui-org/tooltip';
import { useLoaderData, useRevalidator, useNavigate } from '@remix-run/react';
import { Controller, type FieldErrors, useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { queryBypass, updateBypass, Types, queryDashboard } from '~/api';
import EditorComponent from '~/modules/MonacoEditorComponent';

import * as _ from 'lodash';
import * as yaml from 'js-yaml';
import { invoke } from '@tauri-apps/api/core';

export const loader = async () => {
  const res = await queryBypass({ userID: localStorage.getItem('userID')! });
  return res;
};

export function Page() {
  const data = useLoaderData();
  const revalidator = useRevalidator();
  const userID = localStorage.getItem('userID')!;
  const { BypassDomains } = data.SystemProxy.Bypass as Types.BypassDomains;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState<string>(yaml.dump(JSON.parse(BypassDomains)));

  const handleEditorChange = async (v: string, onClose: () => void) => {
    try {
      const bypassObj = yaml.load(v);
      await updateBypass({ userID, bypass: JSON.stringify(bypassObj) });
      const dashboardResData = await queryDashboard({ userID });
      if (dashboardResData.proxyMode === 'global') {
        await invoke('unset_global_proxy');
        await invoke('setup_global_proxy', {
          host: dashboardResData.http[0].listen,
          httpPort: dashboardResData.http[0].port,
          socksPort: dashboardResData.socks[0].port,
          bypassDomains: bypassObj.bypass,
        });
        toast.success(t('Save success and auto configured bypass rules'));
      } else {
        toast.success(t('Save success'));
      }
      revalidator.revalidate();
      onClose();
    } catch (e) {
      toast.error(t('Invalid Yaml format'));
    }
    return;
  };

  return (
    <>
      <Button
        color="primary"
        onPress={() => {
          onOpen();
        }}
      >
        <span className="i-feather-edit" /> {t('Edit')}
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{t('Bypass Domain/IPNet')}</ModalHeader>
              <ModalBody className="flex w-full flex-col items-center justify-center">
                <Card>
                  <CardBody className="gap-8 p-4">
                    <p className="text-sm text-gray-500">
                      {t('Edit Domain/IPNet which will bypass proxy')}
                    </p>
                    <EditorComponent
                      className="h-48 w-[32rem]"
                      defaultLanguage="yaml"
                      defaultValue={content}
                      onChange={(v, event) => setContent(v)}
                    />
                  </CardBody>
                </Card>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {t('Cancel')}
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    handleEditorChange(content, onClose);
                  }}
                >
                  {t('Save')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
