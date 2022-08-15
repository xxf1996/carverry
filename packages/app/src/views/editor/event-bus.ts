import { useEventBus } from '@vueuse/core';

export const hoverBus = useEventBus<string>('hover-buse');
