<template>
  <div ref="mapRoot" class="mapView">
    <q-page-sticky class="stickyClass" style="z-index: 999999999;" position="top-left" :offset="[10, 10]">
      <FloatControl data-html2canvas-ignore v-bind="{ map: map, view: view }" :chartData="data"
        @closePopup="closePopup" />
    </q-page-sticky>
    <q-page-sticky class="stickyClass" style="justify-self: center; width: 50%;" position="top" :offset="[10, 10]">
      <div class="horizontal-layout">
        <div id="search"></div>
        <button class="op_modal_btn" @click="wms_layers">Thêm layer</button>
      </div>
    </q-page-sticky>
    <q-page-sticky class="stickyClass" position="top-right" :offset="[10, 10]">
      <div style="display: flex; flex-direction: row; gap: 10px">

        <FloatZoom data-html2canvas-ignore />
      </div>
    </q-page-sticky>
    <q-page-sticky class="stickyClass" position="bottom" :offset="[10, 10]">
      <div v-html="imageHTML" />
    </q-page-sticky>
    <FloatDetail v-if="showDetail" data-html2canvas-ignore v-model="showDetail" v-bind="floatDetailProps"
      @update:model-content="floatDetailProps.content = $event" />
  </div>
  <div ref="popupRef" class="ol-popup">
    <q-btn ref="popupCloser" class="ol-popup-closer" flat round icon="close" @click="actionClosePopup"></q-btn>
    <div ref="popupContent"></div>
  </div>
  <div id="legend"></div>
  <button @click="show_hide_legend" type="button" id="legend_btn" class="btn-show-legend">☰ Show
    Legend</button>
  <div>
    <modal v-if="showModal" @close="closeModal" class="modal_AWS">
      <modal-dialog>
        <modal-header>
          <h3 class="modal-title">Danh sách các layer</h3>
          <span class="close-modal" @click="closeModal">&#10060;</span>
        </modal-header>
        <modal-body>
          <table id="table_wms_layers">
          </table>
        </modal-body>
        <div class="modal-footer">
          <button @click="closeModal" style="background-color: red">Close</button>
          <button @click="addLayer" style="background-color: rgb(57, 230, 42); color: black; font-weight:bold">Add
            Layer</button>
        </div>
      </modal-dialog>

    </modal>
  </div>
</template>

<script>
import "ol/ol.css";
import { Map, View, Overlay } from "ol";
import { createEmpty, extend } from "ol/extent";
import { toStringHDMS } from "ol/coordinate";
import { Fill, Stroke, Style } from "ol/style";
import { writeGeoJSON } from "src/utils/openLayers";
import GeoJSON from "ol/format/GeoJSON";
import { OSM, XYZ } from "ol/source";
import axios from 'axios';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import 'ol-layerswitcher/src/ol-layerswitcher.css';
import {
  Tile as TileLayer,
  Vector as VectorLayer,
  Image as ImageLayer,
  VectorImage as VectorImageLayer,
  Group as LayerGroup
} from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Point } from "ol/geom";
import { unByKey } from "ol/Observable";
import { scaleControl } from "src/utils/openLayers";
import { transform, Projection } from "ol/proj";
import { register } from "ol/proj/proj4";
import { useLocationStore } from "stores/location";
import { useMapStore } from "stores/map";
import ImageWMS from 'ol/source/ImageWMS';
import proj4 from "proj4";
register(proj4);

