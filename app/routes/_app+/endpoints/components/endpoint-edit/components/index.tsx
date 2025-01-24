import {
  Card,
  CardBody,
  Button,
  Select,
  SelectItem,
  Input,
} from '@heroui/react';
import toast from 'react-hot-toast';
import {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from 'react';
import { addEndpointToLocalsBaseInfo } from '~/api';
import { Shadowsocks, VMess, Trojan, Hysteria2 } from './protocols';
import {
  Tcp,
  Kcp,
  H2,
  Quic,
  Ws,
  Grpc,
  Hysteria2 as Hysteria2Stream,
} from './stream';
import { SecurityTls } from './security';

import {
  VMess as VMessData,
  Trojan as TrojanData,
  Shadowsocks as ShadowsocksData,
  Hysteria2 as Hysteria2Data,
} from '~/lib/protocol';
import { v7 as uuid } from 'uuid';
import { t } from 'i18next';

const protocolsTypes = ['shadowsocks', 'vmess', 'trojan', 'hysteria2'].map(
  (protocol) => ({
    key: protocol,
    label: protocol.toUpperCase(),
  }),
);

const networks = ['h2', 'kcp', 'quic', 'tcp', 'ws', 'grpc', 'hysteria2'].map(
  (network) => ({
    key: network,
    label: network.toUpperCase(),
  }),
);

const securityTypes = ['none', 'tls'].map((security) => ({
  key: security,
  label: security,
}));

// touch sub component update data from parent component
const useEffectOnNextRender = (callback: React.EffectCallback) => {
  const [scheduled, setScheduled] = useState(false);

  useEffect(() => {
    if (!scheduled) {
      return;
    }
    setScheduled(false);
    callback();
  }, [scheduled]);

  return () => setScheduled(true);
};

interface PageProps {
  type: 'add' | 'edit';
  endpoint: any;
  onValidSubmit: (endpointID: string) => void;
  onInvalidSubmit: (errors: any) => void;
}

export interface PageRef {
  submitForm: () => void;
  // setFormValue: UseFormSetValue<ShadowsocksSchema>;
}

const PageComponent: ForwardRefRenderFunction<PageRef, PageProps> = (
  props,
  ref,
) => {
  const { type, endpoint } = props;
  let link = '';
  const [endpointID] = useState(type === 'add' ? uuid() : endpoint.endpointID);
  const userID = localStorage.getItem('userID')!;
  const [protocols, setProcotols] = useState({
    protocol: type === 'add' ? 'vmess' : endpoint.protocol.type,
    stream: type === 'add' ? 'tcp' : endpoint.network.type,
    security: type === 'add' ? 'none' : endpoint.security.type,
  });
  const [url, setUrl] = useState('');
  // 'vmess://eyAidiI6IjIiLCAicHMiOiIiLCAiYWRkIjoiNDUuNzcuNzEuMjAzIiwgInBvcnQiOiI0NDMiLCAiaWQiOiI5YmIwNTAyZS1mYjI2LTQyNWEtODZkNC05YmJhNDQxNjdlNTkiLCAiYWlkIjoiMCIsICJuZXQiOiJ3cyIsICJ0eXBlIjoibm9uZSIsICJob3N0IjoiaGloYWNrZXIuc2hvcCIsICJwYXRoIjoiL1FZQXA3VXpjIiwgInRscyI6InRscyIgfQ==',
  // 'ss://YWVzLTI1Ni1nY206ZG9uZ3RhaXdhbmcuY29t@46.17.40.57:11111#www.dongtaiwang.com%E6%B4%9B%E6%9D%89%E7%9F%B6',
  // 'trojan://pass@remote_host:443?flow=xtls-rprx-origin&security=xtls&sni=sni&host=remote_host#trojan',

  const protocolRef = useRef(null);
  const streamRef = useRef(null);
  const securityRef = useRef(null);
  const scheduleDisplay = useEffectOnNextRender(() => {
    display();
  });
  const [protocolFactory, setProtocolFactory] = useState<any>(
    new VMessData(''),
  );

  useEffect(() => {
    protocolRef.current?.setFormValue('endpointID', endpointID);
    streamRef.current?.setFormValue('endpointID', endpointID);
    securityRef.current?.setFormValue('endpointID', endpointID);
    type === 'edit' && display();
  }, [protocols.protocol, protocols.stream, protocols.security]);

  const onError = (errors: any) => {
    props.onInvalidSubmit(errors);
  };

  // Define a type for form values
  type FormValues = Record<string, any>;

  // Generic function to set form values dynamically
  const setFormValues = (
    pageRef: { setFormValue: (field: string, value: any) => void } | null | any,
    endpointID: string,
    formValues: FormValues,
  ) => {
    if (!pageRef) {
      console.error('Page reference is null');
      return;
    }

    try {
      // Set endpointID
      pageRef.setFormValue('endpointID', endpointID);

      // Set other form values
      Object.entries(formValues).forEach(([field, value]) => {
        pageRef.setFormValue(field, value);
      });
    } catch (error) {
      console.error('Error setting form values:', error);
    }
  };
  // Protocol-Specific Handler Functions

  // 1. Handle Shadowsocks
  const handleShadowsocks = ({
    address,
    port,
    password,
    encryptionAlgorithm,
  }: {
    address: string;
    port: number;
    password: string;
    encryptionAlgorithm: string;
  }) => {
    const shadowsocksPageRef =
      protocolRef.current as Shadowsocks.PageRef | null;
    if (!shadowsocksPageRef) {
      console.warn('Shadowsocks PageRef is null');
      return;
    }

    const formValues = {
      address,
      port,
      password,
      encryptionAlgorithm,
    };

    setFormValues(shadowsocksPageRef, endpointID, formValues);
  };

  // 2. Handle VMess
  const handleVMess = ({
    ip,
    port,
    uuid,
    alterID,
    level,
    encryptionAlgorithm,
  }: {
    ip: string;
    port: number;
    uuid: string;
    alterID: number;
    level: number;
    encryptionAlgorithm: string;
  }) => {
    const vmessPageRef = protocolRef.current as VMess.PageRef | null;
    if (!vmessPageRef) {
      console.warn('VMess PageRef is null');
      return;
    }

    const formValues = {
      ip,
      port,
      uuid,
      alterID,
      level,
      encryptionAlgorithm,
    };

    setFormValues(vmessPageRef, endpointID, formValues);
  };

  // 3. Handle Trojan
  const handleTrojan = ({
    ip,
    port,
    password,
  }: {
    ip: string;
    port: number;
    password: string;
  }) => {
    const trojanPageRef = protocolRef.current as Trojan.PageRef | null;
    if (!trojanPageRef) {
      console.warn('Trojan PageRef is null');
      return;
    }

    const formValues = {
      ip,
      port,
      password,
    };

    setFormValues(trojanPageRef, endpointID, formValues);
  };

  // 4. Handle Hysteria2
  const handleHysteria2 = ({
    address,
    port,
  }: {
    address: string;
    port: number;
  }) => {
    const hysteria2PageRef = protocolRef.current as Hysteria2.PageRef | null;
    if (!hysteria2PageRef) {
      console.warn('Hysteria2 PageRef is null');
      return;
    }

    const formValues = {
      address,
      port,
    };

    setFormValues(hysteria2PageRef, endpointID, formValues);
  };

  // 5. Handle HTTP/2 (H2)
  const handleH2 = ({ path, host }: { path: string; host: string }) => {
    const h2PageRef = protocolRef.current as H2.PageRef | null;
    if (!h2PageRef) {
      console.warn('H2 PageRef is null');
      return;
    }

    const formValues = {
      path,
      host,
    };

    setFormValues(h2PageRef, endpointID, formValues);
  };

  // 6. Handle KCP
  const handleKcp = ({
    header,
    mtu,
    tti,
    uplinkCapacity,
    downlinkCapacity,
    congestion,
    readBufferSize,
    writeBufferSize,
  }: {
    header: string;
    mtu: number;
    tti: number;
    uplinkCapacity: number;
    downlinkCapacity: number;
    congestion: number;
    readBufferSize: number;
    writeBufferSize: number;
  }) => {
    const kcpPageRef = streamRef.current as Kcp.PageRef | null;
    if (!kcpPageRef) {
      console.warn('KCP PageRef is null');
      return;
    }

    const formValues = {
      header,
      mtu,
      tti,
      uplinkCapacity,
      downlinkCapacity,
      congestion,
      readBufferSize,
      writeBufferSize,
    };

    setFormValues(kcpPageRef, endpointID, formValues);
  };

  // 7. Handle QUIC
  const handleQuic = ({
    security,
    key,
    header,
  }: {
    security: string;
    key: string;
    header: string;
  }) => {
    const quicPageRef = streamRef.current as Quic.PageRef | null;
    if (!quicPageRef) {
      console.warn('QUIC PageRef is null');
      return;
    }

    const formValues = {
      security,
      key,
      header,
    };

    setFormValues(quicPageRef, endpointID, formValues);
  };

  // 8. Handle TCP
  const handleTcp = ({
    type,
    requestHost = null,
    requestPath = null,
  }: {
    type: string;
    requestHost?: string | null;
    requestPath?: string | null;
  }) => {
    const tcpPageRef = streamRef.current as Tcp.PageRef | null;
    if (!tcpPageRef) {
      console.warn('TCP PageRef is null');
      return;
    }

    const formValues = {
      type,
      requestHost,
      requestPath,
    };

    setFormValues(tcpPageRef, endpointID, formValues);
  };

  // 9. Handle WebSocket (Ws)
  const handleWs = ({ path, host }: { path: string; host: string }) => {
    const wsPageRef = streamRef.current as Ws.PageRef | null;
    if (!wsPageRef) {
      console.warn('WebSocket PageRef is null');
      return;
    }

    const formValues = {
      path,
      host,
    };

    setFormValues(wsPageRef, endpointID, formValues);
  };

  // 10. Handle gRPC
  const handleGrpc = ({ serviceName }: { serviceName: string }) => {
    const grpcPageRef = streamRef.current as Grpc.PageRef | null;
    if (!grpcPageRef) {
      console.warn('gRPC PageRef is null');
      return;
    }

    const formValues = {
      serviceName,
    };

    setFormValues(grpcPageRef, endpointID, formValues);
  };

  // 11. Handle Hysteria2 Stream
  const handleHysteria2Stream = ({
    password,
    type,
    uploadSpeed,
    downloadSpeed,
    enableUDP,
  }: {
    password: string;
    type: string;
    uploadSpeed: number;
    downloadSpeed: number;
    enableUDP: number;
  }) => {
    const hysteria2StreamRef =
      streamRef.current as Hysteria2Stream.PageRef | null;
    if (!hysteria2StreamRef) {
      console.warn('Hysteria2 Stream PageRef is null');
      return;
    }

    const formValues = {
      password,
      type,
      uploadSpeed,
      downloadSpeed,
      enableUDP,
    };

    setFormValues(hysteria2StreamRef, endpointID, formValues);
  };

  // 12. Handle TLS Security
  const handleTls = ({
    serverName,
    allowInsecure,
  }: {
    serverName: string;
    allowInsecure: boolean;
  }) => {
    const securityTlsRef = securityRef.current as SecurityTls.PageRef | null;
    if (!securityTlsRef) {
      console.warn('TLS Security PageRef is null');
      return;
    }

    const formValues = {
      serverName,
      allowInsecure,
    };

    setFormValues(securityTlsRef, endpointID, formValues);
  };

  const handleImportUrl = () => {
    let protocol = 'vmess';
    // solve setState async problem caused empty protocolFactory
    let protocolFactory: any = new VMessData('');
    try {
      switch (true) {
        case /^vmess:\/\//i.test(url):
          setProtocolFactory(new VMessData(url));
          protocolFactory = new VMessData(url);
          protocol = 'vmess';
          break;
        case /^ss:\/\//i.test(url):
          setProtocolFactory(new ShadowsocksData(url));
          protocolFactory = new ShadowsocksData(url);
          protocol = 'shadowsocks';
          break;
        case /^trojan:\/\//i.test(url):
          setProtocolFactory(new TrojanData(url));
          protocolFactory = new TrojanData(url);
          protocol = 'trojan';
          break;
        case /^hysteria2:\/\//i.test(url):
          setProtocolFactory(new Hysteria2Data(url));
          protocolFactory = new Hysteria2Data(url);
          protocol = 'hysteria2';
          break;
      }
      // get right protocols value
      setProcotols({
        protocol,
        stream: protocolFactory.getOutbound().streamSettings?.network || 'tcp',
        security:
          protocolFactory.getOutbound().streamSettings?.security || 'none',
      });

      scheduleDisplay();
      link = protocolFactory.getLink();
      toast.success(t('URL imported'));
    } catch (error) {
      console.error(error);
      toast.error(
        'Invalid URL or parsing error. Please report link format to developer.',
      );
    }
  };

  const display = () => {
    switch (protocols.protocol) {
      case 'vmess':
        handleVMess(
          type === 'add'
            ? {
                ip: protocolFactory.getOutbound().settings.vnext[0].address,
                port: protocolFactory.getOutbound().settings.vnext[0].port,
                uuid: protocolFactory.getOutbound().settings.vnext[0].users[0]
                  .id,
                alterID:
                  protocolFactory.getOutbound().settings.vnext[0].users[0]
                    .alterId,
                level:
                  protocolFactory.getOutbound().settings.vnext[0].users[0]
                    .level,
                encryptionAlgorithm:
                  protocolFactory.getOutbound().settings.vnext[0].users[0]
                    .security,
              }
            : {
                ip: endpoint.protocol.Address,
                port: endpoint.protocol.Port,
                uuid: endpoint.protocol.UUID,
                alterID: endpoint.protocol.AlterID,
                level: endpoint.protocol.Level,
                encryptionAlgorithm: endpoint.protocol.Security,
              },
        );
        break;
      case 'shadowsocks':
        handleShadowsocks(
          type === 'add'
            ? {
                address:
                  protocolFactory.getOutbound().settings.servers[0].address,
                port: protocolFactory.getOutbound().settings.servers[0].port,
                password:
                  protocolFactory.getOutbound().settings.servers[0].password,
                encryptionAlgorithm:
                  protocolFactory.getOutbound().settings.servers[0].method,
              }
            : {
                address: endpoint.protocol.Address,
                port: endpoint.protocol.Port,
                password: endpoint.protocol.Password,
                encryptionAlgorithm: endpoint.protocol.Method,
              },
        );
        break;
      case 'trojan':
        handleTrojan(
          type === 'add'
            ? {
                ip: protocolFactory.getOutbound().settings.servers[0].address,
                port: protocolFactory.getOutbound().settings.servers[0].port,
                password:
                  protocolFactory.getOutbound().settings.servers[0].password,
              }
            : {
                ip: endpoint.protocol.Address,
                port: endpoint.protocol.Port,
                password: endpoint.protocol.Password,
              },
        );
        break;
      case 'hysteria2':
        handleHysteria2(
          type === 'add'
            ? {
                address:
                  protocolFactory.getOutbound().settings.servers[0].address,
                port: protocolFactory.getOutbound().settings.servers[0].port,
              }
            : {
                address: endpoint.protocol.Address,
                port: endpoint.protocol.Port,
              },
        );
        break;
      default:
        break;
    }
    switch (protocols.stream) {
      case 'tcp':
        handleTcp(
          type === 'add'
            ? {
                type: protocolFactory.getOutbound().streamSettings.tcpSettings
                  .header.type,
                requestHost:
                  protocolFactory.getOutbound().streamSettings.tcpSettings
                    .header.type === 'http'
                    ? protocolFactory.getOutbound().streamSettings.tcpSettings
                        .header.request.headers.Host[0]
                    : null,
                requestPath:
                  protocolFactory.getOutbound().streamSettings.tcpSettings
                    .header.type === 'http'
                    ? protocolFactory.getOutbound().streamSettings.tcpSettings
                        .header.request.path[0]
                    : null,
              }
            : {
                type: endpoint.network.HeaderType,
                requestHost: endpoint.network.RequestHost,
                requestPath: endpoint.network.RequestPath,
              },
        );
        break;
      case 'ws':
        handleWs(
          type === 'add'
            ? {
                path: protocolFactory.getOutbound().streamSettings.wsSettings
                  .path,
                host: protocolFactory.getOutbound().streamSettings.wsSettings
                  .headers.host,
              }
            : {
                path: endpoint.network.Path,
                host: endpoint.network.Host,
              },
        );
        break;
      case 'grpc':
        handleGrpc(
          type === 'add'
            ? {
                serviceName:
                  protocolFactory.getOutbound().streamSettings.grpcSettings
                    .serviceName,
              }
            : {
                serviceName: endpoint.network.ServiceName,
              },
        );
        break;
      case 'h2':
        handleH2(
          type === 'add'
            ? {
                path: protocolFactory.getOutbound().streamSettings.httpSettings
                  .path,
                host: protocolFactory.getOutbound().streamSettings.httpSettings
                  .host[0],
              }
            : {
                path: endpoint.network.Path,
                host: endpoint.network.Host,
              },
        );
        break;
      case 'kcp':
        handleKcp(
          type === 'add'
            ? {
                header:
                  protocolFactory.getOutbound().streamSettings.kcpSettings
                    .header.type,
                mtu: protocolFactory.getOutbound().streamSettings.kcpSettings
                  .mtu,
                tti: protocolFactory.getOutbound().streamSettings.kcpSettings
                  .tti,
                uplinkCapacity:
                  protocolFactory.getOutbound().streamSettings.kcpSettings
                    .uplinkCapacity,
                downlinkCapacity:
                  protocolFactory.getOutbound().streamSettings.kcpSettings
                    .downlinkCapacity,
                congestion:
                  protocolFactory.getOutbound().streamSettings.kcpSettings
                    .congestion,
                readBufferSize:
                  protocolFactory.getOutbound().streamSettings.kcpSettings
                    .readBufferSize,
                writeBufferSize:
                  protocolFactory.getOutbound().streamSettings.kcpSettings
                    .writeBufferSize,
              }
            : {
                header: endpoint.network.HeaderType,
                mtu: endpoint.network.MTU,
                tti: endpoint.network.TTI,
                uplinkCapacity: endpoint.network.UplinkCapacity,
                downlinkCapacity: endpoint.network.DownlinkCapacity,
                congestion: endpoint.network.Congestion,
                readBufferSize: endpoint.network.ReadBufferSize,
                writeBufferSize: endpoint.network.WriteBufferSize,
              },
        );
        break;
      case 'quic':
        handleQuic(
          type === 'add'
            ? {
                security:
                  protocolFactory.getOutbound().streamSettings.quicSettings
                    .security,
                key: protocolFactory.getOutbound().streamSettings.quicSettings
                  .key,
                header:
                  protocolFactory.getOutbound().streamSettings.quicSettings
                    .header.type,
              }
            : {
                security: endpoint.network.Security,
                key: endpoint.network.Key,
                header: endpoint.network.Header,
              },
        );
        break;
      case 'hysteria2':
        handleHysteria2Stream(
          type === 'add'
            ? {
                password:
                  protocolFactory.getOutbound().streamSettings.hysteria2Settings
                    .password,
                type: protocolFactory.getOutbound().streamSettings
                  .hysteria2Settings.type,
                uploadSpeed:
                  protocolFactory.getOutbound().streamSettings.hysteria2Settings
                    .uploadSpeed,
                downloadSpeed:
                  protocolFactory.getOutbound().streamSettings.hysteria2Settings
                    .downloadSpeed,
                enableUDP: protocolFactory.getOutbound().streamSettings
                  .hysteria2Settings.enableUDP
                  ? 1
                  : 0,
              }
            : {
                password: endpoint.network.Password,
                type: endpoint.network.Type,
                uploadSpeed: endpoint.network.UploadSpeed,
                downloadSpeed: endpoint.network.DownloadSpeed,
                enableUDP: endpoint.network.EnableUDP,
              },
        );
        break;
      default:
        break;
    }
    switch (protocols.security) {
      case 'tls':
        handleTls(
          type === 'add'
            ? {
                serverName:
                  protocolFactory.getOutbound().streamSettings.tlsSettings
                    .serverName,
                allowInsecure: protocolFactory.getOutbound().streamSettings
                  .tlsSettings.allowInsecure
                  ? true
                  : false,
              }
            : {
                serverName: endpoint.security.ServerName,
                allowInsecure: endpoint.security.AllowInsecure ? true : false,
              },
        );
        break;
      default:
        setProcotols({
          ...protocols,
          security: 'none',
        });
        break;
    }
  };

  const handleValidSubmit = (data: any) => {
    console.log('Form is valid:', data);
    // Proceed with your logic
  };

  const handleInvalidSubmit = (errors: any) => {
    console.log('Form is invalid:', errors);
    // Handle form errors
  };

  const triggerSubmit = () => {
    protocolRef.current?.submitForm();
    streamRef.current?.submitForm();
    securityRef.current?.submitForm();
  };

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      // handleSubmit(onSubmit, onError)();
      if (props.type === 'add') {
        await addEndpointToLocalsBaseInfo({
          userID,
          endpointID,
          protocol: protocols.protocol,
          stream: protocols.stream,
          security: protocols.security,
          remark: protocolFactory.getPs(),
          link,
        });
      }
      triggerSubmit();
      props.onValidSubmit(endpointID);
    },
    // setFormValue: setValue,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Card className={type === 'edit' ? 'hidden' : ''}>
        <CardBody>
          <div className="flex flex-row items-end gap-2">
            <Input
              variant="underlined"
              label="Link"
              isClearable
              value={url}
              onValueChange={setUrl}
            ></Input>
            <Button
              onPress={() => {
                handleImportUrl();
              }}
            >
              <span className="i-mdi-application-import" />
            </Button>
          </div>
        </CardBody>
      </Card>
      <Select
        label="Select a protocol"
        className="w-72 max-w-xs"
        selectionMode="single"
        selectedKeys={[protocols.protocol]}
        required
        onChange={(e) => {
          e.target.value &&
            setProcotols({ ...protocols, protocol: e.target.value });
        }}
      >
        {protocolsTypes.map((protocol) => (
          <SelectItem key={protocol.key}>{protocol.label}</SelectItem>
        ))}
      </Select>
      {
        [
          <Shadowsocks.Page
            ref={protocolRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
          <VMess.Page
            ref={protocolRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
          <Trojan.Page
            ref={protocolRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
          <Hysteria2.Page
            ref={protocolRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
        ][protocolsTypes.findIndex((v) => protocols.protocol === v.key)]
      }
      <Select
        label="Stream Type"
        className="max-w-xs"
        selectionMode="single"
        required
        defaultSelectedKeys={['tcp']}
        selectedKeys={[protocols.stream]}
        onChange={(e) => {
          e.target.value &&
            setProcotols({ ...protocols, stream: e.target.value });
        }}
      >
        {networks.map((network) => (
          <SelectItem key={network.key}>{network.label}</SelectItem>
        ))}
      </Select>
      {
        [
          <H2.Page
            ref={streamRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
          <Kcp.Page
            ref={streamRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
          <Quic.Page
            ref={streamRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
          <Tcp.Page
            ref={streamRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
          <Ws.Page
            ref={streamRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
          <Grpc.Page
            ref={streamRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
          <Hysteria2Stream.Page
            ref={streamRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
        ][networks.findIndex((v) => protocols.stream === v.key)]
      }

      <Select
        label="Security"
        className="max-w-xs"
        selectionMode="single"
        defaultSelectedKeys={['none']}
        selectedKeys={[protocols.security]}
        required
        onChange={(e) => {
          e.target.value &&
            setProcotols({ ...protocols, security: e.target.value });
        }}
      >
        {securityTypes.map((security) => (
          <SelectItem key={security.key}>{security.label}</SelectItem>
        ))}
      </Select>
      {
        [
          <></>,
          <SecurityTls.Page
            ref={securityRef}
            type={type}
            onValidSubmit={handleValidSubmit}
            onInvalidSubmit={handleInvalidSubmit}
          />,
        ][securityTypes.findIndex((v) => protocols.security === v.key)]
      }
    </div>
  );
};

export const Page = forwardRef<PageRef, PageProps>(PageComponent);
