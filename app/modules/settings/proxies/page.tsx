import {
  Card,
  CardHeader,
  CardBody,
  Listbox,
  ListboxItem,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { queryLatencyTestSettings, updateLatencyTestSettings } from '~/api';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useLoaderData, json } from 'react-router';

// Define schema for validation
const LatencySettingsSchema = z.object({
  url: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .startsWith('http', { message: 'URL must start with http:// or https://' }),
  timeout: z
    .number()
    .int({ message: 'Timeout must be an integer value' })
    .min(500, { message: 'Timeout must be at least 500ms' })
    .max(10000, { message: 'Timeout must be at most 10000ms' }),
});

// Type for form data
type LatencySettings = z.infer<typeof LatencySettingsSchema>;

// Default settings if API call fails
const defaultLatencySettings: LatencySettings = {
  url: 'http://www.gstatic.com/generate_204',
  timeout: 3000,
};

export const loader = async () => {
  // If we have a user session, we can fetch their settings
  const settings = await queryLatencyTestSettings({
    userID: localStorage.getItem('userID')!,
  });
  return settings;
};

export const Page = () => {
  const { t } = useTranslation();
  const loaderData = useLoaderData<{ Proxies: LatencySettings }>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentSettings, setCurrentSettings] = useState<LatencySettings>(
    loaderData.Proxies,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Form setup with react-hook-form
  const {
    control,
    formState: { errors, isValid },
    reset,
    handleSubmit,
  } = useForm<LatencySettings>({
    mode: 'onChange', // Validate on change for real-time feedback
    resolver: zodResolver(LatencySettingsSchema),
    defaultValues: currentSettings,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset(currentSettings);
    }
  }, [isOpen, reset, currentSettings]);

  // Handle form submission
  const onSubmit: SubmitHandler<LatencySettings> = async (data) => {
    const userID = localStorage.getItem('userID')!;
    setIsLoading(true);
    try {
      await updateLatencyTestSettings({
        userID,
        url: data.url,
        timeout: data.timeout,
      });

      // Update current settings with new values
      setCurrentSettings(data);

      toast.success(t('Latency test settings updated successfully'));
      onClose();
    } catch (error) {
      console.error('Failed to update latency test settings:', error);
      toast.error(t('Failed to update latency test settings'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    reset(currentSettings);
    onClose();
  };

  return (
    <div>
      <Card className="py-4">
        <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
          <p className="text-tiny font-bold uppercase">{t('Proxies')}</p>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Listbox aria-label="Actions">
            <ListboxItem
              key="LatencyTestSettings"
              textValue="LatencyTestSettings"
              endContent={
                <Button color="primary" onPress={onOpen}>
                  <span className="i-feather-edit" /> {t('Edit')}
                </Button>
              }
            >
              <div className="flex flex-row items-center justify-between">
                <div>{t('Latency Test Settings')}</div>
                <div className="flex flex-row gap-2">
                  <Chip color="secondary">{currentSettings.url}</Chip>
                  <Chip color="secondary">{currentSettings.timeout}ms</Chip>
                </div>
              </div>
            </ListboxItem>
          </Listbox>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={handleModalClose}>
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>{t('Edit Latency Test Settings')}</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Controller
                  name="url"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label={t('Test URL')}
                      placeholder="http://www.gstatic.com/generate_204"
                      description={t('Must be a valid HTTP/HTTPS URL')}
                      isInvalid={!!errors.url}
                      errorMessage={errors.url?.message}
                    />
                  )}
                />
                <Controller
                  name="timeout"
                  control={control}
                  render={({ field: { onChange, value, ...rest } }) => (
                    <Input
                      {...rest}
                      type="number"
                      value={value.toString()}
                      onChange={(e) => onChange(Number(e.target.value))}
                      label={t('Timeout (ms)')}
                      placeholder="3000"
                      min="500"
                      max="10000"
                      description={t('Value between 500ms and 10000ms')}
                      isInvalid={!!errors.timeout}
                      errorMessage={errors.timeout?.message}
                    />
                  )}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="flat"
                onPress={handleModalClose}
                type="button"
              >
                {t('Cancel')}
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={isLoading}
                isDisabled={!isValid}
              >
                {t('Save')}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};
