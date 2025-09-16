import { useState, useMemo, forwardRef } from 'react';
import { Eye as ShowPassword, EyeOff as HidePassword } from '@/assets/icons';
import styles from './input.module.css';
import { IPasswordProps } from './Input.types';
import BaseInput from './Input';

const Password = forwardRef<HTMLInputElement, IPasswordProps>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const inputProps = useMemo(
    () => ({
      ...props,
      type: visible ? 'text' : 'password'
    }),
    [props, visible]
  );
  const suffixIcon = useMemo(() => {
    return (
      <button
        type="button"
        className={styles.button}
        disabled={props.disabled}
        onClick={() => setVisible(visible => !visible)}
      >
        {visible ? <HidePassword /> : <ShowPassword />}
      </button>
    );
  }, [visible, props]);

  return <BaseInput {...inputProps} ref={ref} suffix={suffixIcon} />;
});

Password.displayName = 'Password';

export default Password;
