import { describe, it, expect, vi } from "vitest";
import { clickableRowProps, activateOnKey } from "../a11y-clickable";

function keyEvent(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as Parameters<
    ReturnType<typeof clickableRowProps>["onKeyDown"]
  >[0];
}

describe("clickableRowProps", () => {
  it("entrega semantica de controle focavel", () => {
    const props = clickableRowProps(() => {});
    expect(props.role).toBe("button");
    expect(props.tabIndex).toBe(0);
  });

  it("ativa com Enter e com Espaco, consumindo o evento", () => {
    const onActivate = vi.fn();
    const props = clickableRowProps(onActivate);

    props.onClick();
    expect(onActivate).toHaveBeenCalledTimes(1);

    const enter = keyEvent("Enter");
    props.onKeyDown(enter);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(onActivate).toHaveBeenCalledTimes(2);

    const space = keyEvent(" ");
    props.onKeyDown(space);
    expect(onActivate).toHaveBeenCalledTimes(3);
  });

  it("ignora teclas que nao ativam", () => {
    const onActivate = vi.fn();
    const props = clickableRowProps(onActivate);
    const tab = keyEvent("Tab");
    props.onKeyDown(tab);
    expect(onActivate).not.toHaveBeenCalled();
    expect(tab.preventDefault).not.toHaveBeenCalled();
  });
});

describe("activateOnKey", () => {
  function activateEvent(key: string, targetIsRow = true) {
    const row = document.createElement("div");
    const click = vi.fn();
    Object.defineProperty(row, "click", { value: click });
    const event = {
      key,
      currentTarget: row,
      target: targetIsRow ? row : document.createElement("button"),
      preventDefault: vi.fn(),
    } as unknown as Parameters<typeof activateOnKey>[0];
    return { event, click };
  }

  it("ativa a linha quando o foco esta na propria linha", () => {
    const { event, click } = activateEvent("Enter");
    activateOnKey(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("nao ativa a linha quando o Enter vem de um controle interno", () => {
    const { event, click } = activateEvent(" ", false);
    activateOnKey(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });
});
