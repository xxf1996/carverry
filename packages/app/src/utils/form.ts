type TriggerType = 'blur' | 'change';

/**
 * 简单的表单校验规则
 * @param message 报错信息
 * @param required 是否必填
 * @param trigger 触发时机
 */
export function simpleRule(message: string, required = true, trigger: TriggerType | TriggerType[] = ['blur', 'change']) {
  return {
    message,
    required,
    trigger,
  };
}

/**
 * 简单地自定义校验函数
 * @param validator 校验函数，函数返回布尔值，为true代表校验通过
 * @param message 报错信息
 * @param trigger 触发时机
 */
export function simpleValidator<T>(validator: (val: T) => boolean, message = '', trigger: TriggerType | TriggerType[] = ['blur', 'change']) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const validatorCb = (rule: unknown, value: T, cb: Function) => {
    if (!validator(value)) {
      cb(message);
    } else {
      cb();
    }
  };
  return {
    validator: validatorCb,
    trigger,
  };
}
