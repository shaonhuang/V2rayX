import { useEffect, useState } from 'react';
import { LazyLog } from '@melloware/react-logviewer';
import {
  readTextFile,
  BaseDirectory,
  watchImmediate,
} from '@tauri-apps/plugin-fs';
import { queryLog } from '~/api';
import { json, useLoaderData } from '@remix-run/react';
import {
  Card,
  CardBody,
  CardHeader,
  Breadcrumbs,
  BreadcrumbItem,
  Spinner,
} from '@nextui-org/react';
import * as _ from 'lodash';
import { useTheme } from '@nextui-org/use-theme';
import { useTranslation } from 'react-i18next';

export const clientLoader = async () => {
  const log = await queryLog({ userID: localStorage.getItem('userID')! });
  return json({ log });
};

const Page = () => {
  const data = useLoaderData<typeof clientLoader>();
  const [type, setType] = useState('error');
  const [logContent, setLogContent] = useState('');
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const loadLog = async (type) => {
      try {
        const content = await readTextFile(
          type === 'access' ? 'access.log' : 'error.log',
          {
            baseDir: BaseDirectory.AppLog,
          },
        );
        setLogContent(content.split('\n').slice(-1000).join('\n'));
      } catch (error) {
        console.error('Failed to read log file:', error);
      }
    };

    // Initial load
    loadLog(type);

    // Debounced version to prevent rapid updates
    const debouncedLoadLog = _.debounce(loadLog, 300);

    // Set up file watcher
    const setupWatcher = async (type) => {
      try {
        const unwatch = await watchImmediate(
          (type === 'access' ? data.log.AccessPath : data.log.ErrorPath) ?? '',
          (event) => {
            if (event.type.modify.kind === 'data') {
              debouncedLoadLog(type);
            }
          },
        );

        return () => {
          unwatch();
          debouncedLoadLog.cancel();
        };
      } catch (error) {
        console.error('Failed to set up file watcher:', error);
      }
    };

    // Call setupWatcher and store the cleanup function
    const cleanupWatcher = setupWatcher(type);

    // Set up interval to reload log every 1 second
    const intervalId = setInterval(() => {
      debouncedLoadLog(type);
    }, 1000); // 1000 milliseconds = 1 second

    // Cleanup function to remove watcher and interval on unmount or dependency change
    return () => {
      if (cleanupWatcher instanceof Function) {
        cleanupWatcher();
      }
      clearInterval(intervalId);
      debouncedLoadLog.cancel();
    };
  }, [type]);

  return (
    <Card className="h-[80vh]">
      <CardHeader className="absolute top-1 z-10 flex w-1/2 flex-row !items-start justify-start gap-4 py-4">
        <p className="pl-4 text-large font-medium text-white">
          {t('Live Log Viewer')}
        </p>
        <Breadcrumbs
          variant="light"
          hideSeparator
          classNames={{
            list: 'gap-2',
          }}
          itemClasses={{
            item: [
              'px-2 py-0.5 border-small border-default-400 rounded-small text-white',
              'data-[current=true]:border-default-800 data-[current=true]:bg-foreground data-[current=true]:text-background transition-colors',
              'data-[disabled=true]:border-default-400 data-[disabled=true]:bg-default-100',
            ],
          }}
          onAction={(key) => setType(key)}
        >
          <BreadcrumbItem key="access" isCurrent={type === 'access'}>
            Access.log
          </BreadcrumbItem>
          <BreadcrumbItem key="error" isCurrent={type === 'error'}>
            Error.log
          </BreadcrumbItem>
        </Breadcrumbs>
      </CardHeader>
      <CardBody>
        <LazyLog
          text={logContent}
          caseInsensitive
          enableHotKeys
          enableSearch
          extraLines={1}
          height="auto"
          selectableLines
          lineClassName={theme === 'dark' ? 'text-white' : 'text-gray-300'}
          scrollToLine={1000}
          loadingComponent={<Spinner size="lg" />}
        />
      </CardBody>
    </Card>
  );
};

export default Page;