import {
  defineComponent,
  computed,
  ref,
  unref,
  onMounted,
  onUnmounted,
  onUpdated,
  getCurrentInstance,
  provide,
} from "vue";
import _debounce from "lodash/debounce";
import _isEmpty from "lodash/isEmpty";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import { $bus } from "boot/bus.js";
import FloatDetail from "src/components/floatDetail/index.vue";
import FloatControl from "src/components/floatControl/index.vue";
import FloatZoom from "src/components/floatZoom.vue";
import { FeatureUtils, distanceBetweenPoints } from "src/utils/openLayers";
import { getFeature } from "src/api/feature";
import { captureScreenshot } from "src/utils/html2Canvas";
import { LAYER_TYPE, FEATURE_TYPE } from "src/constants/enum";
import { transformExtent } from 'ol/proj';
import LayerSwitcher from 'ol-layerswitcher';
import $ from 'jquery';
import Geocoder from 'ol-geocoder';
export default defineComponent({
  name: "IndexPage",
  components: {
    FloatDetail,
    FloatControl,
    FloatZoom
  },
  props: {},
  setup(props) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const locationStore = useLocationStore();
    const mapStore = useMapStore();
    const showDetail = ref(false);
    const floatDetailProps = ref({
      title: null,
      image: "images/No-image-available.png",
      content: {},
      type: LAYER_TYPE[0],
      id: null,
      coordinate: null,
    });
    const imageHTML = ref(null);
    const layerForImage = ref(new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({
          color: "BLUE",
          width: 3,
        }),
      }),
      zIndex: 2,
    }
    ));
    unref(layerForImage).set("id", "selected-layer")
    const onShowDetail = (option) => {
      const {
        content,
        image,
        title,
        type = LAYER_TYPE[0],
        coordinate,
        feature_type = FEATURE_TYPE[0]
      } = option;
      showDetail.value = true;
      if (title) {
        floatDetailProps.value.title = title;
      }
      if (image) {
        floatDetailProps.value.image = image;
      }
      if (content) {
        floatDetailProps.value.content =
          typeof content === "string" ? JSON.parse(content) : content;
        if (floatDetailProps.value?.content?.RefName || floatDetailProps.value?.content?.tendat || floatDetailProps.value?.content?.name) {
          const _title = floatDetailProps.value?.content?.RefName || floatDetailProps.value?.content?.tendat || floatDetailProps.value?.content?.name;
          try {
            floatDetailProps.value.title = decodeURIComponent(escape(_title));
          } catch {
            floatDetailProps.value.title = _title;
          }
        }
      }
      if (coordinate) {
        floatDetailProps.value.coordinate = coordinate;
      }
      if (type !== LAYER_TYPE[0]) {
        floatDetailProps.value.type = type;
      }
      if (feature_type !== FEATURE_TYPE[0]) {
        floatDetailProps.value.feature_type = feature_type;
      }
    };
    $bus.on("on-show-detail", onShowDetail);
    // popup
    const popupRef = ref(null);
    const popupContent = ref(null);
    const popupCloser = ref(null);
    const popupEvent = ref(null);
    const pointermoveEvent = ref(null);
    const selectedObject = ref({});
    const overlay = ref(null);
    const addOverlay = () => {
      overlay.value = new Overlay({
        element: unref(popupRef),
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      });
    };
    const legend = () => {

      $('#legend').empty();
      var no_layers = unref(overlayers).getLayers().get('length');
      //console.log(no_layers[0].options.layers);
      // console.log(overlays.getLayers().get('length'));
      //var no_layers = overlays.getLayers().get('length');

      var head = document.createElement("h8");

      var txt = document.createTextNode("Legend");

      head.appendChild(txt);
      var element = document.getElementById("legend");
      element.appendChild(head);


      unref(overlayers).getLayers().getArray().slice().forEach(layer => {

        var head = document.createElement("p");

        var txt = document.createTextNode(layer.get('title'));
        //alert(txt[i]);
        head.appendChild(txt);
        var element = document.getElementById("legend");
        element.appendChild(head);
        var img = new Image();
        img.src = "http://localhost:8084/geoserver/HienTrangSDD/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=" + layer.get('title');
        var src = document.getElementById("legend");
        src.appendChild(img);

      });
    }

    const closePopup = (state) => {
      if (state === true) {
        unref(layerForImage).getSource().clear();
        const lastFeature = unref(selectedObject).lastFeature;
        const lastLayer = unref(selectedObject).lastLayer;
        if (lastFeature) lastFeature.originStyle = false;
        if (lastLayer) lastLayer?.changed?.();
        unref(selectedObject).lastFeature = null;
        unByKey(unref(popupEvent));
        popupEvent.value = false;
        unref(overlay).setPosition(undefined); //obsolete
      } else if (_isEmpty(unref(popupEvent))) {
        initPopupEvent()
      }
    };
    $bus.on("close-popup", closePopup);
    const actionClosePopup = () => {
      // when close popup, clear the vectorforImage
      unref(layerForImage).getSource().clear();
      showDetail.value = false;
      floatDetailProps.value = {
        title: null,
        image: "images/No-image-available.png",
        content: {},
        type: LAYER_TYPE[0],
        feature_type: FEATURE_TYPE[0],
        id: null,
        coordinate: null,
      };
      const lastFeature = unref(selectedObject).lastFeature;
      const lastLayer = unref(selectedObject).lastLayer;
      if (lastFeature) lastFeature.originStyle = false;
      if (lastLayer) lastLayer?.changed?.();
      unref(selectedObject).lastFeature = null;
      unref(layerForImage).getSource().clear();
      unref(overlay).setPosition(undefined);
    };
    $bus.on("close-float-detail", actionClosePopup);
    const onRemoveLayer = (layerUrl) => {
      if (unref(layerForImage).url === layerUrl) actionClosePopup();
    };

    $bus.on("remove-layer", onRemoveLayer);

    const getFeatureAPI = _debounce((feature) => {
      const properties = feature.getProperties()
      delete properties.geometry
      floatDetailProps.value.id = feature.getId();
      floatDetailProps.value.title = feature.getId();
      onShowDetail({
        content: properties || {},
      });
      // getFeature({ name: featureId })
      //   .then((response) => {
      //     if (FEATURE_TYPE[1] === response.type) {
      //       floatDetailProps.value.feature_type = response.type;
      //     }
      //     floatDetailProps.value.id = response.id;
      //     onShowDetail({
      //       content: JSON.parse(response?.properties || false),
      //     });
      //   })
      //   .catch((e) => console.log(e));
    }, 200);

    const getFeatureUpload = (feature) => {
      const objData = writeGeoJSON({ feature, map: unref(map) })
      onShowDetail({
        content: objData,
      });
    }

    const styleChangeListener = function (feature) {
      feature.on("change", function (event) {
        setTimeout(() => {
          captureScreenshot().then((response) => {
            floatDetailProps.value.image = response;
          });
        }, 1000);
      });
    };

    const initPopupEvent = () => {
      const highLightFeature = function (feature, layer) {
        let lastFeature = unref(selectedObject).lastFeature;
        let lastLayer = unref(selectedObject).lastLayer;
        if (lastFeature !== feature) {
          if (lastFeature) lastFeature.originStyle = false;
          feature.originStyle = true;
          unref(selectedObject).lastFeature = feature;
          lastLayer?.changed?.();
          unref(selectedObject).lastLayer = layer;
          return true;
        } else {
          feature.originStyle = false;
          unref(selectedObject).lastFeature = null;
          return false;
        }
      };

      popupEvent.value = unref(map).on("singleclick", function (evt) {
        let location = locationStore.getStartLocation;
        location = transform(
          location,
          "EPSG:3857",
          unref(map).getView().getProjection()
        );
        floatDetailProps.value.distance = distanceBetweenPoints(
          location,
          evt.coordinate
        );
        unref(map).forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          if (!layer || layer instanceof VectorLayer) return feature;
          if (layer.get("id-upload")) {
            floatDetailProps.value.type = LAYER_TYPE[1]
          }
          layer.getFeatures(evt.pixel).then((response) => {
            const _extent = createEmpty();
            extend(_extent, feature);
            response.forEach((r) => {
              const f = r
                .get("features")
                .find((f) => {
                  extend(_extent, f.getGeometry().getExtent())
                  return f.getGeometry().intersectsCoordinate(evt.coordinate)
                }
                );
              if (!f) {
                unref(map)
                  .getView()
                  .fit(_extent, {
                    duration: 1000,
                    padding: [2000, 2000, 2000, 2000],
                    maxZoom: 15,
                  });
                return
              }
              const isHighLight = highLightFeature(f, layer);
              layer.changed();
              if (isHighLight) {
                extend(_extent, f.getGeometry().getExtent());
                unref(map)
                  .getView()
                  .fit(f.getGeometry().getExtent(), {
                    duration: 500,
                    padding: [50, 50, 50, 50],
                  });
                const featureId = f.getId();
                const dataFeature = FeatureUtils.getDataOfFeature(
                  f,
                  layer
                );
                const coordinate = evt.coordinate;
                dataFeature.setLocation(coordinate);
                // set float detail
                if (featureId) getFeatureAPI(featureId);
                else getFeatureUpload(f);
                // screenshot
                floatDetailProps.value.title = dataFeature.name;
                floatDetailProps.value.coordinate = toStringHDMS(
                  transform(
                    coordinate,
                    unref(map).getView().getProjection().getCode(),
                    "EPSG:4326"
                  )
                ).replace("N ", "N\n");
                setTimeout(() => {
                  captureScreenshot().then((response) => {
                    floatDetailProps.value.image = response;
                  });
                }, 800);
                // set float detail
              } else {
                actionClosePopup();
              }
            });
          });
        });
        unref(map).getLayers().getArray().forEach((layer) => {
          if (layer instanceof ImageLayer) {
            const url = layer.getSource().getFeatureInfoUrl(
              evt.coordinate,
              unref(map).getView().getResolution(),
              'EPSG:5899',
              { 'INFO_FORMAT': 'application/json' }
            )
            if (url) {
              fetch(url)
                .then((response) => response.text())
                .then((html) => {
                  const features = new GeoJSON().readFeatures(html)
                  if (features.length) {
                    const isSelected = unref(layerForImage).getSource().getFeatures()
                    if (isSelected.some((f) => f?.getId?.() === features[0].getId?.())) {
                      actionClosePopup();
                      return;
                    }
                    unref(layerForImage).url = layer.url;
                    unref(layerForImage).getSource().clear();
                    unref(layerForImage).getSource().addFeatures(features)
                    mapStore.setSelectedFeature({
                      layer,
                      feature: features[0]
                    })
                    unref(map).getView().fit(
                      features[0].getGeometry().getExtent(),
                      {
                        duration: 600,
                        padding: [100, 100, 100, 100],
                      }
                    )
                    if (features[0].getId?.()) getFeatureAPI(features[0]);
                    setTimeout(() => {
                      captureScreenshot().then((response) => {
                        floatDetailProps.value.image = response;
                      });
                    }, 1500);
                  } else {
                    actionClosePopup();
                  }
                });
            }
          }
        })
      });
    };
    // popup

    /**
     *
     * @type {Map}
     */
    const map = ref(null);

    const overlayers = ref(new LayerGroup({
      title: 'Overlays',
      layers: [],
    }));
    provide("map", map);
    const baseMaps = ref(new LayerGroup({
      title: 'Base maps',
      layers: [
        new TileLayer({
          title: 'OSM',
          type: 'base',
          visible: true,
          source: new OSM({ attributions: "" }),
        }),
        new TileLayer({
          title: 'Satellite',
          type: 'base',
          visible: true,
          source: new XYZ({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 23,
          }),
        })

      ],
    }))
    const geocoder = ref(new Geocoder('nominatim', {
      provider: 'osm',
      lang: 'en',
      placeholder: 'Search for ...',
      limit: 5,
      debug: false,
      autoComplete: true,
      keepOpen: true,
    }))
    const view = ref(
      new View({
        zoom: 0,
        center: [0, 0],
        extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      })
    );
    const layerSwitcher = ref(new LayerSwitcher({
      activationMode: 'click',
      startActive: true,
      tipLabel: 'Layers',
      groupSelectStyle: 'children',
      collapseTipLabel: 'Collapse layers',
    }));
    onMounted(() => {
      addOverlay()

      map.value = new Map({
        target: vm.$refs["mapRoot"],
        controls: [scaleControl],
        overlays: [unref(overlay)],
        view: unref(view),
      });
      initPopupEvent();
      unref(map).addLayer(unref(baseMaps))
      unref(map).addLayer(unref(overlayers))
      unref(map).addLayer(unref(layerForImage))
      unref(map).addControl(unref(layerSwitcher))
      unref(map).addControl(unref(geocoder))
      var geocoderElement = document.querySelector('.gcd-gl-control');
      document.getElementById('search').appendChild(geocoderElement);
      legend()
    });

    onUnmounted(() => {
      $bus.off("close-popup");
      $bus.off("close-float-detail");
      $bus.off("on-show-detail");
    });
    const stickCenterX = ref(window.outerWidth / 10 * 2.2)
    const showModal = ref(false);
    let layer_name = ref("");
    const data = ref([]);

    return {
      showModal,
      legend,
      data,
      layer_name,
      layerSwitcher,
      overlayers,
      overlay,
      map,
      view,
      showDetail,
      floatDetailProps,
      imageHTML,
      popupRef,
      popupCloser,
      popupEvent,
      actionClosePopup,
      popupContent,
      closePopup,
      stickCenterX,
    };
  }
  ,
  methods: {
    openModal() {

    },
    closeModal() {
      this.showModal = false;
    },
    async wms_layers() {
      try {
        this.showModal = true;
        const response = await fetch("http://localhost:8084/geoserver/HienTrangSDD/wms?request=getCapabilities");
        const xml = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "text/xml");

        const layers = xmlDoc.querySelectorAll("Layer > Layer");
        const table = document.getElementById("table_wms_layers");

        table.innerHTML = '<tr"><th style="min-width: 30%;">Name</th><th  style="min-width: 30%;">Title</th><th  style="min-width: 40%;">Abstract</th></tr>';

        layers.forEach(layer => {
          const name = layer.querySelector("Name").textContent;
          const title = layer.querySelector("Title").textContent;
          const abstract = layer.querySelector("Abstract").textContent;

          const row = document.createElement("tr");
          row.innerHTML = `<td style="min-width: 30%;">${name}</td><td style="min-width: 30%;">${title}</td><td style="min-width: 40%;">${abstract}</td>`;
          table.appendChild(row);
        });

        this.addRowHandlers1();
      } catch (error) {
        console.error("Error fetching WMS layers:", error);
      }
    },
    addRowHandlers1() {
      const rows = document.getElementById("table_wms_layers").rows;
      const table = document.getElementById('table_wms_layers');
      const heads = table.querySelectorAll('th');
      let col_no;

      heads.forEach((head, index) => {
        if (head.innerHTML === 'Name') {
          col_no = index + 1;
        }
      });
      const vueInstance = this;
      for (let i = 0; i < rows.length; i++) {
        rows[i].onclick = function () {
          return function () {
            const tableRows = document.querySelectorAll("#table_wms_layers tr");
            tableRows.forEach(row => {
              const cells = row.querySelectorAll("td");
              cells.forEach(cell => {
                row.style.backgroundColor = "white";
              });
            });
            const cell = this.cells[col_no - 1];
            vueInstance.layer_name = cell.innerHTML
            this.style.backgroundColor = "gray";
          };
        }(rows[i]);
      }
    },
    async addLayer() {

      const layer_wms = new ImageLayer({
        title: this.layer_name,
        source: new ImageWMS({
          url: 'http://localhost:8084/geoserver/HienTrangSDD/wms',
          params: {
            'LAYERS': this.layer_name
          },
          ratio: 1,
          serverType: 'geoserver'
        })
      });
      this.overlayers.getLayers().push(layer_wms)
      const url = 'http://localhost:8084/geoserver/HienTrangSDD/wms?request=getCapabilities';

      axios.get(url) // Use axios to make GET request
        .then(response => {
          const parser = new WMSCapabilities();
          const result = parser.read(response.data);
          const layers = result.Capability.Layer.Layer;
          let extent;

          for (let i = 0; i < layers.length; i++) {
            const layerobj = layers[i];
            if (layerobj.Name === this.layer_name) {

              extent = layerobj.BoundingBox[0].extent;
              const transformedExtent = transformExtent(extent, 'EPSG:4326', unref(this.map).getView().getProjection());
              unref(this.map).getView().fit(transformedExtent, {
                duration: 1590,
                size: unref(this.map).getSize()
              });
              break;
            }
          }
        })
        .catch(error => {
          console.error('Error fetching capabilities:', error);
        });
      this.layerSwitcher.renderPanel()
      this.legend();
      this.showModal = false;
      let chartData_custom = await this.getFeatureGridCodes(this.layer_name)
      chartData_custom.title = this.layer_name
      this.data = [...this.data, chartData_custom]
    },
    show_hide_legend() {

      if (document.getElementById("legend").style.visibility == "hidden") {

        document.getElementById("legend_btn").innerHTML = "☰ Hide Legend";
        document.getElementById("legend_btn").setAttribute("class", "btn-hide-legend");

        document.getElementById("legend").style.visibility = "visible";
        document.getElementById("legend").style.width = "15%";

        document.getElementById('legend').style.height = '38%';
        unref(this.map).updateSize();
      } else {
        document.getElementById("legend_btn").setAttribute("class", "btn-show-legend");
        document.getElementById("legend_btn").innerHTML = "☰ Show Legend";
        document.getElementById("legend").style.width = "0%";
        document.getElementById("legend").style.visibility = "hidden";
        document.getElementById('legend').style.height = '0%';

        unref(this.map).updateSize();
      }
    },
    getFeatureGridCodes(layer_name_set) {
      var url = `http://localhost:8084/geoserver/HienTrangSDD1/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${layer_name_set}&outputFormat=application/json`;
      return new Promise(resolve => {
        $.getJSON(url, function (data) {
          const array = data.features
          let new_data = {}
          for (let i = 1; i <= 6; i++) {
            const count = array.reduce((sum, item) => {
              if(item.properties.gridcode === i) return sum + item.properties.Shape_Area
              return sum
            }, 0.0);
            new_data = {
              ...new_data,
              [i]: count
            }
          }
          resolve(new_data)
        })
      }
      )
    }
  }
});
</script>
<style lang="scss" scoped>
html,
body {
  width: 100%;
  height: 100%;
  position: relative;
}

