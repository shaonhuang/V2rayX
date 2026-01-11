import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Skeleton,
} from '@heroui/react';
import { Alert } from '@heroui/alert';
import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  RefObject,
} from 'react';
import jsQR from 'jsqr';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { VMess, Shadowsocks, Trojan, Hysteria2 } from '~/lib/protocol';
import { useLocation, useNavigate } from 'react-router';
// Protocol-specific Zod schemas with enhanced validation
const VmessSchema = z.object({
  protocol: z.literal('vmess'),
  url: z
    .string()
    .regex(/^vmess:\/\//i, "Must start with 'vmess://'")
    .refine((url) => {
      try {
        new VMess(url); // This will throw if parsing fails
        return true;
      } catch (error) {
        return false;
      }
    }, 'Invalid VMess URL format'),
});

const ShadowsocksSchema = z.object({
  protocol: z.literal('ss'),
  url: z
    .string()
    .regex(/^ss:\/\//i, "Must start with 'ss://'")
    .refine((url) => {
      try {
        new Shadowsocks(url); // This will throw if parsing fails
        return true;
      } catch (error) {
        return false;
      }
    }, 'Invalid Shadowsocks URL format'),
});

const TrojanSchema = z.object({
  protocol: z.literal('trojan'),
  url: z
    .string()
    .regex(/^trojan:\/\//i, "Must start with 'trojan://'")
    .refine((url) => {
      try {
        new Trojan(url); // This will throw if parsing fails
        return true;
      } catch (error) {
        return false;
      }
    }, 'Invalid Trojan URL format'),
});

const Hysteria2Schema = z.object({
  protocol: z.literal('hysteria2'),
  url: z
    .string()
    .regex(/^hysteria2:\/\//i, "Must start with 'hysteria2://'")
    .refine((url) => {
      try {
        new Hysteria2(url); // This will throw if parsing fails
        return true;
      } catch (error) {
        return false;
      }
    }, 'Invalid Hysteria2 URL format'),
});

// Combined schema for all protocols
const ProtocolUrlSchema = z.discriminatedUnion('protocol', [
  VmessSchema,
  ShadowsocksSchema,
  TrojanSchema,
  Hysteria2Schema,
]);

/**
 * Validates a protocol URL using the appropriate Zod schema
 * @param url The URL to validate
 * @returns Validation result with protocol information or false
 */
const validateProtocolUrl = (url: string) => {
  try {
    // Check for valid protocol prefix
    const protocolMatch = /^(vmess|ss|trojan|hysteria2):\/\//i.exec(url);
    if (!protocolMatch) {
      return { valid: false, error: 'Unsupported protocol URL format' };
    }

    // Map the protocol to the expected format
    const protocolType = protocolMatch[1].toLowerCase();
    const protocolData = {
      protocol:
        protocolType === 'ss'
          ? 'ss'
          : (protocolType as 'vmess' | 'ss' | 'trojan' | 'hysteria2'),
      url,
    };

    // Validate with Zod schema
    const result = ProtocolUrlSchema.safeParse(protocolData);

    if (!result.success) {
      const errorMessages = result.error.errors
        .map((err) => err.message)
        .join(', ');
      return {
        valid: false,
        error: `Invalid URL format: ${errorMessages}`,
        errorDetail: result.error,
      };
    }

    // Return successful validation result with protocol info
    return {
      valid: true,
      protocol: protocolType,
      url,
    };
  } catch (err) {
    console.error('Protocol validation error:', err);
    return { valid: false, error: 'Unexpected error during validation' };
  }
};

interface ImportUrlScreenshotDialogProps {
  onImportUrl: (url: string) => void;
  forwardedRef?: RefObject<HTMLDivElement | null>;
}

export const ImportUrlScreenshotDialog = forwardRef<
  HTMLDivElement,
  ImportUrlScreenshotDialogProps
>(({ onImportUrl, forwardedRef }, ref) => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isClipboardLoading, setIsClipboardLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Forward the ref
  useImperativeHandle(
    ref,
    () => (forwardedRef?.current as HTMLDivElement) || null,
  );

  const handleCloseModal = () => {
    onClose();
    setQrData(null);
    setScreenshotData(null);
  };

  const processImage = (src: string) => {
    const img = new Image();

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrCode) {
        setQrData(qrCode.data);
        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clear the QR code area
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(
          qrCode.location.topLeftCorner.x,
          qrCode.location.topLeftCorner.y,
        );
        ctx.lineTo(
          qrCode.location.topRightCorner.x,
          qrCode.location.topRightCorner.y,
        );
        ctx.lineTo(
          qrCode.location.bottomRightCorner.x,
          qrCode.location.bottomRightCorner.y,
        );
        ctx.lineTo(
          qrCode.location.bottomLeftCorner.x,
          qrCode.location.bottomLeftCorner.y,
        );
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // Draw QR code border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 14;

        ctx.beginPath();
        ctx.moveTo(
          qrCode.location.topLeftCorner.x,
          qrCode.location.topLeftCorner.y,
        );
        ctx.lineTo(
          qrCode.location.topRightCorner.x,
          qrCode.location.topRightCorner.y,
        );
        ctx.lineTo(
          qrCode.location.bottomRightCorner.x,
          qrCode.location.bottomRightCorner.y,
        );
        ctx.lineTo(
          qrCode.location.bottomLeftCorner.x,
          qrCode.location.bottomLeftCorner.y,
        );
        ctx.closePath();
        ctx.stroke();

        // Draw corner markers
        const cornerSize = 20;
        const corners = [
          qrCode.location.topLeftCorner,
          qrCode.location.topRightCorner,
          qrCode.location.bottomRightCorner,
          qrCode.location.bottomLeftCorner,
        ];

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 86;

        corners.forEach((corner) => {
          ctx.beginPath();
          ctx.moveTo(corner.x - cornerSize, corner.y);
          ctx.lineTo(corner.x + cornerSize, corner.y);
          ctx.moveTo(corner.x, corner.y - cornerSize);
          ctx.lineTo(corner.x, corner.y + cornerSize);
          ctx.stroke();
        });
      } else {
        setQrData(null);
      }
    };
    setIsImageLoading(false);

    img.onerror = () => {
      setIsImageLoading(false);
      toast.error(t('Failed to load image'));
    };

    img.src = src;
  };

  const takeScreenshot = async () => {
    try {
      onOpen();
      setIsImageLoading(true);
      const screenshot = await invoke<string>('take_screenshot');

      // Navigate after taking the screenshot to ensure dialog is open first
      if (!location.search.includes('m=screenshot')) {
        navigate(`${location.pathname}?m=screenshot`);
      }

      setScreenshotData(screenshot);
      setQrData(null);
      processImage(screenshot);
    } catch (error) {
      console.error('Screenshot failed:', error);
      toast.error(t('Failed to take screenshot'));
      setIsImageLoading(false);
    }
  };

  const processQrCode = (qrData: string) => {
    return validateProtocolUrl(qrData);
  };

  // Function to handle QR code detection and import
  const handleQrCodeDetected = (qrCode: string) => {
    const processResult = processQrCode(qrCode);
    if (processResult && processResult.valid) {
      // First get the add endpoint dialog
      const addButton = document.querySelector(
        '[data-add-endpoint-button="true"]',
      );
      if (addButton) {
        (addButton as HTMLButtonElement).click();

        onImportUrl(qrCode);
        // Wait for dialog to open and then import URL
        setTimeout(() => {
          toast.success(t('QR code imported successfully'));
        }, 300);
        return true;
      }
    }
    return false;
  };

  return (
    <div ref={forwardedRef}>
      <Button
        isIconOnly
        onPress={takeScreenshot}
        data-import-screenshot-button="true"
      >
        <span className="i-feather-camera" />
      </Button>

      <Modal isOpen={isOpen} onClose={handleCloseModal} size="5xl">
        <ModalContent>
          <ModalHeader>{t('Screenshot')}</ModalHeader>
          <ModalBody>
            <div className="h-auto flex flex-col items-center justify-start">
              <Alert color={qrData ? 'success' : 'primary'} className="mb-4">
                {qrData
                  ? `QR Code detected: ${qrData}`
                  : isImageLoading
                    ? t('Taking screenshot...')
                    : t(
                        'Please make sure the QR code is visible in the screenshot for scanning.',
                      )}
              </Alert>
              <div className="h-[52vh] w-[74vh] relative">
                {isImageLoading ? (
                  <Skeleton className="rounded-xl">
                    <div className="h-[52vh] w-[74vh] rounded-xl bg-default-300"></div>
                  </Skeleton>
                ) : (
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleCloseModal}>
              {t('Close')}
            </Button>
            <Button
              color="primary"
              isDisabled={!qrData}
              onPress={() => {
                if (qrData) {
                  const processResult = processQrCode(qrData);
                  if (processResult && processResult.valid) {
                    handleQrCodeDetected(qrData);
                  } else if (processResult) {
                    // Display error in toast if not already shown
                    toast.error(t(processResult.error));
                  }
                  handleCloseModal();
                }
              }}
            >
              {t('Import')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
});

export default ImportUrlScreenshotDialog;
