import { ComponentOption, OptionTree } from '@/typings/editor';
import { computed } from 'vue';
import { blockOption, componentMap } from '../state';

function componentToOptions(root: ComponentOption): OptionTree[] {
  const tree: OptionTree[] = [];
  const meta = componentMap.value[root.path];
  const children: OptionTree[] = [];
  Object.entries(root.slots).forEach(([slotName, slotChildren]) => {
    children.push({
      label: slotName,
      key: `${root.key}-${slotName}`,
      isSlot: true,
      children: slotChildren.map((slotChild) => componentToOptions(slotChild as ComponentOption)).flat(),
    });
  });
  if (root.path) {
    tree.push({
      label: meta.name,
      key: root.key,
      isSlot: false,
      children,
    });
  } else {
    tree.push(...children);
  }

  return tree;
}

export const optionTree = computed<OptionTree[]>(() => componentToOptions(blockOption.value));