.mapView {
  height: 93vh;
  width: 100%;
  min-height: inherit;

  :global(.ol-scale-bar.ol-unselectable) {
    margin-left: 50px !important;
  }
}

.stickyClass {
  z-index: 1;
}

.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}

.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}

.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}

.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}

.modal_AWS {
  position: relative;
  position: fixed;
  z-index: 9999;
  left: 25%;
  top: 30%;
  width: 50%;
  max-height: 60%;
  overflow: auto;
  background-color: #fff;
  border-radius: 5px;
  /* Semi-transparent background */
}

.close-modal {
  position: absolute;
  top: 2%;
  right: 1%;
  cursor: pointer;
}

#table_wms_layers {
  white-space: nowrap;
  grid-template-areas: "head-fixed" "body-scrollable";
  width: 100%;
  background-color: #fff;
  padding: 0px 10px 0px 10px;
}

#table_wms_layers th {
  position: -webkit-sticky;
  /* for Safari */
  position: sticky;
  top: 0px;
  background-color: rgb(122, 209, 100);
}

#table_wms_layers tr {
  cursor: pointer;
}

#legend {
  padding: 2px 4px;
  border: 1px solid grey;
  position: absolute;
  bottom: 8%;
  height: 0%;
  overflow: scroll;
  width: 0%;
  right: 0%;
  z-index: 10000;
  background-color: #ffffff;
  font-weight: bold;
  visibility: hidden;
}

