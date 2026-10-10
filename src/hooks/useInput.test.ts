import { describe, expect, it } from "vitest";
import { useInput } from "./useInput";

describe("useInput", () => {
  it("menyimpan nilai awal", () => {
    const [value] = useInput("awal");
    expect(value.value).toBe("awal");
  });

  it("memperbarui nilai dari event input", () => {
    const [value, onChange] = useInput("");
    const input = document.createElement("input");
    input.value = "halo";
    input.addEventListener("input", onChange);
    input.dispatchEvent(new Event("input"));
    expect(value.value).toBe("halo");
  });

  it("memperbarui nilai secara langsung dan dapat di-reset", () => {
    const [value, onChange, reset] = useInput(10);
    onChange(25);
    expect(value.value).toBe(25);
    reset();
    expect(value.value).toBe(10);
  });
});
