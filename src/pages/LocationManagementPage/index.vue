html
Sao chép mã
<template>
  <div class="q-pa-md">
    <div style="display: flex; align-items:center">
      <q-select v-model="visibleLocationColumns" :display-value="$t('Columns')" :options="locationColumns" dense
        multiple outlined emit-value map-options options-cover options-dense option-value="name"
        style="min-width: 150px" />
      <q-btn rounded color="primary" icon="add" style="margin-left: 10px">
        <q-tooltip anchor="center right" self="center start">
          {{ $t("Add location") }}
        </q-tooltip>
        <PopupLocation v-model:row="newLocation" :location-rows="locationRows" :projections="projections"
          :workspaces="workspaces" />
      </q-btn>

      <q-space />
      <q-input :label="$t('Search for location')" debounce="300" color="primary" v-model="locationFilter"
        @update:model-value="filterData">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <table class="tableLocationClass">
      <thead>
        <tr>
          <th>Name</th>
          <th>Workspace</th>
          <th>Type</th>
          <th>Created</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in filteredData" :key="index">
          <td>{{ item.name }}</td>
          <td>{{ item.workspace }}</td>
          <td>{{ item.type }}</td>
          <td>{{ item.created }}</td>
          <td>
            <button @click="deleteItem(index)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <q-pagination input style="place-content: center" v-model="locationPagination.page"
      @update:model-value="paginateData" :max="locationPagination.rowsNumber" boundary-numbers direction-links flat
      color="grey" active-color="primary" />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import axios from "axios";
import PopupLocation from "src/pages/LocationManagementPage/components/popupLocation.vue";

export default defineComponent({
  name: "LocationManagementPage",
  components: {
    PopupLocation,
  },
  setup() {
    const $q = useQuasar();
    const $t = i18n.global.t;
    const locationFilter = ref("");
    const visibleLocationColumns = ref(["name", "description", "workspace", "layer", "action"]);
    const locationColumns = computed(() => [
      { name: "name", align: "center", label: $t("Name"), field: "name" },
      { name: "description", align: "center", label: $t("Description"), field: "description" },
      { name: "workspace", align: "center", label: $t("Workspace"), field: "workspace" },
      { name: "layer", align: "center", label: $t("Layers"), field: "mapLayers" },
      { name: "action", align: "center", label: $t("Action") },
    ]);
    const locationPagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 10 });
    const dataTable = ref([]);
    const newLocation = ref({ name: null, description: null, view: { longitude: null, latitude: null, projection: { name: null } } });
    const locationRows = ref([]);
    const projections = ref([]);
    const workspaces = ref([]);

    const fetchData = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/layers");
        dataTable.value = data;
      } catch (error) {
        $q.notify({ color: "negative", message: "Failed to load data" });
      }
    };

    const deleteItem = async (index) => {
      try {
        let isDelete = confirm("Chắn chắn xoá chứ ?")
        if (isDelete) {
          const item = dataTable.value[index];
          await axios.delete(`http://localhost:5000/layers/${item.workspace}/${item.name}`);
          dataTable.value.splice(index, 1);
          $q.notify({ color: "positive", message: "Item deleted successfully" });
        }
      } catch (error) {
        $q.notify({ color: "negative", message: "Failed to delete item" });
      }
    };

    const filterData = () => {
      fetchData()
      if (!locationFilter.value) {
        return dataTable.value;
      }
      return dataTable.value.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(locationFilter.value.toLowerCase()))
      );
    };

    const filteredData = computed(() => filterData());

    const paginateData = () => {
      const start = (locationPagination.value.page - 1) * locationPagination.value.rowsPerPage;
      const end = start + locationPagination.value.rowsPerPage;
      return filteredData.value.slice(start, end);
    };

    onMounted(() => {
      fetchData();
    });

    return {
      visibleLocationColumns,
      locationColumns,
      locationPagination,
      dataTable,
      newLocation,
      locationRows,
      projections,
      workspaces,
      deleteItem,
      filteredData,
      locationFilter,
      paginateData,
      fetchData,
    };
  },
});
</script>

<style scoped>
.tableLocationClass {
  width: 100%;

  tr {
    width: 100%;
    display: flex;
    justify-content: space-around;

    td {
      max-width: 20%;
      min-width: 20%;
      max-height: 30px;
      min-height: 30px;
      text-align: center;
    }
  }
}
</style>