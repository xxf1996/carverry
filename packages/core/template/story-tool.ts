/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
import { ArgTypes, Story } from '@storybook/vue3';
import { Component } from 'vue';

interface PropItem {
  default?: string | number | boolean | (() => unknown);
  type: (() => unknown) | string | Array<unknown>;
  required?: boolean;
}

interface VueDocProp {
  defaultValue?: {
    func: boolean;
    value: string;
  };
  description: string;
  name: string;
  type: {
    func: boolean;
    name: string;
  };
}

interface VueDocInfo {
  props: VueDocProp[];
}

function getPropType(propType: PropItem['type'] | unknown): string {
  let res = '';
  if (typeof propType === 'function') {
    res = propType.name.toLocaleLowerCase();
  } else if (propType instanceof Array) {
    res = propType.map((item) => getPropType(item)).join(' | ');
  }

  return res;
}

/**
 * 获取组件prop的部分信息，用于覆盖部分不正确的地方；
 *
 * 由于story的ArgTypes修改时只是和默认的ArgTypes进行合并，因此只需要改相应的字段即可；
 * @param props
 */
export function getComponentPropInfo(props: Record<string, PropItem>, doc?: VueDocInfo): ArgTypes {
  const args: ArgTypes = {};
  for (const prop of Object.keys(props)) {
    const propInfo = props[prop];
    let originType = '';
    let originDefault = '';
    if (doc) {
      const originProp = doc.props.find((item) => item.name === prop);
      if (originProp) {
        originType = originProp.type.name;
        originDefault = originProp.defaultValue?.value || '';
      }
    }
    args[prop] = {
      type: {
        name: getPropType(propInfo.type),
        required: propInfo.required,
      },
      // https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#no-longer-inferring-default-values-of-args
      table: {
        type: {
          summary: getPropType(propInfo.type),
          detail: originType ? `原始值：\`${originType}\`` : undefined,
        },
        defaultValue: {
          summary: typeof propInfo.default === 'function' ? propInfo.default() : propInfo.default,
          detail: originDefault ? `原始值：\`${originDefault}\`` : undefined,
        },
      },
    };
  }
  return args;
}

export function basicTemplate<Props extends Record<string, unknown>>(component: Component): Story<Props> {
  const name = component.name || 'component';
  return (args) => ({
    // Components used in your story `template` are defined in the `components` object
    components: {
      [name]: component,
    },
    // The story's `args` need to be mapped into the template through the `setup()` method
    setup() {
      return { args };
    },
    // And then the `args` are bound to your component with `v-bind="args"`
    template: `<${name} v-bind="args" />`,
  });
}
