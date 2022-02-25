import { computed, PropType, getCurrentInstance } from 'vue';

/**
 * 用于快速代理某个组件prop；
 * @param props props对象
 * @param key 要代理的prop key
 */
export function proxyProp<T extends Readonly<Record<string, unknown>>, K extends keyof T>(props: T, key: K) {
  const emit = getCurrentInstance()?.emit; // 获取当前实例的emit，避免手动传入
  return computed<T[K]>({
    get() {
      return props[key];
    },
    set(val) {
      if (!emit) {
        return;
      }
      emit(`update:${key}`, val);
    },
  });
}

/**
 * string类型的prop
 * @param defaultVal 默认值
 */
export function stringProps(defaultVal = '') {
  return {
    type: String as PropType<string>,
    default: defaultVal,
  };
}

/**
 * boolean类型的prop
 * @param defaultVal 默认值
 */
export function boolProps(defaultVal = false) {
  return {
    type: Boolean as PropType<boolean>,
    default: defaultVal,
  };
}

/**
 * number类型的prop
 * @param defaultVal 默认值
 */
export function numberProps(defaultVal = 0) {
  return {
    type: Number as PropType<number>,
    default: defaultVal,
  };
}

/**
 * 数组类型的prop
 * @param defaultVal 默认值
 * @template T 数组元素类型
 */
export function listProps<T>(defaultVal: () => T[] = () => ([])) {
  return {
    type: Array as PropType<T[]>,
    default: defaultVal,
  };
}

/**
 * 对象类型的prop
 * @param defaultVal 默认值
 * @template T 对象interface
 */
export function objectProps<T>(defaultVal: () => (T | Record<string, unknown>) = () => ({})) {
  return {
    type: Object as PropType<T>,
    default: defaultVal,
  };
}
