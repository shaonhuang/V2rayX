import { Popover, PopoverTrigger, PopoverContent, Button } from '@heroui/react';
import * as Share from '../endpoint-share/page';
import { useState } from 'react';
import { useNavigate } from '@remix-run/react';

export function ShareButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Popover
      placement="top"
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <PopoverTrigger>
        <Button onPress={() => setIsOpen(true)} isDisabled>
          <span className="i-feather-share-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        {(titleProps) => (
          <div className="flex flex-col gap-2 px-1 py-2">
            <Share.DialogButton
              onClick={() => {
                setIsOpen(false);
              }}
            />
            <Button
              onPress={() => {
                setIsOpen(false);
              }}
            >
              <div className="flex flex-row items-center justify-start gap-2">
                <span className="i-feather-link" />
                <p>Share Link</p>
              </div>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
