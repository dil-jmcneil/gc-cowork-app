import { Box } from "@mui/material";
import facetWave from "@/assets/refreshed/facet-wave.svg";

/** Original Diligent facet-wave artwork: 1.8s staggered opacity, static for reduced motion. */
export function BrandSpinner({ size = 16 }: { size?: number }) {
  return (
    <Box component="img" src={facetWave} alt="" aria-hidden="true"
      sx={{ display: "block", flexShrink: 0, width: size, height: size * 42 / 38 }}
    />
  );
}
