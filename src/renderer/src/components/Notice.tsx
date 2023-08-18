import { useState, ComponentType, cloneElement } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Slide, { SlideProps } from '@mui/material/Slide';

type TransitionProps = Omit<SlideProps, 'direction'>;

function TransitionLeft(props: TransitionProps) {
  return <Slide {...props} direction="left" />;
}

function TransitionUp(props: TransitionProps) {
  return <Slide {...props} direction="up" />;
}

function TransitionRight(props: TransitionProps) {
  return <Slide {...props} direction="right" />;
}

function TransitionDown(props: TransitionProps) {
  return <Slide {...props} direction="down" />;
}

export default function DirectionSnackbar(props: any) {
  const [open, setOpen] = useState(false);
  const [transition, setTransition] = useState<ComponentType<TransitionProps> | undefined>(
    undefined
  );

  const handleClick = (Transition: ComponentType<TransitionProps>) => () => {
    setTransition(() => Transition);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChildClick = (childOnClick: () => void) => {
    return () => {
      try {
        childOnClick(); // Call the existing onClick event handler, if any
        switch (props.direction) {
          case 'up':
            handleClick(TransitionUp)();
            break;
          case 'down':
            handleClick(TransitionDown)();
            break;
          case 'left':
            handleClick(TransitionRight)();
            break;
          case 'right':
            handleClick(TransitionLeft)();
            break;
          default:
            handleClick(TransitionLeft)();
        }
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => {
        handleClose();
      }, 3000);
    };
  };

  return (
    <div>
      {cloneElement(props.children, {
        onClick: handleChildClick(props.children.props.onClick),
      })}
      <Snackbar
        open={open}
        onClose={handleClose}
        TransitionComponent={transition}
        message={props.message}
        key={transition ? transition.name : ''}
      ></Snackbar>
    </div>
  );
}
