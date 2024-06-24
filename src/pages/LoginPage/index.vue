<template>
  <img src="~assets/lovepik-blue-science-and-technology-map-background-image_400054037.jpg" class="wave" alt="login-wave">
  <div class="row" style="height: 90vh">
    <!-- <div class="col-0 col-md-6 flex justify-center content-center">
    </div> -->
    <div
      v-bind:class="{
        'justify-center': $q.screen.md || $q.screen.sm || $q.screen.xs,
      }"
      class="col-12 col-md-6 flex content-center justify-center align-center"
    >
      <q-card
        v-bind:style="$q.screen.lt.sm ? { width: '80%' } : { width: '50%' }"
      >
        <q-card-section class="row items-start justify-center q-mt-lg">
          <q-avatar size="100px" class="absolute-center shadow-10 move-down">
            <img
              src="~assets/bach-khoa.jpg"
              alt="Quasar logo"
              style="width: 90px; height: 90px"
            />
          </q-avatar>
        </q-card-section>
        <q-card-section>
          <div class="q-pt-lg move-down">
            <div class="col text-h6 ellipsis flex justify-center">
              <h2 class="text-h4 text-uppercase q-my-none text-weight-regular">
                {{ $t("Login") }}
              </h2>
            </div>
          </div>
        </q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md " @submit.prevent="onSubmit" ref="formRef">
            <q-input
              class="username_input"
              outlined
              v-model="username"
              name="username"
              :label="$t('Username')"
              :rules="rules.username"
              lazy-rules
              @focus="handleUsernameFocus"
              @update:model-value="clearError"
            />
            <q-input
              outlined
              v-model="password"
              type="password"
              name="password"
              :label="$t('Password')"
              :rules="rules.password"
              lazy-rules
              autocomplete="new-password"
              @focus="handlePasswordFocus"
              @update:model-value="clearError"
            />
            <div class="googleSection">
              <q-btn
                class="full-width"
                type="submit"
                color="primary"
                text-color="white"
                rounded
                label="Login"
              ></q-btn>
              <router-link class="text-primary" to="/register"
                >Register here</router-link
              >
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import { defineComponent, getCurrentInstance, ref, unref } from "vue";
import { useUserStore } from "stores/user";
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  name: "LoginPage",
  setup() {
    const vm = getCurrentInstance().proxy;
    const router = useRouter();
    const store = useUserStore();
    const formRef = ref(null);
    const username = ref("");
    const password = ref("");
    const error = ref(null);
    const rules = {
      username: [
        (val) => !!val || "* Required",
        (val) => /^(.+)@(.+)$/.test(val) || "Invalid email address",
        () => !error.value || unref(error),
      ],
      password: [
        (val) => !!val || "* Required",
        (val) => /^(?=.*\d).{6,}$/.test(val) || "Minimum six characters",
      ],
    };
    

    const onSubmit = async () => {
      const response = await store.loginUser({
        email: unref(username),
        password: unref(password),
      });
      console.log(response);
      if (response instanceof Error) {
        error.value = response.response.data.error
        unref(formRef).validate();
        vm.$forceUpdate();
      }
      else if (response) {
        router.push({ name: "HomePage" });
      }
    };

    const clearError = () => {
      error.value = null
      unref(formRef).resetValidation();
      vm.$forceUpdate();
    }
    return {
      formRef,
      username,
      password,
      rules,
      onSubmit,
      clearError,
    };
  },
});
</script>
<style lang="scss" scoped>
.wave {
  position: fixed;
  height: 100%;
  left: 0;
  bottom: 0;
  z-index: -1;
}
.googleSection {
  align-items: center;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.move-down {
  margin-top: 20px;
}
</style>
