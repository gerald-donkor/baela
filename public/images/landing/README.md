`globe.png` is the user-supplied visual reference, surface texture, starfield,
and static fallback. Its stylized world map is reconstructed on the front
hemisphere with an inverse orthographic projection. This preserves the
artwork's continent arrangement and luminous dot pattern as the sphere turns.
The photographed rim fades into procedural atmospheric scattering, keeping
the horizon fixed while the surface and network connections rotate together.

`land-points.json` contains uniformly spaced land coordinates derived from the
public domain [Natural Earth 1:110m land dataset](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson).
It supplies the unseen back of the sphere as it rotates past the photographed
hemisphere. No geography downloads are needed at runtime.

To regenerate it, download that GeoJSON and run:

```sh
node scripts/generate-globe-points.mjs /path/to/ne_110m_land.geojson
```
