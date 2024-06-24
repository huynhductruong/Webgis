<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-popup-edit class="popupEdit shadow-10" square buttons persistent :title="title" :label-set="$t('Save')"
    :label-cancel="$t('Cancel')" v-model="computedRow" @update:model="updateModel" @save="saveEdit" v-slot="scope">
    <q-input v-model="scope.value.name" dense autofocus :label="$t('Name')" />
    <q-input v-model="scope.value.description" dense autofocus :label="$t('Description')" />
    <q-select v-model="scope.value.workspace" dense autofocus option-label="name" :options="workspaces"
      :label="$t('Workspace')" />
      <div>
    <!-- <q-input v-model="scope.value.style" type="file" dense autofocus /> -->
<!-- scope.value.style -->
    <div class="file-input">
      <q-input
        v-model="fileName.style"
        dense
        autofocus
        readonly
        placeholder="Chọn file Style"
        class="q-mr-sm q-input__inner"
      >
        <template v-slot:append>
          <q-btn dense @click="triggerFileInput('style')" class="btn-input">
            <q-icon name="attach_file" />
            <span>{{ buttonLabels.style }}</span>
          </q-btn>
        </template>
      </q-input>
    </div>
<!-- scope.value.raster -->
    <div class="file-input">
      <q-input
        v-model="fileName.raster"
        dense
        autofocus
        readonly
        placeholder="Chọn file Raster"
        class="q-mr-sm q-input__inner"
      >
        <template v-slot:append>
          <q-btn dense @click="triggerFileInput('raster')" class="btn-input">
            <q-icon name="attach_file" />
            <span>{{ buttonLabels.raster }}</span>
          </q-btn>
        </template>
      </q-input>
    </div>
<!-- scope.value.vector -->
    <div class="file-input">
      <q-input 
        v-model="fileName.vector"
        dense
        autofocus
        readonly
        placeholder="Chọn file Vector"
        class="q-mr-sm q-input__inner"
      >
        <template v-slot:append>
          <q-btn dense @click="triggerFileInput('vector')" class="btn-input">
            <q-icon name="attach_file" />
            <span>{{ buttonLabels.vector }}</span>
          </q-btn>
        </template>
      </q-input>
    </div>

    <!-- Hidden file input -->
    <input
      type="file"
      ref="fileInput"
      @change="handleFileChange"
      style="display: none"
    />
  </div>
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
  //Thêm tệp
  data() {
    return {
      fileName: {
        style: "",  
        raster: "",  
        vector: ""  
      },
      buttonLabels: {
        style: "Chọn tệp",
        raster: "Chọn tệp",
        vector: "Chọn tệp"
      }
    };
  },

  methods: {
    triggerFileInput(type) {
      this.$refs.fileInput.dataset.type = type;
      this.$refs.fileInput.click();
    },
    handleFileChange(event) {
      const type = this.$refs.fileInput.dataset.type;
      const file = event.target.files[0];
      if (file) {
        this.fileName[type] = file.name;  // Cập nhật tên file đã chọn
        this.buttonLabels[type] = "Thay đổi tệp"; // Thay đổi nút sang trạng thái đã chọn

      }
    }
  }
});
</script>
<style lang="scss">
.popupEdit {
  color: #1976d2;
  width: 50%;
  height: 60%;
  top: 15% !important;
  left: 25% !important;
  position: relative;
}
.q-popup-edit__buttons {
  position: absolute;
  bottom: 10px;
  right: 10px;
}
//
.q-input__inner {
  display: flex;
  align-items: center;  
  flex-grow: 2; 
}

.q-input__inner input {
  min-width: 0;
  width: auto; 
}
.q-input__inner .q-btn {
  margin-left: 50px; 
}

.file-input {
  display: flex;
  align-items: center;  
  margin-bottom: 10px;
}
.btn-input {
  background-color: #1976d2;  
  color: aliceblue;
}
</style>
