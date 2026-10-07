# Authentication provider logos

- `google.svg` uses the unchanged mark paths, mask, and color gradients from Google's official [sign-in assets](https://developers.google.com/static/identity/images/signin-assets.zip). The SVG viewport isolates the 20px logo from the supplied square button. See [Google's branding guidelines](https://developers.google.com/identity/branding-guidelines).
- `github-black.svg` and `github-white.svg` are the unmodified Invertocat SVGs from [GitHub's logo bundle](https://brand.github.com/GitHub_Logos.zip). The auth buttons choose the corresponding variant for light and dark themes. See [GitHub's logo guidelines](https://brand.github.com/foundations/logo).

These assets are served locally so sign-in buttons do not depend on third-party image requests.

## Globe artwork

`globe.svg` is Baela’s deterministic still artwork for the authentication globe. It uses the same land coordinates as the landing hero and the same starting orientation as the Three.js authentication scene. Regenerate it from the repository root with `node scripts/generate-auth-globe.mjs`.

The still appears before WebGL is ready, when WebGL is unavailable, and when reduced motion is enabled. The live scene reuses the landing hero’s connection trails and atmospheric lighting, with a complete sphere and two orbital paths. Animation pauses when the globe is outside the viewport or the document is hidden; the renderer and its GPU resources are disposed when leaving the page. The visual panel is hidden on small screens to keep account actions immediately accessible.
