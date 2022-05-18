<template>
  <div class="logo">
    <span class="logo-item logo-item-1">c</span>
    <span class="logo-item logo-item-2">a</span>
    <span class="logo-item logo-item-3">r</span>
    <span class="logo-item logo-item-4">v</span>
    <span class="logo-item logo-item-5">e</span>
    <span class="logo-item logo-item-6">r</span>
    <span class="logo-item logo-item-7">r</span>
    <span class="logo-item logo-item-8">y</span>
    <span class="logo-item logo-item-9" />
  </div>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
$cell-size: 12px;
$cell-color1: #283c63;
$cell-color2: #928a97;
$cell-color3: #ffd3b5;
$cell-color4: #ff847c;
$cell-color5: #c76868;

@mixin cellStyle($bgColor) {
  background: $bgColor;
  color: $bgColor;
}

// TODO: 有空再玩logo的动画吧
.logo {
  height: $cell-size * 3;
  width: $cell-size * 4;
  @apply grid grid-cols-4 grid-rows-3 cursor-pointer bg-transparent;

  &:hover > &-item {
    background: transparent;
  }

  &-item {
    @apply text-xs text-center overflow-hidden;
    line-height: 12px;
    transition: background 0.2s ease-in-out;

    &-1 {
      grid-area: 3 / 1 / 4 / 2;
      @include cellStyle($cell-color1);
    }
    &-2 {
      grid-area: 2 / 1 / 3 / 2;
      @include cellStyle($cell-color2);
    }
    &-3 {
      grid-area: 1 / 1 / 2 / 2;
      @include cellStyle($cell-color3);
    }
    &-4 {
      grid-area: 1 / 2 / 2 / 3;
      @include cellStyle($cell-color4);
    }
    &-5 {
      grid-area: 1 / 3 / 2 / 4;
      @include cellStyle($cell-color5);
    }
    &-6 {
      grid-area: 1 / 4 / 2 / 5;
      @include cellStyle($cell-color3);
    }
    &-7 {
      grid-area: 2 / 4 / 3 / 5;
      @include cellStyle($cell-color2);
    }
    &-8 {
      grid-area: 3 / 4 / 4 / 5;
      @include cellStyle($cell-color1);
    }
    &-9 {
      grid-area: 2 / 2 / 4 / 4;
    }
  }
}
</style>