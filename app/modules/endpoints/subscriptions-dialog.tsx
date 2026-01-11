import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  Input,
} from '@heroui/react';
import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  RefObject,
} from 'react';
import toast from 'react-hot-toast';
import { useRevalidator } from 'react-router';
import { useTranslation } from 'react-i18next';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { SVGProps } from 'react';
import {
  querySubscriptions,
  addSubscription,
  deleteSubscription,
  updateAllSubscriptions,
  parseSubscriptionAndCreateEndpoints,
  checkDuplicateSubscription,
} from '~/api';
import { v7 as uuid } from 'uuid';

// Define Subscription interface
interface Subscription {
  id: string;
  groupID: string;
  remark: string;
  url: string;
  status: string;
}

// Update the expected response from the API
interface SubscriptionResponse {
  Remark: string;
  Url: string;
  GroupID: string;
  SubscriptionID: string;
}

// Icon components
const DeleteIcon = () => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
    >
      <path
        d="M17.5 4.98332C14.725 4.70832 11.9333 4.56665 9.15 4.56665C7.5 4.56665 5.85 4.64998 4.2 4.81665L2.5 4.98332"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M7.08331 4.14169L7.26665 3.05002C7.39998 2.25835 7.49998 1.66669 8.90831 1.66669H11.0916C12.5 1.66669 12.6083 2.29169 12.7333 3.05835L12.9166 4.14169"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M15.7084 7.61664L15.1667 16.0083C15.075 17.3166 15 18.3333 12.675 18.3333H7.32502C5.00002 18.3333 4.92502 17.3166 4.83335 16.0083L4.29169 7.61664"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M8.60834 13.75H11.3833"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M7.91669 10.4167H12.0834"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
};

// Define columns for the table
const columns = [
  { name: 'REMARK', uid: 'remark' },
  { name: 'URL', uid: 'url' },
  { name: 'STATUS', uid: 'status' },
  { name: 'ACTIONS', uid: 'actions' },
];

// Status color mapping
const statusColorMap: Record<
  string,
  'success' | 'danger' | 'warning' | 'default'
> = {
  active: 'success',
  error: 'danger',
  pending: 'warning',
};

// Define interface for ref props
interface SubscriptionsDialogRefProps {
  forwardedRef?: RefObject<HTMLDivElement | null>;
}

// Use forwardRef to wrap the component
const SubscriptionsDialog = forwardRef<
  HTMLDivElement,
  SubscriptionsDialogRefProps
