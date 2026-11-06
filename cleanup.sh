# 1. Keep the local files but stop tracking them
printf '\n# one-off migration tools and data (kept locally, not published)\nscripts/\nsource/\nimages-*.json\nupgrade-report.json\nmissing-originals.md\ndrafts/\n' >> .gitignore
git rm -r -q --cached --ignore-unmatch scripts source images-manifest.json images-ambiguous.json images-failed.json upgrade-report.json missing-originals.md

# 2. Remove npm scripts and packages only the one-off tools used
npm pkg delete scripts.convert scripts.images
npm uninstall fast-xml-parser turndown jsdom @fontsource/barlow-condensed @fontsource/source-serif-4

# 3. Replace the README, which mentions the tools
cat > README.md <<'EOF'
# travels.marcelgerber.ch

Travel blog, built with [Eleventy](https://www.11ty.dev/) and published with GitHub Pages.

- `src/posts/` the stories (Markdown), `src/images/` their photos
- `npm start` preview locally, `npm run build` build into `_site/`
- Pushing to `main` deploys the site (`.github/workflows/deploy.yml`)
EOF

# 4. Rewrite the history as a single clean commit, then publish it
git checkout --orphan clean
git add -A
git commit -m "Travels blog (Eleventy)"
git branch -M main
git push --force origin main
