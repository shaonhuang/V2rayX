import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { useNavigate } from '@remix-run/react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';

export const clientLoader = async () => {
  const navigate = useNavigate();
};

const Dialog = NiceModal.create(({ type }: { type: string }) => {
  const modal = useModal();

  const handleEditorChange = (value) => {
    console.log(value);
  };
  return (
    <Modal
      size="sm"
      isOpen={modal.visible}
      scrollBehavior="inside"
      onOpenChange={(v) => {
        modal.hide();
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">QR Code</ModalHeader>
            <ModalBody>
              <div className="flex flex-row items-center justify-between"></div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
});

export const DialogButton = (props) => {
  const navigate = useNavigate();
  return (
    <Button
      onPress={() => {
        props.onClick();
        NiceModal.show(Dialog, { type: 'share' });
      }}
    >
      <div className="flex flex-row items-center justify-start gap-2">
        <span className="i-mdi-qrcode" />
        <p>Share QR Code</p>
      </div>
    </Button>
  );
};
