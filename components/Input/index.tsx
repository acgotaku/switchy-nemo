import { forwardRef } from 'react';
import { IInputProps } from './Input.types';
import BaseInput from './Input';
import Password from './Password';

const Input = forwardRef<HTMLInputElement, IInputProps>((props, ref) => {
  const { type } = props;
  if (type === 'password') {
    return <Password {...props} ref={ref} />;
  } else {
    return <BaseInput {...props} ref={ref} />;
  }
});

export default Input;
