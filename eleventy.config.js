import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

const slug = (s) =>
  String(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function (eleventyConfig) {
  // Original photos are NOT copied to the site: the transform below writes resized WebP/JPEG to /img/.
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });

  // "<!--more-->" separates the teaser from the rest of a post
  eleventyConfig.setFrontMatterParsingOptions({
    excerpt: true,
    excerpt_separator: "<!--more-->",
  });

  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/posts/*.md").sort((a, b) => b.date - a.date)
  );

  // [{ tag, slug, posts }] sorted by popularity
  eleventyConfig.addCollection("tagList", (api) => {
    const map = new Map();
    for (const p of api.getFilteredByGlob("src/posts/*.md")) {
      for (const t of p.data.tags || []) {
        if (!map.has(t)) map.set(t, []);
        map.get(t).push(p);
      }
    }
    return [...map.entries()]
      .map(([tag, posts]) => ({
        tag,
        slug: slug(tag),
        posts: posts.sort((a, b) => b.date - a.date),
      }))
      .sort((a, b) => b.posts.length - a.posts.length || a.tag.localeCompare(b.tag));
  });

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    // local /images/... paths are resolved against src/
    extensions: "html",
    formats: ["webp", "jpeg"],
    widths: [480, 960, 1600, 2400],
    outputDir: "_site/img/",
    urlPath: "/img/",
    failOnError: true,
    sharpOptions: { animated: false },
    defaultAttributes: {
      loading: "lazy",
      decoding: "async",
      sizes: "(min-width: 72rem) 70rem, 100vw",
    },
  });

  eleventyConfig.addFilter("slug", slug);
  // [newer, older] neighbours of a post in the posts collection
  eleventyConfig.addFilter("adjacent", (posts, url) => {
    const i = posts.findIndex((p) => p.url === url);
    return { newer: i > 0 ? posts[i - 1] : null, older: i >= 0 && i < posts.length - 1 ? posts[i + 1] : null };
  });
  eleventyConfig.addFilter("hasCover", (posts) => posts.filter((p) => p.data.cover));
  // "Spiaggia di Cala Fuili, Sentiero ..., 08022 Dorgali NU, Italy" -> "Spiaggia di Cala Fuili, Italy"
  eleventyConfig.addFilter("placeShort", (name) => {
    const parts = String(name || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (parts.length) parts[0] = parts[0].replace(/^\d+\s+/, "");
    return parts.length > 2 ? `${parts[0]}, ${parts[parts.length - 1]}` : parts.join(", ");
  });
  eleventyConfig.addFilter("country", (loc) => (loc && loc.name ? loc.name.split(",").pop().trim() : ""));
  eleventyConfig.addFilter("dateFmt", (d, opts) =>
    new Intl.DateTimeFormat("en-GB", opts || { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d))
  );
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());
  eleventyConfig.addFilter("year", (d) => new Date(d).getUTCFullYear());
  eleventyConfig.addFilter("excerptOf", (page) => page.excerpt || "");
  eleventyConfig.addFilter("mapPoints", (posts) =>
    posts
      .filter((p) => p.data.location && Number.isFinite(p.data.location.lat))
      .map((p) => ({
        title: p.data.title,
        url: p.url,
        date: new Date(p.date).toISOString().slice(0, 10),
        place: p.data.location.name,
        lat: p.data.location.lat,
        lng: p.data.location.lng,
      }))
  );
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("groupByYear", (posts) => {
    const out = {};
    for (const p of posts) (out[new Date(p.date).getUTCFullYear()] ||= []).push(p);
    return Object.entries(out).sort((a, b) => b[0] - a[0]);
  });

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "posts", limit: 30 },
    metadata: {
      language: "en",
      title: "Marcel's Adventures",
      subtitle: "Travel stories and pictures",
      base: "https://travels.marcelgerber.ch/",
      author: { name: "Marcel Gerber" },
    },
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
