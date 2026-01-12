# Implementation Code

## Plan Scrape

```javascript
async function planScrape(mode) {
  const sources = await getSourcesToScrape(mode);
  const links = await getPendingLinks();

  return {
    sources,
    links,
    estimate: {
      sources: sources.length,
      links: links.length,
      estimated_time: (sources.length + links.length) * 0.5,
      estimated_cost: (sources.length + links.length) * 0.05
    }
  };
}
```

## Scrape and Extract

```javascript
async function scrapeAndExtract(source) {
  const pattern = await getBestPattern(source.type);
  const content = await firecrawl.scrape(source.url);
  const extracted = await claude.extract(content, pattern.prompt);
  const quality = evaluateQuality(extracted);

  await updateLearning(source, pattern, quality);
  return { extracted, quality };
}
```

## Store and Learn

```javascript
async function storeAndLearn(source, extracted, quality) {
  const stored = await storeEntities(extracted);

  await updateSourceRegistry(source, {
    last_scraped_at: new Date(),
    scrape_count: source.scrape_count + 1,
    quality_score: updateAverage(source.quality_score, quality.score),
    child_links: extracted.links
  });

  for (const link of extracted.links) {
    await addDiscoveredLink(link, source.url);
  }

  await updatePatternSuccess(pattern, quality);
  return stored;
}
```

## Scheduling

- **Daily (auto):** High-priority sources, pending links
- **Weekly:** All government sources, gap analysis
- **Monthly:** Pattern review, source pruning
