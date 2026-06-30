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

  const inputBase = [
    "flex-1 rounded-lg border px-3 py-2 text-sm text-gray-800",
    "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent",
  ].join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-xs text-gray-400 font-mono select-none">
              {index + 1}.
            </span>

            <input
              type="text"
              className={`${inputBase} ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
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
                className="px-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none text-xs"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === items.length - 1}
                title="Вниз"
                className="px-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none text-xs"
              >
                ▼
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleRemove(index)}
              title="Удалить"
              className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors text-sm leading-none"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-0.5 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium w-fit"
      >
        <span className="text-base leading-none">+</span> Добавить приложение
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
