import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("~/features/cashflows/api/cashFlowApi", () => ({
  default: { updateCashFlow: vi.fn() },
}));
vi.mock("~/helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/helpers/toolsHelper")>()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import cashFlowApi from "~/features/cashflows/api/cashFlowApi";
import { showErrorDialog, showSuccessDialog } from "~/helpers/toolsHelper";
import type { CashFlow } from "~/features/cashflows/states/cashFlowsStore";
import { renderWithProviders } from "~/test-utils";
import ChangeModal from "./ChangeModal.vue";

const cashFlow: CashFlow = {
  id: 7,
  user_id: 1,
  type: "outflow",
  source: "loans",
  label: "cicilan",
  description: "Cicilan motor",
  nominal: 750000,
  created_at: "2024-10-05T11:26:45.000000Z",
  updated_at: "2024-10-05T11:26:45.000000Z",
};

const value = (wrapper: { find: (s: string) => { element: Element } }, selector: string) =>
  (wrapper.find(selector).element as HTMLInputElement).value;

describe("ChangeModal", () => {
  it("tidak dirender saat tertutup atau tanpa data", async () => {
    const closed = await renderWithProviders(ChangeModal, { props: { open: false, cashFlow } });
    expect(closed.wrapper.find('[role="dialog"]').exists()).toBe(false);

    const empty = await renderWithProviders(ChangeModal, { props: { open: true, cashFlow: null } });
    expect(empty.wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("mengisi form dengan data transaksi ketika dibuka", async () => {
    const { wrapper } = await renderWithProviders(ChangeModal, {
      props: { open: false, cashFlow },
      initialState: { cashFlows: { labels: ["cicilan"] } },
    });
    await wrapper.setProps({ open: true });

    expect(wrapper.text()).toContain("#7");
    expect(value(wrapper, "#change-type")).toBe("outflow");
    expect(value(wrapper, "#change-source")).toBe("loans");
    expect(value(wrapper, "#change-label")).toBe("cicilan");
    expect(value(wrapper, "#change-nominal")).toBe("750000");
    expect(value(wrapper, "#change-description")).toBe("Cicilan motor");
    expect(wrapper.findAll("#change-label-options option")).toHaveLength(1);
  });

  it("menyimpan perubahan transaksi", async () => {
    vi.mocked(cashFlowApi.updateCashFlow).mockResolvedValue("Berhasil mengubah data");
    const { wrapper } = await renderWithProviders(ChangeModal, { props: { open: true, cashFlow } });

    await wrapper.find("#change-type").setValue("inflow");
    await wrapper.find("#change-source").setValue("cash");
    await wrapper.find("#change-label").setValue(" bonus ");
    await wrapper.find("#change-nominal").setValue("");
    expect(wrapper.text()).toContain("Rp");
    await wrapper.find("#change-nominal").setValue("900000");
    await wrapper.find("#change-description").setValue(" Bonus tahunan ");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(cashFlowApi.updateCashFlow).toHaveBeenCalledWith(7, {
      type: "inflow",
      source: "cash",
      label: "bonus",
      nominal: 900000,
      description: "Bonus tahunan",
    });
    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil mengubah data");
  });

  it("menampilkan error ketika gagal menyimpan", async () => {
    vi.mocked(cashFlowApi.updateCashFlow).mockRejectedValue(new Error("Data tidak valid"));
    const { wrapper } = await renderWithProviders(ChangeModal, { props: { open: true, cashFlow } });

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(showErrorDialog).toHaveBeenCalledWith("Data tidak valid", "Gagal memperbarui transaksi");
    expect(wrapper.emitted("saved")).toBeUndefined();
  });

  it("memancarkan close dan menampilkan status menyimpan", async () => {
    const { wrapper } = await renderWithProviders(ChangeModal, {
      props: { open: true, cashFlow },
      initialState: { cashFlows: { isCashFlowChange: true } },
    });

    expect(wrapper.find('[data-testid="change-modal-submit"]').text()).toContain("Menyimpan...");
    await wrapper.find('[data-testid="change-modal-close"]').trigger("click");
    await wrapper.findAll("button").find((b) => b.text() === "Batal")!.trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(2);
  });
});
