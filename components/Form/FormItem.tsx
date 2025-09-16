import React, {
  useMemo,
  useContext,
  useCallback,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle
} from 'react';
import cls from 'clsx';
import AsyncValidator, { ValidateError } from 'async-validator';
import styles from './form.module.css';
import { FormContext } from './context';
import { getProp, setProp } from './utils';
import Input from '../Input';
// import Radio, { RadioValueType } from '../Radio';
// import Checkbox, { CheckboxValueType } from '../Checkbox';
import Select, { SelectValueType } from '../Select';
import Textarea from '../Textarea';
import {
  IFormItemProps,
  IFormItemRef,
  Trigger,
  FormValues
} from './Form.types';

type ChildProps = {
  value: AnyLiteral | string;
  invalid: boolean;
  disabled: boolean;
  id: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect?: (value: SelectValueType) => void;
};

const FormItem = forwardRef<IFormItemRef, IFormItemProps>((props, ref) => {
  const {
    children,
    field,
    label,
    htmlFor,
    action,
    headerClassName = '',
    className = '',
    disabled = false,
    rules = []
  } = props;
  const {
    values,
    onValuesChange,
    errors,
    updateErrors,
    items,
    rules: rulesForm,
    disabled: disabledForm,
    showRequired
  } = useContext(FormContext);
  const [touched, setTouched] = useState<boolean>(false);
  const disableState = useMemo(
    () => disabled || disabledForm,
    [disabled, disabledForm]
  );

  const fieldRules = useMemo(() => {
    if (rulesForm && field) {
      return rulesForm[field] || [];
    } else {
      return rules;
    }
  }, [field, rulesForm, rules]);
  const required = useMemo(() => {
    return fieldRules.some(rule => rule.required);
  }, [fieldRules]);
  const fieldValue = useMemo(() => {
    if (field) {
      return getProp(values, field);
    } else {
      return '';
    }
  }, [values, field]);

  const errorMessage = useMemo(() => {
    if (field) {
      return errors[field];
    } else {
      return '';
    }
  }, [field, errors]);

  const filteredRule = useCallback(
    (trigger: Trigger) => {
      if (trigger) {
        return fieldRules.filter(rule => rule.trigger.includes(trigger));
      } else {
        return fieldRules;
      }
    },
    [fieldRules]
  );

  const validate = useCallback(
    (trigger: Trigger): Promise<ValidateError[] | null> => {
      const rules = filteredRule(trigger);
      if (field) {
        const descriptor = {
          [field]: rules
        };
        const validator = new AsyncValidator(descriptor);
        return new Promise(resolve => {
          if (rules.length === 0) {
            resolve([]);
          } else {
            validator.validate(
              {
                [field]: fieldValue
              },
              { firstFields: true },
              errors => {
                if (errors) {
                  updateErrors(field, errors[0].message || '');
                } else {
                  updateErrors(field, '');
                }
                resolve(errors);
              }
            );
          }
        });
      } else {
        return new Promise(resolve => resolve([]));
      }
    },
    [field, filteredRule, fieldValue, updateErrors]
  );

  useEffect(() => {
    if (touched) {
      validate('change');
    }
  }, [touched, validate]);

  useEffect(() => {
    const currentItems = items?.current;
    if (field && currentItems) {
      currentItems[field] = {
        validate
      };
    }

    return () => {
      if (field && currentItems) {
        delete currentItems[field];
      }
    };
  }, [field, validate, items]);

  useImperativeHandle(ref, () => ({
    validate
  }));

  const changeHandler = useCallback(
    (values: FormValues) => {
      onValuesChange(values);
      if (!touched) {
        setTouched(true);
      }
    },
    [onValuesChange, touched]
  );

  const inputChangeHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (field) {
        const value = event.target.value;
        const newValues = setProp(
          values,
          field,
          event.target.type === 'number' ? Number(value) : value
        );
        changeHandler(newValues);
      }
    },
    [values, field, changeHandler]
  );

  // const radioChangeHandler = useCallback(
  //   (value: RadioValueType) => {
  //     if (field) {
  //       const newValues = setProp(values, field, value);
  //       changeHandler(newValues);
  //     }
  //   },
  //   [values, field, changeHandler]
  // );

  // const checkboxGroupChangeHandler = useCallback(
  //   (checkedValue: CheckboxValueType) => {
  //     if (field) {
  //       const newValues = setProp(values, field, checkedValue);

  //       changeHandler(newValues);
  //     }
  //   },
  //   [values, field, changeHandler]
  // );

  // const checkboxChangeHandler = useCallback(
  //   (event: React.ChangeEvent<HTMLInputElement>) => {
  //     if (field) {
  //       const value = event.target.checked;
  //       const newValues = setProp(values, field, value);

  //       changeHandler(newValues);
  //     }
  //   },
  //   [values, field, changeHandler]
  // );
  const selectHandler = useCallback(
    (value: SelectValueType) => {
      if (field) {
        const newValues = setProp(values, field, value);
        changeHandler(newValues);
      }
    },
    [values, field, changeHandler]
  );

  const blurHandler = useCallback(() => {
    validate('blur');
  }, [validate]);

  const childrenElement = useMemo(() => {
    if (field && React.isValidElement(children)) {
      switch (children.type) {
        case Input:
        case Textarea: {
          const child = children as React.ReactElement<ChildProps>;
          return React.cloneElement(child as React.ReactElement<ChildProps>, {
            value: fieldValue,
            invalid: !!errorMessage,
            disabled: disableState || child.props.disabled,
            id: child.props.id || field,
            onChange: inputChangeHandler
          });
        }
        // case Radio.Group: {
        //   return React.cloneElement(children as React.ReactElement, {
        //     value: fieldValue,
        //     invalid: !!errorMessage,
        //     disabled: disableState || children.props.disabled,
        //     onChange: radioChangeHandler
        //   });
        // }
        // case Checkbox.Group: {
        //   return React.cloneElement(children as React.ReactElement, {
        //     values: fieldValue,
        //     invalid: !!errorMessage,
        //     disabled: disableState || children.props.disabled,
        //     onChange: checkboxGroupChangeHandler
        //   });
        // }
        // case Checkbox: {
        //   return React.cloneElement(children as React.ReactElement, {
        //     checked: fieldValue,
        //     invalid: !!errorMessage,
        //     disabled: disableState || children.props.disabled,
        //     id: children.props.id || field,
        //     onChange: checkboxChangeHandler
        //   });
        // }
        case Select: {
          const child = children as React.ReactElement<ChildProps>;
          return React.cloneElement(child as React.ReactElement<ChildProps>, {
            value: fieldValue,
            // invalid: !!errorMessage,
            disabled: disableState || child.props.disabled,
            onSelect: selectHandler
          });
        }
        default: {
          return children;
        }
      }
    } else {
      return children;
    }
  }, [
    children,
    inputChangeHandler,
    fieldValue,
    errorMessage,
    field,
    disableState,
    selectHandler
  ]);
  return (
    <div
      className={cls(
        styles.formItem,
        {
          [styles.showMessage]: !!errorMessage
        },
        className
      )}
    >
      <div className={cls(styles.formItemHeader, headerClassName)}>
        <label
          className={cls(
            styles.formItemLabel,
            required && showRequired && styles.required
          )}
          htmlFor={htmlFor || field}
        >
          {label}
        </label>
        {action}
      </div>
      <div className={styles.formItemBody} onBlur={blurHandler}>
        {childrenElement}
        {errorMessage && (
          <div className={styles.message}>
            <span className={styles.messageText}>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
});

FormItem.displayName = 'FormItem';

export default FormItem;
