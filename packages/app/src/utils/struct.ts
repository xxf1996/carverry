import {
  array, boolean, defaulted, literal, number, string, Struct, union,
} from 'superstruct';

/**
 * 带默认值的字符串
 * @param val 默认值
 */
export function defaultString(val = '') {
  return defaulted(string(), val);
}

/**
 * 带默认值的数字
 * @param val 默认值
 */
export function defaultNumber(val = 0) {
  return defaulted(number(), val);
}

/**
 * 带默认值的布尔型
 * @param val 默认值
 */
export function defaultBoolean(val = false) {
  return defaulted(boolean(), val);
}

/**
 * 带默认值的数组
 * @param type 数组元素类型
 * @param val 默认值
 */
export function defaultArray<T extends Struct<any, any>, E = T extends Struct<infer P> ? P : never>(type: T, val: E[] = []) {
  return defaulted(array(type), val);
}

/**
 * 可以为空字符串的数字
 */
export const nullNumber = defaulted(union([literal(''), number()]), '');
