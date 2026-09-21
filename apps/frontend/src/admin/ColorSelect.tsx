import { WRISTBAND_COLORS, wristbandColor } from '@bandit/shared';
import { inputClass } from './api';

export default function ColorSelect({ value }: { value?: string | null }) {
  const matched = wristbandColor(value);
  return (
    <label className="block text-sm">
      Colour
      <select name="color" required defaultValue={matched?.name ?? ''} className={inputClass}>
        <option value="" disabled>
          Choose a colour
        </option>
        {WRISTBAND_COLORS.map((color) => (
          <option key={color.name} value={color.name}>
            {color.name}
          </option>
        ))}
      </select>
      {value && !matched && (
        <span className="mt-2 block text-xs text-amber-800">
          Existing colour: {value}. Choose a supported colour before saving this variant.
        </span>
      )}
    </label>
  );
}
