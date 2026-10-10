import { h, type Component } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia, type Pinia } from "pinia";
import { createMemoryHistory, createRouter, type RouteRecordRaw, type Router } from "vue-router";

export type MockState = Record<string, Record<string, unknown>>;

/** Membuat instance Pinia baru; state awal setiap store ditambal saat store pertama kali dibuat. */
export function createMockPinia(initialState: MockState = {}): Pinia {
  const pinia = createPinia();
  pinia.use(({ store }) => {
    const state = initialState[store.$id];
    if (state) store.$patch((current) => Object.assign(current, state));
  });
  setActivePinia(pinia);
  return pinia;
}

const Blank: Component = { render: () => h("div") };

export const blankRoutes: RouteRecordRaw[] = [{ path: "/:pathMatch(.*)*", component: Blank }];

export function createTestRouter(routes: RouteRecordRaw[] = blankRoutes): Router {
  return createRouter({ history: createMemoryHistory(), routes });
}

export interface RenderOptions {
  props?: Record<string, unknown>;
  initialState?: MockState;
  pinia?: Pinia;
  route?: string;
  routes?: RouteRecordRaw[];
  router?: Router;
  stubs?: Record<string, unknown>;
}

/** Me-render komponen bersama Pinia store dan Memory Router. */
export async function renderWithProviders(component: Component, options: RenderOptions = {}) {
  const pinia = options.pinia ?? createMockPinia(options.initialState);
  const router = options.router ?? createTestRouter(options.routes);
  await router.push(options.route ?? "/");
  await router.isReady();

  const wrapper = mount(component, {
    props: options.props,
    global: {
      plugins: [pinia, router],
      stubs: options.stubs as Record<string, never>,
    },
  });
  await flushPromises();

  return { wrapper, pinia, router };
}
