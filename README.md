# Hanis Beauty Academy

A responsive Persian landing page and SEO-ready editorial journal for Hanis Beauty Academy. Run locally with `python3 -m http.server 8000 --bind 0.0.0.0` and open the site in a browser.

The consultation form is a front-end prototype and does not transmit or store submissions. Connect it to an approved backend or contact channel before launch. Course, service, and editorial descriptions should be reviewed before production, and placeholder domain URLs in `sitemap.xml` and `robots.txt` should be updated to the final production domain.

## Hero video
The hero uses the supplied local `assets/InShot_20261030_223328747.mp4`. Scrolling scrubs the muted video and reveals the title sequence. The local poster is displayed if the video cannot load or the visitor prefers reduced motion. Before publishing, confirm that the supplied video and its contents are licensed for use.

## Editorial articles & ambient video background (`#articles`)
The articles section (`#articles`) plays `assets/InShot_20261030_230402144.mp4` (`720x1280` with local poster `assets/articles-poster.jpg`) as a soft, calm 30%-opacity (`opacity: 0.3`, `playbackRate: 0.6`) ambient background behind 5 semantic Persian beauty guides (`BlogPosting` microdata + Schema.org JSON-LD `@graph` with `VideoObject`, `Blog`, `FAQPage`, and `BreadcrumbList`), category filtering, Persian-normalized instant search, deep-linkable reader URLs (`#article-...`), and `sitemap.xml` video indexing.
