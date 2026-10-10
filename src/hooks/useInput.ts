import { ref, type Ref } from "vue";

export type UseInputReturn<T> = readonly [Ref<T>, (event: Event | T) => void, () => void];

/**
 * Composable untuk mengelola satu nilai input form.
 * Nilai pertama dapat dipakai langsung dengan `v-model`, fungsi kedua menerima
 * event input ataupun nilai mentah, dan fungsi ketiga mengembalikan nilai awal.
 */
export function useInput<T = string>(initialValue: T): UseInputReturn<T> {
  const value = ref(initialValue) as Ref<T>;

  const onChange = (event: Event | T): void => {
    value.value =
      event instanceof Event ? ((event.target as HTMLInputElement).value as T) : event;
  };

  const reset = (): void => {
    value.value = initialValue;
  };

  return [value, onChange, reset] as const;
}
