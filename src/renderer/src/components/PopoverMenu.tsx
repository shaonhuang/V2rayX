import { useState, cloneElement } from 'react';
import { IconButton, Popover } from '@mui/material';

const PopoverMenu = (props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <IconButton
        color="secondary"
        className="mr justify-self-end"
        style={{ marginRight: '1.2rem' }}
        aria-describedby={id}
        onClick={handleClick}
      >
        {props.children[0]}
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        {cloneElement(props.children[1], { onClick: handleClose })}
      </Popover>
    </div>
  );
};

export default PopoverMenu;
