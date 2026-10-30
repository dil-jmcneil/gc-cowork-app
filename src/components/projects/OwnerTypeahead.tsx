import { Autocomplete, TextField, useTheme, type Theme } from "@mui/material";
import { useMemo, useState } from "react";

import { suggestOwners, type TaskOwner } from "@/projects/people";

type UserLookup = Theme["presets"]["AutocompletePresets"]["userLookup"];
/** The preset's User type; its OptionType enum isn't exported, but its runtime value is "user". */
type PresetOption = Parameters<UserLookup["renderOption"]>[1];
type PresetItemProps = Parameters<UserLookup["renderOption"]>[0];

/** Shape the Atlas userLookup presets render: `email` is the secondary line. */
type LookupOption = TaskOwner & { email: string; type: "user" };
const asPreset = (o: LookupOption) => o as unknown as PresetOption;

function toOption(owner: TaskOwner): LookupOption {
  return { ...owner, email: owner.detail, type: "user" };
}

/**
 * Atlas User lookup for a task owner. Searches the directory, and accepts an
 * email address or an @handle (Slack or Teams) for people outside it.
 */
export function OwnerTypeahead({
  value,
  onChange,
  ariaLabel,
}: {
  value: TaskOwner;
  onChange: (owner: TaskOwner) => void;
  ariaLabel: string;
}) {
  const { presets } = useTheme();
  const userLookup = presets.AutocompletePresets.userLookup;
  const [inputValue, setInputValue] = useState(value.label);
  // Stable identity: a new value object each render makes Autocomplete reset the input.
  const selected = useMemo(() => toOption(value), [value]);
  const isTyping = inputValue !== value.label;
  const options = suggestOwners(isTyping ? inputValue : "").map(toOption);

  return (
    <Autocomplete<LookupOption, false, true, false>
      size="small"
      fullWidth
      disableClearable
      value={selected}
      inputValue={inputValue}
      onInputChange={(_, next) => setInputValue(next)}
      onChange={(_, next) => {
        onChange({ id: next.id, label: next.label, detail: next.detail, kind: next.kind });
        setInputValue(next.label);
      }}
      onBlur={() => setInputValue(value.label)}
      options={options}
      filterOptions={(o) => o}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      renderOption={(props, option) =>
        userLookup.renderOption(props as unknown as PresetItemProps, asPreset(option))
      }
      noOptionsText="Type a name, email, or @handle"
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Name, email, or @handle"
          slotProps={{
            htmlInput: { ...params.inputProps, "aria-label": ariaLabel },
            input: {
              ...params.InputProps,
              startAdornment: userLookup.type.single.getStartAdornment(asPreset(selected), inputValue),
            },
          }}
        />
      )}
    />
  );
}
