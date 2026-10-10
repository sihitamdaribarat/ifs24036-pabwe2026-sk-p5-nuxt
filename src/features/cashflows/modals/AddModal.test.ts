import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("~/features/cashflows/api/cashFlowApi", () => ({
  default: { addCashFlow: vi.fn() },
}));
vi.mock("~/helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/helpers/toolsHelper")>()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import cashFlowApi from "~/features/cashflows/api/cashFlowApi";
import { showErrorDialog, showSuccessDialog } from "~/helpers/toolsHelper";
import { renderWithProviders } from "~/test-utils";
import AddModal from "./AddModal.vue";

type Wrapper = Awaited<ReturnType<typeof renderWithProviders>>["wrapper"];

async function fillAndSubmit(wrapper: Wrapper) {
  await wrapper.find('input[value="outflow"]').setValue(true);
  await wrapper.find("#add-source").setValue("savings");
  await wrapper.find("#add-label").setValue(" alat-elektronik ");
  await wrapper.find("#add-nominal").setValue("400000");
  await wrapper.find("#add-description").setValue(" Keyboard ");
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

describe("AddModal", () => {
  it("tidak dirender ketika tertutup", async () => {
    const { wrapper } = await renderWithProviders(AddModal, { props: { open: false } });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("menampilkan form dengan pilihan jenis, sumber dana, dan saran label", async () => {
    const { wrapper } = await renderWithProviders(AddModal, {
      props: { open: true },
      initialState: { cashFlows: { labels: ["gaji", "makan"] } },
    });

    expect(wrapper.text()).toContain("Pemasukan (Inflow)");
    expect(wrapper.text()).toContain("Pengeluaran (Outflow)");
    expect(wrapper.findAll("#add-source option").map((o) => o.text())).toEqual([
      "Tunai",
      "Tabungan",
      "Pinjaman",
    ]);
    expect(wrapper.findAll("#add-label-options option")).toHaveLength(2);
    expect(wrapper.text()).toContain("Rp");
  });

  it("menyimpan transaksi baru lalu menutup modal", async () => {
    vi.mocked(cashFlowApi.addCashFlow).mockResolvedValue(1);
    const { wrapper } = await renderWithProviders(AddModal, { props: { open: true } });

    await fillAndSubmit(wrapper);

    expect(cashFlowApi.addCashFlow).toHaveBeenCalledWith({
      type: "outflow",
      source: "savings",
      label: "alat-elektronik",
      nominal: 400000,
      description: "Keyboard",
    });
    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(showSuccessDialog).toHaveBeenCalledWith("Catatan arus kas berhasil ditambahkan");
    expect((wrapper.find("#add-label").element as HTMLInputElement).value).toBe("");
  });

  it("menampilkan error dan tetap terbuka ketika gagal", async () => {
    vi.mocked(cashFlowApi.addCashFlow).mockRejectedValue(new Error("Data tidak valid"));
    const { wrapper } = await renderWithProviders(AddModal, { props: { open: true } });

    await fillAndSubmit(wrapper);

    expect(showErrorDialog).toHaveBeenCalledWith("Data tidak valid", "Gagal menambahkan transaksi");
    expect(wrapper.emitted("saved")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("memancarkan close dari tombol tutup dan batal", async () => {
    const { wrapper } = await renderWithProviders(AddModal, { props: { open: true } });

    await wrapper.find('[data-testid="add-modal-close"]').trigger("click");
    await wrapper.findAll("button").find((b) => b.text() === "Batal")!.trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(2);
  });

  it("menampilkan status menyimpan", async () => {
    const { wrapper } = await renderWithProviders(AddModal, {
      props: { open: true },
      initialState: { cashFlows: { isCashFlowAdd: true } },
    });
    const submit = wrapper.find('[data-testid="add-modal-submit"]');
    expect(submit.text()).toContain("Menyimpan...");
    expect(submit.attributes("disabled")).toBeDefined();
  });
});