>(({ forwardedRef }, ref) => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { t } = useTranslation();
  const revalidator = useRevalidator();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [newRemark, setNewRemark] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Forward the ref
  useImperativeHandle(
    ref,
    () => (forwardedRef?.current as HTMLDivElement) || null,
  );

  // Fetch subscriptions when the dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchSubscriptions();
    }
  }, [isOpen]);

  // Listen for subscription updates
  useEffect(() => {
    const unlisten = listen<string>('refresh', (event) => {
      if (event.payload === 'subscriptions') {
        fetchSubscriptions();
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const userID = localStorage.getItem('userID');
      if (!userID) {
        toast.error(t('User ID not found'));
        return;
      }

      // Call backend to get subscriptions
      const result = await querySubscriptions({
        userID,
      });

      setSubscriptions(
        result.map((i: SubscriptionResponse) => {
          return {
            id: i.SubscriptionID,
            groupID: i.GroupID,
            remark: i.Remark,
            url: i.Url,
            status: 'active', // Default status for now
          };
        }),
      );
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      toast.error(t('Failed to fetch subscriptions'));
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      const userID = localStorage.getItem('userID');
      if (!userID) {
        toast.error(t('User ID not found'));
        return;
      }

      await deleteSubscription({ subscriptionID: id });
      toast.success(t('Subscription deleted successfully'));
      fetchSubscriptions();
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      toast.error(t('Failed to delete subscription'));
    }
  };

  const handleAddSubscription = async () => {
    if (!newRemark.trim()) {
      toast.error(t('Remark is required'));
      return;
    }

    if (!newUrl.trim()) {
      toast.error(t('URL is required'));
      return;
    }

    try {
      const userID = localStorage.getItem('userID');
      if (!userID) {
        toast.error(t('User ID not found'));
        return;
      }

      // Check for duplicate subscription before adding
      const isDuplicate = await checkDuplicateSubscription({
        userID,
        url: newUrl.trim(),
      });

      if (isDuplicate) {
        toast.error(t('Subscription with this URL already exists'));
        return;
      }

      // Create a GroupID for the new subscription
      const groupID = uuid();

      // Add the subscription to the database
      await addSubscription({
        userID,
        remark: newRemark.trim(),
        url: newUrl.trim(),
        groupID: groupID,
      });

      toast.success(t('Subscription added successfully'));
      setNewRemark('');
      setNewUrl('');
      setAddModalOpen(false);
      fetchSubscriptions(); // Refresh the list
    } catch (error) {
      console.error('Failed to add subscription:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        toast.error(t('Subscription with this URL already exists'));
      } else {
        toast.error(t('Failed to add subscription'));
      }
    }
  };

  const updateSubscriptions = async () => {
    try {
      const userID = localStorage.getItem('userID');
      if (!userID) {
        toast.error(t('User ID not found'));
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading(t('Updating subscriptions...'));

      // Get all subscriptions
      const allSubscriptions = await querySubscriptions({ userID });

      if (allSubscriptions.length === 0) {
        toast.dismiss(loadingToast);
        toast.error(t('No subscriptions found'));
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each subscription
      for (const subscription of allSubscriptions) {
        try {
          console.log(
            `Fetching subscription: ${subscription.Remark} (${subscription.Url})`,
          );

          if (!subscription.Url || !subscription.Url.trim()) {
            console.error(`Empty URL for subscription: ${subscription.Remark}`);
            errorCount++;
            continue;
          }

          // Update toast message to show progress
          toast.loading(
            t('Updating {{current}} of {{total}}: {{name}}', {
              current: successCount + errorCount + 1,
              total: allSubscriptions.length,
              name: subscription.Remark,
            }),
            { id: loadingToast },
          );

          // Fetch and decode subscription data
          const subscriptionData = await invoke<string>(
            'fetch_subscription_data',
            {
              url: subscription.Url,
            },
          );

          // Log the decoded data for debugging
          console.log(
            `Decoded subscription data for ${subscription.Remark}:`,
            subscriptionData,
          );

          // Parse the subscription data and create endpoints
          const result = await parseSubscriptionAndCreateEndpoints({
            userID,
            subscriptionID: subscription.SubscriptionID,
            groupID: subscription.GroupID,
            remark: subscription.Remark,
            link: subscription.Url,
            subscriptionData,
          });

          console.log(
            `Parsed ${result.success} endpoints, ${result.failed} failed for ${subscription.Remark}`,
          );

          successCount += result.success;
          errorCount += result.failed;
        } catch (error) {
          errorCount++;
          console.error(
            `Error processing subscription ${subscription.Remark}:`,
            error,
          );
        }
      }

      // Call the API to update all subscriptions (this currently just updates timestamps)
      await updateAllSubscriptions({ userID });

      // Dismiss the loading toast and show summary
      toast.dismiss(loadingToast);

      if (errorCount === 0) {
        toast.success(
          t('All {{count}} subscriptions updated successfully', {
            count: successCount,
          }),
        );
      } else if (successCount === 0) {
        toast.error(t('Failed to update any subscriptions'));
      } else {
        toast.success(
          t('Updated {{success}} subscriptions, {{error}} failed', {
            success: successCount,
            error: errorCount,
          }),
        );
      }

      revalidator.revalidate();
      fetchSubscriptions(); // Refresh the list after update
    } catch (error) {
      console.error('Failed to update subscriptions:', error);
      toast.error(
        t('Failed to update subscriptions: {{error}}', {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  };

  const renderCell = (subscription: Subscription, columnKey: React.Key) => {
    const cellValue = subscription[columnKey as keyof Subscription];

    switch (columnKey) {
      case 'remark':
        return <div className="text-bold text-sm">{cellValue}</div>;
      case 'url':
        return (
          <div className="max-w-xs overflow-hidden text-ellipsis">
            <Tooltip content={cellValue as string}>
              <span>{cellValue as string}</span>
            </Tooltip>
          </div>
        );
      case 'status':
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[subscription.status] || 'default'}
            size="sm"
            variant="flat"
          >
            {cellValue}
          </Chip>
        );
      case 'actions':
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip color="danger" content={t('Delete subscription')}>
              <span
                className="text-lg text-danger cursor-pointer active:opacity-50"
                onClick={() => handleDeleteSubscription(subscription.id)}
              >
                <DeleteIcon />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  };

  return (
    <div ref={forwardedRef}>
      <Button isIconOnly onPress={onOpen} data-subscriptions-button="true">
        <span className="i-feather-list" />
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        backdrop="blur"
      >
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t('Subscriptions')}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-row justify-between mb-4">
                  <Button color="primary" onPress={() => setAddModalOpen(true)}>
                    <span className="i-feather-plus mr-1" />
                    {t('Add Subscription')}
                  </Button>
                  <Button color="secondary" onPress={updateSubscriptions}>
                    <span className="i-feather-refresh-cw mr-1" />
                    {t('Update All')}
                  </Button>
                </div>

                <Table aria-label="Subscriptions table">
                  <TableHeader columns={columns}>
                    {(column) => (
                      <TableColumn
                        key={column.uid}
                        align={column.uid === 'actions' ? 'center' : 'start'}
                      >
                        {column.name}
                      </TableColumn>
                    )}
                  </TableHeader>
                  <TableBody
                    items={subscriptions}
                    emptyContent={t('No subscriptions found')}
                  >
                    {(item) => (
                      <TableRow key={item.id}>
                        {(columnKey) => (
                          <TableCell>{renderCell(item, columnKey)}</TableCell>
                        )}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="flat" onPress={onCloseModal}>
                  {t('Close')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add Subscription Modal */}
      <Modal
        isOpen={addModalOpen}
        onOpenChange={(open) => setAddModalOpen(open)}
        size="lg"
        backdrop="blur"
      >
        <ModalContent>
          {(onCloseAddModal) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t('Add Subscription')}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Input
                    label={t('Remark')}
                    placeholder={t('Enter a name for this subscription')}
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                  />
                  <Input
                    label={t('URL')}
                    placeholder={t('Enter subscription URL')}
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onCloseAddModal}>
                  {t('Cancel')}
                </Button>
                <Button color="primary" onPress={handleAddSubscription}>
                  {t('Add')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
});

export default SubscriptionsDialog;
