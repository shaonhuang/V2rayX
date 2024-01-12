import {
  Button,
  Container,
  Card,
  CardContent,
  CardMedia,
  Typography,
  CardActions,
} from '@mui/material';
import QRCode from 'qrcode';
import { useState, useEffect } from 'react';

const Index = () => {
  const [link, setLink] = useState<string>(localStorage.getItem('share-qrcode-link') || '');
  const [qrcode, setQRCode] = useState<string>('');

  const generateQR = async (text: string) => {
    try {
      setQRCode(await QRCode.toDataURL(text));
    } catch (err) {
      console.error(err);
    }
  };
  const qrcodeImge2Buffer = async () => {
    window.clipboard.writeImage(await QRCode.toDataURL(link));
  };

  useEffect(() => {
    generateQR(link);
  }, []);

  return (
    <Container sx={{ px: 8, py: 4, overflowY: 'scroll' }} className="overflow-y-hidden">
      <Card>
        <CardMedia image={qrcode} component="img" title="QR Code" alt="QR Code" />
        <CardContent>
          <Typography gutterBottom variant="subtitle1" component="div">
            Vmess Link
          </Typography>
          <Typography variant="body2" sx={{ wordWrap: 'break-word' }} color="text.secondary">
            {link}
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-around' }}>
          <Button
            size="small"
            onClick={() => {
              window.clipboard.paste(link);
            }}
          >
            Copy Link
          </Button>
          <Button
            size="small"
            onClick={() => {
              qrcodeImge2Buffer();
            }}
          >
            Copy Image to ClipBoard
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default Index;
