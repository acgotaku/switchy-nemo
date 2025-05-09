import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import cls from 'clsx';
import { useDidUpdate } from '@/hooks/useDidUpdate';
import { noop } from '@/utils/misc';
import styles from './form.module.css';
import { FormContext } from './context';
import { IFormProps, IFormItemRef } from './Form.types';

const Form: React.FC<IFormProps> = ({
  children,
  values = {},
  onValuesChange = noop,
  onValidateChange,
  rules,
  className = '',
  disabled = false,
  showRequired = true,
  layout = 'vertical',
  onSubmit,
  ...props
}) => {
  const items = useRef<Record<string, IFormItemRef>>({});
  const [errors, setErrors] = useState(() => {
    const initErrors: Record<string, string> = {};
    Object.keys(values).forEach(field => (initErrors[field] = ''));
    return initErrors;
  });
  const updated = useDidUpdate();

  const updateErrors = useCallback((field: string, error: string) => {
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      if (newErrors[field] === error) {
        return prevErrors;
      } else {
        newErrors[field] = error;
        return newErrors;
      }
    });
  }, []);

  useEffect(() => {
    if (updated) {
      const validForm = Object.values(errors).every(error => !error);
      onValidateChange?.(validForm);
    }
  }, [updated, errors, onValidateChange]);

  const context = useMemo(
    () => ({
      values,
      onValuesChange,
      errors,
      updateErrors,
      rules,
      disabled,
      showRequired,
      items
    }),
    [
      values,
      onValuesChange,
      errors,
      updateErrors,
      rules,
      disabled,
      showRequired
    ]
  );

  const validate = useCallback(async () => {
    const errorsList = await Promise.all(
      Object.values(items.current).map(item => item.validate(''))
    );
    const errors = errorsList.flat().filter(x => x);
    if (errors.length > 0) {
      return false;
    } else {
      return true;
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const valid = await validate();
      if (valid) {
        onSubmit?.(event);
      }
    },
    [onSubmit, validate]
  );

  return (
    <form
      className={cls(styles.form, styles[layout], className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FormContext.Provider value={context}>{children}</FormContext.Provider>
    </form>
  );
};

export default Form;