#legend_btn {
  position: absolute;
  z-index: 600;
  bottom: 2%;
  right: 0%;
  height: 35px;
  border-radius: 5px;
  color: black;
  padding: 5px 10px 5px 10px;
  font-weight: bold;
  width: 140px;
}

#search {
  min-width: 300px;
  margin-left: 150px;
  height: 40px;
  display: flex;
  align-items: center;
  // justify-content:center;
  background-color: #fff;
  border-radius: 15px;
}

.op_modal_btn {
  background: linear-gradient(140deg, #00FF00 0%, #00FF33 50%, #00FF66 100%);
  color: #484848;
  border-radius: 10px;
  margin-left: 50px;
  height: 40px;
  padding: 5px 30px 5px 30px;
}

.btn-show-legend {
  background-color: rgb(9, 212, 46);
  color: #fff;
}

.btn-hide-legend {
  background-color: rgb(212, 9, 36);
  color: #fff !important;
}

.horizontal-layout {
  display: flex;
  justify-content: center;
  /* Centers the items horizontally within the container */
  align-items: center;
  /* Vertically centers the items (optional) */
  gap: 10px;
  /* Adds space between the items */
  width: 100%;
  /* Ensures the layout takes the full width of the container */
  height: 50px;
}

.modal-title {
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
  padding: 5px;
}

.modal-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  padding: 0px 10px 20px 0px;
  margin-top: 20px;

  button {
    margin-left: 10px;
    display: flex;
    min-width: 100px;
    justify-content: center;
    padding: 5px 10px 5px 10px;
    border-radius: 3px;
    color: #fff;

    &:hover {
      background-color: brown;
      color: #fff;
      transition: ease .3s;
    }
  }
}
</style>
