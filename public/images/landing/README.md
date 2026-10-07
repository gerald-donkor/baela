`globe.png` is the user-supplied visual reference. The WebGL globes use surveyed
geography with procedural atmospheric scattering and network connections.

`land-points.json` contains uniformly spaced land coordinates derived from the
public domain [Natural Earth 1:50m country dataset](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson).
`country-borders.json` retains coastlines and country boundaries, with shared
segments drawn once. Both WebGL globes and their SVG fallbacks use this data.
No geography downloads are needed at runtime.

To regenerate the data and both SVG fallbacks, download that country GeoJSON
and run these commands from the repository root:

```sh
node scripts/generate-globe-points.mjs /path/to/ne_50m_admin_0_countries.geojson
node scripts/generate-globe-stills.mjs
```

The still generator updates `public/images/landing/hero-globe.svg` and
`public/images/auth/globe.svg`. Regenerate them whenever the geography changes.
