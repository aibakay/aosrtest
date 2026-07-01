import { Input } from "./ui/Input";

interface Props {
  label: string;
  required?: boolean;
  value: string; // newline-separated items
  onChange: (value: string) => void;
  error?: string;
}

function serialize(items: string[]): string {
  return items.join("\n");
}

function parse(value: string): string[] {
  const parts = value ? value.split("\n") : [];
  return parts.length > 0 ? parts : [""];
}

export function AttachmentsListField({ label, required, value, onChange, error }: Props) {
  const items = parse(value);

  const update = (next: string[]) => {
    onChange(serialize(next.length ? next : [""]));
  };

  const handleChange = (index: number, text: string) => {
    const next = [...items];
    next[index] = text;
    update(next);
  };

  const handleAdd = () => {
    update([...items, ""]);
  };

  const handleRemove = (index: number) => {
    if (items.length === 1) {
      update([""]);
      return;
    }
    update(items.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    update(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    update(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-ink-700">
        {label}
        {required && <span className="text-danger-500">*</span>}
      </label>

      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-6 shrink-0 select-none text-right font-mono text-xs text-ink-400">
              {index + 1}.
            </span>

            <Input
              type="text"
              className="flex-1"
              error={!!error}
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={`Приложение ${index + 1}`}
            />

            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                title="Вверх"
                aria-label="Переместить вверх"
                className="px-1 text-xs leading-none text-ink-400 hover:text-ink-600 disabled:opacity-20"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === items.length - 1}
                title="Вниз"
                aria-label="Переместить вниз"
                className="px-1 text-xs leading-none text-ink-400 hover:text-ink-600 disabled:opacity-20"
              >
                ▼
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleRemove(index)}
              title="Удалить"
              aria-label="Удалить приложение"
              className="rounded p-1 text-sm leading-none text-ink-300 transition-colors hover:text-danger-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-0.5 flex w-fit items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <span className="text-base leading-none">+</span> Добавить приложение
      </button>

      {error && <p className="text-xs text-danger-700">{error}</p>}
    </div>
  );
}
