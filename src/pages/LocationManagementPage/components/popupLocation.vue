<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-popup-edit class="popupEdit shadow-10" square buttons persistent :title="title" :label-set="$t('Save')"
    :label-cancel="$t('Cancel')" v-model="computedRow" @update:model="updateModel" @save="saveEdit" v-slot="scope">
    <q-input v-model="scope.value.name" dense autofocus :label="$t('Name')" />
    <q-input v-model="scope.value.description" dense autofocus :label="$t('Description')" />
    <q-select v-model="scope.value.workspace" dense autofocus option-label="name" :options="workspaces"
      :label="$t('Workspace')" />
      <q-input v-model="scope.value.style" type="file" dense autofocus />
    <q-input v-model="scope.value.raster" type="file" dense autofocus />
    <q-input v-model="scope.value.vector" type="file" dense autofocus />
  </q-popup-edit>
</template>

<script>
import {
  defineComponent,
  ref,
  unref,
  getCurrentInstance,
  onMounted,
  computed,
} from "vue";
import axios from "axios";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
export default defineComponent({
  name: "PopupLocation",
  props: {
    row: Object,
    locationRows: Array,
    projections: Array,
    workspaces: Array,
  },
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const computedRow = ref(props.row);
    const title = computed(() => {
      return props.row.id
        ? `${$t("Update location")}: ${unref(computedRow).name}`
        : `${$t("Add location")}:`;
    });
    const saveEdit = async (value, _props) => {
      var file_style = value.style[0]
      var file_raster = value.raster[0]
      var file_vector = value.vector[0]
      const file = new FormData()
      file.append("style", file_style)
      file.append("raster", file_raster)
      file.append("vector", file_vector)
      file.append("layer_name", value.name)
      let layerName = await axios.post('http://localhost:5000/layers/upload', file,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      console.log(layerName.data);
    };
    const updateModel = (val) => {
      console.log(val);
    };
    return {
      computedRow,
      title,
      saveEdit,
      updateModel,
    };
  },
});
</script>
<style lang="scss">
.popupEdit {
  color: #1976d2;
  width: 50%;
  height: 60%;
  top: 15% !important;
  left: 25% !important;
}
</style>
