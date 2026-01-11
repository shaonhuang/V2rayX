import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Chip,
} from '@heroui/react';
import { deleteGroup, updateAppStatus } from '~/api';
import toast from 'react-hot-toast';
import { useRevalidator } from 'react-router';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { updateServiceRunningState } from '~/api';

const DialogButton = (props: {
  groupID: string;
  groupName: string;
  isSelectedEndpointInGroup: boolean;
}) => {
  const revalidator = useRevalidator();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t, i18n } = useTranslation();

  return (
    <>
      <Button
        onPress={onOpen}
        isIconOnly
        color="primary"
        variant="ghost"
        aria-label="delete all"
      >
        <span className="i-feather-trash" />
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t('Delete Endpoints Group')}
              </ModalHeader>
              <ModalBody>
                <p>
                  {props.groupName === 'local-endpoints' ? (
                    <>
                      {t('Are you sure you want to delete')}{' '}
                      <Chip color="warning" variant="bordered">
                        {props.groupName}
                      </Chip>{' '}
                      {t('Group')}?
                    </>
                  ) : (
                    <>
                      {t('Are you sure you want to delete')}{' '}
                      <Chip color="warning" variant="bordered">
                        {props.groupName}
                      </Chip>{' '}
                      {t('subscription')}?{' '}
                      {t(
                        'It would also delete the subscription item on the subscription page',
                      )}
                      .
                    </>
                  )}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="flat" onPress={onClose}>
                  {t('KEEP IT')}
                </Button>
                <Button
                  color="danger"
                  onPress={async () => {
                    const userID = localStorage.getItem('userID')!;
                    // keep the execute order to update the tray
                    await updateAppStatus({
                      userID: userID,
                      data: { ServiceRunningState: 0 },
                    });
                    await deleteGroup({ groupID: props.groupID });
                    toast.success(
                      `${props.groupName} ${t('Group deleted successfully')}`,
                    );
                    if (props.isSelectedEndpointInGroup) {
                      await invoke('stop_v2ray_daemon', {
                        userId: userID,
                      });
                      toast.success(t('V2ray-core proxy service has stopped'));
                    }
                    revalidator.revalidate();
                    onClose();
                  }}
                >
                  {t('DELETE IT')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default DialogButton;
